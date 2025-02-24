import * as PubSub from "@google-cloud/pubsub";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { Analysis, AudioRecord, Task, Trigger } from "./types";

/***
 * Responsible for starting analyses running that are watching for new audio
 */
export const analysisTriggerNewAudio = functions
  .region("europe-west2")
  .firestore.document(`audio/{audioId}`)
  .onCreate(async (snapshot, context) => {
    let audioRec = snapshot.data() as AudioRecord;

    // Fetch all the analyses that need to be triggered when a new audio file is uploaded
    let analysesSnaps = await admin
      .firestore()
      .collection("analyses")
      .where("trigger", "==", "new_audio")
      .get();
    let analyses = analysesSnaps.docs.map(
      (s) => Object.assign({}, s.data(), { id: s.id }) as Analysis
    );

    console.log(
      `Found ${analyses.length} analyse(s) to trigger`,
      analyses.map((a) => a.id)
    );

    for (let a of analyses) {
      if (a.url) {
        await dispatchTask(a, audioRec, "new_audio");
      }
      if (a.topic) {
        let client = new PubSub.PubSub();
        let messageId = await client
          .topic(a.topic)
          .publish(Buffer.from(audioRec.id));
        console.log(
          `Published ${audioRec.id} to topic ${a.topic}. Message ID = ${messageId}`
        );
      }
    }
  });

export async function dispatchTask(
  analysis: Analysis,
  audioRec: AudioRecord,
  trigger: Trigger
) {
  // Tasks are added to the tasks collection. Workers then poll for tasks.

  let taskId = admin.firestore().collection(`tasks`).doc().id;
  let t: Task = {
    id: taskId,
    createdAt: admin.firestore.Timestamp.now(),
    analysisId: analysis.id!,
    recorder: audioRec.recorder,
    project: audioRec.project,
    audioId: audioRec.id,
    audioUri: audioRec.uri,
    trigger: trigger,
    status: "SCHEDULED",
  };

  await admin.firestore().doc(`tasks/${taskId}`).set(t);

  // let tasksClient = new CloudTasksClient();

  // const gcsproject = "bugg-301712";
  // const location = "europe-west1";
  // // Construct the fully qualified queue name.
  // const parent = tasksClient.queuePath(gcsproject, location, "analyses");

  // const payload = JSON.stringify({
  //   analysisId: analysis.id,
  //   audioId: audioRec.id,
  //   recorder: audioRec.recorder,
  //   project: audioRec.project,
  //   uri: audioRec.uri,
  //   path: audioRec.path,
  //   bucket: `bugg-301712.appspot.com`,
  // });

  // const task: google.cloud.tasks.v2.ITask = {
  //   httpRequest: {
  //     httpMethod: "POST",
  //     url: analysis.url,
  //     headers: { "Content-Type": "application/json" },
  //     body: Buffer.from(payload).toString("base64"),
  //   },
  //   // can be used for deduplication if we need
  //   // name: `${audioRec.id}-${analysisServiceUrl}`,
  // };

  // // Send create task request.
  // console.log("Sending task:");
  // console.log(task);
  // const request = { parent, task };
  // const [response] = await tasksClient.createTask(request);
  // console.log(`Created task ${response.name}`);
}
