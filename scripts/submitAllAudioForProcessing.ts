require("./initFirebase");
import * as PubSub from "@google-cloud/pubsub";
import * as admin from "firebase-admin";

const TOPIC = "projects/bugg-301712/topics/analyses.anomaly-detection";

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
      .where("recorder", "==", "bugg_RPiID-1000000080b7644f")
      // .where("analysesPerformed", "not-in", ["vggish"])
      // .orderBy("analysesPerformed")
      .limit(100);
    if (after) {
      query = query.startAfter(after);
    }
    let audioSnaps = await query.get();

    if (audioSnaps.empty) {
      hasMore = false;
      console.log("FIN");
      process.exit(0);
      return;
    } else {
      for (let snap of audioSnaps.docs) {
        await client.topic(TOPIC).publish(Buffer.from(snap.id));
        count++;
        console.log(count, snap.id);

        after = snap;
      }
    }
  }
}

run();
