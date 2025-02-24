require("./initFirebase");
import * as PubSub from "@google-cloud/pubsub";
import * as admin from "firebase-admin";
import { AudioRecord } from "./types";

const TOPIC = "projects/bugg-301712/topics/clippy";

let client = new PubSub.PubSub();

// Scan through all the audio records and create a pubsub task

async function run() {
  let count = 0;

  let hasMore = true;
  let after = null;
  while (hasMore) {
    let query = admin
      .firestore()
      .collection("audio")
      .where("hasDetections", "==", true)
      .limit(500);
    if (after) {
      query = query.startAfter(after);
    }
    let audioSnaps = await query.get();

    if (audioSnaps.empty) {
      hasMore = false;
      console.log("FIN", count);
      process.exit(0);
      return;
    } else {
      for (let snap of audioSnaps.docs) {
        let audioRecord = snap.data() as AudioRecord;

        for (let detection of audioRecord.detections) {
          await client
            .topic(TOPIC)
            .publish(
              Buffer.from(
                JSON.stringify({ audioId: snap.id, detectionId: detection.id })
              )
            );
          count++;

          if (count % 1000 === 0) {
            console.log(snap.id, count);
          }
        }

        after = snap;
      }
    }
  }
}

run();
