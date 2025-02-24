require("./initFirebase");
import * as admin from "firebase-admin";
import { AudioRecord } from "./types";

let recorderId = "bugg_RPiID-1000000093be5da2";

async function run() {
  let uris = new Set<string>();

  let audioSnaps = await admin
    .firestore()
    .collection("audio")
    .where("recorder", "==", recorderId)
    .get();

  for (let snap of audioSnaps.docs) {
    let audio = snap.data() as AudioRecord;
    let uri = audio.uri;

    if (uris.has(uri)) {
      console.log("Duplicate", snap.id, uri);

      //   await snap.ref.delete();
    } else {
      uris.add(uri);
    }
  }
}

run();
