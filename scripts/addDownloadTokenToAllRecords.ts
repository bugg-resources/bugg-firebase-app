require("./initFirebase");
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { AudioRecord } from "./types";

async function run() {
  let count = 0;

  let hasMore = true;
  let after = null as any;
  while (hasMore) {
    let query = admin
      .firestore()
      .collection("audio")
      .orderBy("createdAt", "asc")
      .limit(100);
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
      let promises = [];
      for (let snap of audioSnaps.docs) {
        count = count + 1;

        let record = snap.data() as AudioRecord;
        if (!record.downloadToken) {
          promises.push(
            snap.ref.update({
              downloadToken: uuidv4(),
            })
          );
        }

        if (count % 1000 === 0) {
          console.log(count);
          console.log(snap.id);
        }
        after = snap;
      }

      await Promise.all(promises);
    }
  }
}

run();
