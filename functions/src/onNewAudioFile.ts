// Add a record into the Firestore database
// Look for any analyses which need to be triggered
// Create a task for each

import * as crypto from "crypto";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { AudioRecord, Recorder } from "./types";

export const onNewAudioFile = functions
  .region("europe-west2")
  .storage.bucket("bugg-301712.appspot.com")
  .object()
  .onFinalize(async (obj, context) => {
    // This audio has been checked that it links to a profile and copied over from the bugg-audio-dropbox bucket
    // It's path will look like: /audio/${projectId}/${recorderId}/${configId}/${fileName}
    // all other updates should be ignored

    if (!obj.name) {
      console.log("Object had no path name");
      return;
    }

    let path = obj.name;
    let parts = path.split("/");
    if (!path.includes("/") || parts.length !== 5) {
      console.log("incorrect name format", obj.name);
      return;
    }

    if (
      !path.startsWith("audio/") ||
      !path.endsWith(".mp3") ||
      obj.contentType !== "audio/mpeg"
    ) {
      console.log("file wasn't an audio file", path, obj.contentType);
      return;
    }

    let [root, projectId, recorderId, configId, fileName] = parts;
    let filenameParts = fileName.split(".");
    let extension = filenameParts.pop();
    let t = filenameParts.join(".");
    let time = t.replace(/_/g, ":");

    console.log(
      "New audio received: ",
      JSON.stringify({
        root,
        projectId,
        recorderId,
        configId,
        fileName,
        time,
        extension,
      })
    );

    let shasum = crypto.createHash("sha1");
    let audioRecordId = shasum.update(path).digest("hex").substr(0, 20);

    // let audioRecordId = admin.firestore().collection(`audio`).doc().id;

    let date = new Date(time);
    let uploadTime = admin.firestore.Timestamp.fromDate(date);

    let objectUri = `gs://bugg-301712.appspot.com/audio/${projectId}/${recorderId}/${configId}/${fileName}`;

    let lastUpload = {
      uploadedAt: uploadTime,
      uri: objectUri,
    } as any;

    let recorderDocPath = `projects/${projectId}/recorders/${recorderId}`;
    let recorderSnap = await admin.firestore().doc(recorderDocPath).get();

    let recorder: Recorder | null = null;

    if (!recorderSnap.exists) {
      // Create the recorder.
      let newRecorder: Recorder = {
        createdAt: admin.firestore.Timestamp.now(),
        lastUpload: lastUpload,
        deviceId: recorderId,
        name: "UNSET",
        project: projectId,
        configId: configId,
      };

      await admin.firestore().doc(recorderDocPath).set(newRecorder, {
        merge: true,
      });
      console.log("Created recorder", JSON.stringify(newRecorder));

      // also update the config to state that it is in use
      await admin
        .firestore()
        .doc(`config/${configId}`)
        .set(
          {
            deployed: true,
            recorders: admin.firestore.FieldValue.arrayUnion(recorderId),
          },
          {
            merge: true,
          }
        );
    } else {
      recorder = recorderSnap.data() as Recorder;
      if (recorder.site) {
        lastUpload.id = audioRecordId;
      }
      // Already created, just update the last uploaded timestamp
      await admin.firestore().doc(recorderDocPath).set(
        { lastUpload: lastUpload, configId: configId },
        {
          merge: true,
        }
      );
      console.log("Added last upload time to recorder", recorderId);
    }

    // Set the project on the metadata for the audio so that user can access it.
    // Note - will need to exchange a token to be able to access these
    const storageRef = admin.storage().bucket(obj.bucket);
    await storageRef.file(obj.name).setMetadata({
      metadata: {
        projectId,
        recorderId,
        configId,
        recordedAt: time,
      },
    });

    if (!recorder?.site) {
      console.log(
        `Recorder ${recorderId} hasn't been assigned to a site. No audio record will be created.`
      );
      return;
    }

    if (recorder?.disabled) {
      console.log(
        `Recorder ${recorderId} is disabled. No audio record will be created.`
      );
      return;
    }

    // Create a record of the audio in firestore

    let audio: AudioRecord = {
      id: audioRecordId,
      analysesPerformed: [],
      createdAt: admin.firestore.Timestamp.now(),
      uploadedAt: uploadTime,
      project: projectId,
      recorder: recorderId,
      uri: objectUri,
      hasDetections: false,
      detections: [],
      site: recorder!.site!,
      location: recorder!.location!,
      config: configId,
      metadata: {},
      downloadToken: uuidv4(),
    };

    await admin.firestore().doc(`audio/${audioRecordId}`).create(audio);

    console.log("Created audio record", audioRecordId);
  });

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
