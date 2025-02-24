// Submit the birdnet detections to be reprocessed (because we wern't recording the confidence score previously)

import * as PubSub from "@google-cloud/pubsub";
import * as admin from "firebase-admin";

require("./initFirebase");

const TOPIC = "projects/bugg-301712/topics/analyses.birdnetlite";
let client = new PubSub.PubSub();

async function run() {
  let detectedSnaps = await admin
    .firestore()
    .collection("audio")
    .where("hasDetections", "==", true)
    .get();

  console.log("Count", detectedSnaps.size);

  for (let snap of detectedSnaps.docs) {
    console.log(snap.id);
    await client.topic(TOPIC).publish(Buffer.from(snap.id));
  }
}

run();
