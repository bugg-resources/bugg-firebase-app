const admin = require("firebase-admin");
const { PubSub } = require("@google-cloud/pubsub");
const { Storage } = require("@google-cloud/storage");
const fs = require("fs");
const addSeconds = require("date-fns/addSeconds");
const { firestore } = require("firebase-admin");
const csvWriter = require("csv-write-stream");

const pubSubClient = new PubSub();

subscriptionId = "clippy-sub";

admin.initializeApp();

async function processAudio(audioId, detectionId) {
  // Get the audio record from firestore
  let snapshot = await admin.firestore().doc(`audio/${audioId}`).get();
  let audioRec = snapshot.data();

  let detection = audioRec.detections.find((d) => d.id === detectionId);
  if (!detection) {
    throw new Error(
      `No detection with ID ${detectionId} found on audio ${audioId}`
    );
  }

  // Add this in the future after the initial import
  // if (detection.uri) {
  //   console.log(
  //     `Detection already has audio clip. Aborting. ${audioId} ${detectionId}`
  //   );
  //   return;
  // }

  // Download
  const storage = new Storage();
  let audioFile = `/tmp/${audioId}.mp3`;

  const options = {
    destination: audioFile,
  };

  let uriParts = audioRec.uri.split("/");
  let bucketName = uriParts[2];
  let fileName = uriParts.slice(3).join("/");

  // Downloads the file
  await storage.bucket(bucketName).file(fileName).download(options);

  // loudnorm actually requires 30s+ of audio which doesn't seem to work well with the clipping. We'll do it in two stages.

  let loudnormFile = `/tmp/${audioId}-${detectionId}-filter-loudnorm.mp3`;
  console.log("Running loudnorm", audioFile);
  await ffmpeg(["-i", `${audioFile}`, "-af", "loudnorm", `${loudnormFile}`]);

  // Clip
  let clipFile = `/tmp/${audioId}-${detectionId}.mp3`;
  console.log("Clipping", audioFile);
  await ffmpeg([
    "-ss",
    `${detection.start}`,
    "-t",
    `${detection.end - detection.start}`,
    "-i",
    `${audioFile}`,
    `${clipFile}`,
  ]);

  // Clip loudnorm
  let loudnormClipFile = `/tmp/${audioId}-${detectionId}-loudnorm-clip.mp3`;
  console.log("Clipping", loudnormFile);
  await ffmpeg([
    "-ss",
    `${detection.start}`,
    "-t",
    `${detection.end - detection.start}`,
    "-i",
    `${loudnormFile}`,
    `${loudnormClipFile}`,
  ]);

  fs.unlinkSync(audioFile);
  fs.unlinkSync(loudnormFile);

  // Upload the clips to storage
  await storage.bucket(bucketName).upload(clipFile, {
    destination: `detections/${audioId}/${detectionId}.mp3`,
    metadata: {
      metadata: { projectId: audioRec.project },
    },
  });

  await storage.bucket(bucketName).upload(loudnormClipFile, {
    destination: `detections/${audioId}/${detectionId}-loudnorm.mp3`,
    metadata: {
      metadata: { projectId: audioRec.project },
    },
  });

  fs.unlinkSync(clipFile);
  fs.unlinkSync(loudnormClipFile);

  let detectionUri = `gs://${bucketName}/detections/${audioId}/${detectionId}.mp3`;
  let detectionLoudnormUri = `gs://${bucketName}/detections/${audioId}/${detectionId}-loudnorm.mp3`;

  // Add a uri to the detection

  await admin.firestore().runTransaction(async (txn) => {
    let audioRef = admin.firestore().doc(`audio/${audioId}`);

    let audioSnapshot = await txn.get(audioRef);
    let audioRecord = audioSnapshot.data();

    let detections = audioRecord.detections || [];
    let detection = detections.find((d) => d.id === detectionId);

    if (!detection) {
      throw Error(
        `No detection with ID ${detectionId} on ${audioId}. Cannot add the clip uri ${detectionUri}`
      );
    }

    detection.uri = detectionUri;
    detection.uriLoudnorm = detectionLoudnormUri;

    // try and add the time too if it isn't there already
    if (!detection.time) {
      if (audioRecord.uploadedAt && detection.start !== undefined) {
        let d = audioRecord.uploadedAt.toDate();
        let time = addSeconds(d, detection.start);
        detection.time = time;
      }
    }

    txn.update(audioRef, {
      detections: detections,
    });

    console.log("Writing transaction...");
  });

  console.log(`Updated detection ${audioId} ${detectionId} ${detectionUri}`);
}

async function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    let spawn = require("child_process").spawn;

    let cmd = "ffmpeg";

    let proc = spawn(cmd, args);

    proc.stdout.on("data", function (data) {
      console.log(data);
    });

    proc.stderr.setEncoding("utf8");
    proc.stderr.on("data", function (data) {
      // ffmpeg writes out info logs to the error channel
      console.log(data);
    });

    proc.on("close", function () {
      console.log("finished ffmpeg");
      resolve();
    });
  });
}

function run() {
  // References an existing subscription
  const subscription = pubSubClient.subscription(subscriptionId, {
    flowControl: {
      maxMessages: 1,
    },
  });

  const messageHandler = async (message) => {
    // Clippy can handle both clipping audio files (it's original intention)
    // and exporting audio and detection records to a csv. We've merged the two to be more
    // efficient with resources.

    let jsonData = JSON.parse(message.data);

    if ("detectionId" in jsonData && "audioId" in jsonData) {
      let { audioId, detectionId } = jsonData;
      await processAudio(audioId, detectionId);
      message.ack();
      return;
    }

    if ("exportId" in jsonData) {
      let { exportId } = jsonData;
      await exportJob(exportId);
      message.ack();
      return;
    }

    console.error("Incorrect payload", message.data);
    throw new Error("Incorrect payload");
  };

  subscription.on("error", (error) => {
    console.error("Received error:", error);
    process.exit(1);
  });

  subscription.on("message", messageHandler);
}

run();

/// --- export code ---

/***
 *  exports either dections or audio from a project and stores it in a bucket for download later
 */
async function exportJob(exportId) {
  // Get the export record from firestore
  let snapshot = await admin.firestore().doc(`exports/${exportId}`).get();

  if (!snapshot.exists) {
    console.log("Job already has been deleted. Bailing.");
    return;
  }

  let exportRecord = snapshot.data();

  if (exportRecord.status === "COMPLETE") {
    console.log("Job already completed. Bailing.");
    return;
  }

  if (exportRecord.status === "PROCESSING") {
    console.log("Job processing somewhere else. Bailing.");
    return;
  }

  await admin.firestore().doc(`exports/${exportId}`).update({
    status: "PROCESSING",
    beganProcessing: firestore.Timestamp.now(),
  });

  let { type, from, to, projectId } = exportRecord;

  let query = admin
    .firestore()
    .collection("audio")
    .where("project", "==", projectId)
    .orderBy("uploadedAt", "desc")
    .limit(500);

  if (type === "detections") {
    query = query.where("hasDetections", "==", true);
  }

  if (from) {
    console.log("Applying from date", from.toDate());
    query = query.where("uploadedAt", ">=", from);
  }
  if (to) {
    console.log("Applying to date", to.toDate());
    query = query.where("uploadedAt", "<=", to);
  }

  let onProgress = async (recordsProcessed) => {
    await admin.firestore().doc(`exports/${exportId}`).update({
      recordsProcessed: recordsProcessed,
    });
  };

  let writer = csvWriter();
  writer.pipe(fs.createWriteStream(`/tmp/${exportId}.csv`));

  // Stream the data
  let itemCount = 0;
  if (type === "detections") {
    console.log("Exporting detections");
    itemCount = await exportDetections(query, onProgress, writer);
  } else {
    console.log("Exporting audio");
    itemCount = await exportAudioRecords(query, onProgress, writer);
  }
  writer.end();

  let fileName = [
    type,
    "export",
    projectId,
    from ? from.toDate().toISOString() : undefined,
    to ? to.toDate().toISOString() : undefined,
  ]
    .filter((i) => !!i)
    .join("-");

  let reader = fs.createReadStream(`/tmp/${exportId}.csv`);

  await zipFile(exportId, `${fileName}.csv`, reader);

  console.log("zipped", `${fileName}.csv`, `/tmp/${exportId}.zip`);

  console.log("Uploading");

  const storage = new Storage();
  let bucketName = `bugg-301712.appspot.com`;
  let destination = `exports/${projectId}/${exportId}/${fileName}.zip`;
  await storage.bucket(bucketName).upload(`/tmp/${exportId}.zip`, {
    destination,
    metadata: {
      metadata: {
        projectId: projectId,
      },
    },
  });

  console.log("uploaded", `/tmp/${exportId}.zip`);

  fs.unlinkSync(`/tmp/${exportId}.csv`);
  fs.unlinkSync(`/tmp/${exportId}.zip`);

  let uri = `gs://${bucketName}/${destination}`;
  await admin.firestore().doc(`exports/${exportId}`).update({
    status: "COMPLETE",
    uri,
    completedAt: firestore.Timestamp.now(),
    recordsProcessed: itemCount,
  });

  console.log("done");
  console.log(uri);
}

async function zipFile(exportId, fileName, csv) {
  const JSZip = require("jszip");
  let zip = new JSZip();

  return new Promise(async (resolve, reject) => {
    zip

      .file(fileName, csv)
      .generateNodeStream({
        type: "nodebuffer",
        streamFiles: true,
        compression: "DEFLATE",
      })
      .pipe(fs.createWriteStream(`/tmp/${exportId}.zip`))
      .on("error", (e) => {
        reject(e);
      })
      .on("finish", async function () {
        resolve();
      });
  });
}

async function exportDetections(query, onProgress, writer) {
  let hasMore = true;
  let after = null;

  let count = 0;
  while (hasMore) {
    if (after) {
      query = query.startAfter(after);
    }
    let audioSnaps = await query.get();

    if (audioSnaps.empty) {
      hasMore = false;
      console.error("Downloaded items:", count);
      return count;
    } else {
      for (let snap of audioSnaps.docs) {
        let record = snap.data();

        if (!record.location) {
          continue;
        }

        for (let detection of record.detections) {
          count = count + 1;
          let downloadLinkPrefix = `https://bugg-301712.web.app/download/${
            record.downloadToken || "MISSIGNO"
          }`;

          writer.write({
            id: `${record.id}${detection.id}`,
            analysis: detection.analysisId,
            tags: detection.tags.join(", "),
            start_secs: detection.start,
            end_secs: detection.end,
            confidence: detection.confidence || "",
            detected_time: detection.time?.toDate().toISOString() || "",
            clip_link: detection.uri
              ? `${downloadLinkPrefix}/${detection.uri?.replace(
                  "gs://bugg-301712.appspot.com/",
                  ""
                )}`
              : "",
            clip_loudnorm_link: detection.uriLoudnorm
              ? `${downloadLinkPrefix}/${detection.uriLoudnorm?.replace(
                  "gs://bugg-301712.appspot.com/",
                  ""
                )}`
              : "",

            audio_id: record.id,
            upload_time: record.uploadedAt.toDate().toISOString(),
            project: record.project,
            recorder: record.recorder,
            site: record.site,
            latitude: `${record.location.latitude}`,
            longitude: `${record.location.longitude}`,
            audio_link: `${downloadLinkPrefix}/${record.uri.replace(
              "gs://bugg-301712.appspot.com/",
              ""
            )}`,

            vggish_960ms_link: `${downloadLinkPrefix}/artifacts/vggish/${record.project}/${record.id}/raw_audioset_feats_960ms.npy`,
            vggish_4800ms_link: `${downloadLinkPrefix}/artifacts/vggish/${record.project}/${record.id}/raw_audioset_feats_4800ms.npy`,
            vggish_59520ms_link: `${downloadLinkPrefix}/artifacts/vggish/${record.project}/${record.id}/raw_audioset_feats_59520ms.npy`,
            vggish_299520ms_link: `${downloadLinkPrefix}/artifacts/vggish/${record.project}/${record.id}/raw_audioset_feats_299520ms.npy`,
          });

          if (count % 1000 === 0) {
            console.error(count);
            console.error(snap.id);

            await onProgress(count);
          }
        }

        after = snap;
      }
    }
  }
}

async function exportAudioRecords(query, onProgress, writer) {
  let hasMore = true;
  let after = null;
  let count = 0;
  while (hasMore) {
    if (after) {
      query = query.startAfter(after);
    }
    let audioSnaps = await query.get();

    if (audioSnaps.empty) {
      hasMore = false;
      console.error("Audio downloaded", count);
      return count;
    } else {
      for (let snap of audioSnaps.docs) {
        let record = snap.data();

        if (!record.location) {
          continue;
        }

        count = count + 1;
        let downloadLinkPrefix = `https://bugg-301712.web.app/download/${
          record.downloadToken || "MISSIGNO"
        }`;

        writer.write({
          audio_id: record.id,
          analyses_performed: record.analysesPerformed.join(", "),
          created_time: record.createdAt.toDate().toISOString(),
          upload_time: record.uploadedAt.toDate().toISOString(),
          project: record.project,
          recorder: record.recorder,
          config: record.config,
          site: record.site,
          latitude: `${record.location.latitude}`,
          longitude: `${record.location.longitude}`,
          audio_link: `${downloadLinkPrefix}/${record.uri.replace(
            "gs://bugg-301712.appspot.com/",
            ""
          )}`,

          has_detections: record.hasDetections === true,
          detections_count: record.detections.length || 0,
          detections: record.detections.map((d) =>
            d.tags.map((t) => `${d.analysisId}:${t}`).join(", ")
          ),

          vggish_960ms_link: `${downloadLinkPrefix}/artifacts/vggish/${record.project}/${record.id}/raw_audioset_feats_960ms.npy`,
          vggish_4800ms_link: `${downloadLinkPrefix}/artifacts/vggish/${record.project}/${record.id}/raw_audioset_feats_4800ms.npy`,
          vggish_59520ms_link: `${downloadLinkPrefix}/artifacts/vggish/${record.project}/${record.id}/raw_audioset_feats_59520ms.npy`,
          vggish_299520ms_link: `${downloadLinkPrefix}/artifacts/vggish/${record.project}/${record.id}/raw_audioset_feats_299520ms.npy`,
        });

        if (count % 1000 === 0) {
          console.error(count);
          console.error(snap.id);
          await onProgress(count);
        }

        after = snap;
      }
    }
  }
}
