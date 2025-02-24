import * as PubSub from "@google-cloud/pubsub";
import { firestore } from "firebase-admin";
import * as functions from "firebase-functions";
import { GMMFitRequest } from "./types";

// As audio arrives for inference it will create a job to fit a gmm if a model hasn't been created yet.
// As we want to allow for backfilling of audio at least 2 hours needs to have passed from that request before the job is started.
// This function checks for those requests and starts the job if the time has passed.
export const processAnomalyFitModelRequests = functions
  .region("europe-west2")
  .pubsub.schedule("every 1 hours")
  .onRun(async (context) => {
    let snapshot = await firestore()
      .collection("analyses/anomaly-detection/models")
      .where("status", "==", "pending")
      .where(
        "createdAt",
        "<",
        firestore.Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 2))
      )
      .get();

    for (let doc of snapshot.docs) {
      await queueRequest(doc);
    }

    // As processing takes to long we're no longer relying on the pubsub retires - messages are acked when processing is
    // started. So we must check for any models that didn't complete (say if a preemptable vm was killed) and retry them.

    let processingSnaps = await firestore()
      .collection("analyses/anomaly-detection/models")
      .where("status", "==", "processing")
      .where(
        "processingAt",
        "<",
        firestore.Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 8))
      )
      .get();

    for (let doc of processingSnaps.docs) {
      let request = doc.data() as GMMFitRequest;
      // max 5 attempts
      if (request.attempts < 6) {
        await queueRequest(doc);
      } else {
        await doc.ref.update({
          status: "failed",
          failedAt: firestore.Timestamp.now(),
        });
      }
    }
  });

async function queueRequest(doc: firestore.QueryDocumentSnapshot) {
  const model = doc.data() as GMMFitRequest;
  console.log(`Starting job to fit model ${model.filename}`);

  // publish message to cloud pub sub
  let client = new PubSub.PubSub();
  let messageId = await client.topic("analyses.anomaly-train-gmm").publish(
    Buffer.from(
      JSON.stringify({
        request: doc.id,
        project: model.project,
        recorder: model.recorder,
        from_iso_date: model.sourceDataStart.toDate().toISOString(),
        to_iso_date: model.sourceDataEnd.toDate().toISOString(),
      })
    )
  );
  console.log(
    `Message ${messageId} published. ${model.project}:${
      model.recorder
    } ${model.sourceDataStart.toDate().toISOString()} -> ${model.sourceDataEnd
      .toDate()
      .toISOString()}`
  );

  // update the model status to queued
  await doc.ref.update({
    queuedAt: firestore.Timestamp.now(),
    status: "queued",
    processingAt: null,
    completedAt: null,
    attempts: firestore.FieldValue.increment(1),
  });

  // note we don't need to retry requests that are stuck in processing as the pubsub message will be retried
}
