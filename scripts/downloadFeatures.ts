import { subDays } from "date-fns";
import * as admin from "firebase-admin";
import { AudioRecord } from "./types";

require("./initFirebase");

// Download vggish features to a local folder

async function run() {
  let records = await admin
    .firestore()
    .collection("audio")
    .where("project", "==", "proj_sound-of-norway")
    .where("recorder", "==", "bugg_RPiID-10000000aa53f21c")
    .where("uploadedAt", "<=", admin.firestore.Timestamp.fromDate(new Date()))
    .where(
      "uploadedAt",
      ">=",
      admin.firestore.Timestamp.fromDate(subDays(new Date(), 7))
    )
    .orderBy("uploadedAt", "desc")
    .get();

  console.log("found", records.docs.length);

  for (let d of records.docs) {
    let audioRec = d.data() as AudioRecord;
    let downloadLinkPrefix = `https://bugg-301712.web.app/download/${
      audioRec.downloadToken || "MISSIGNO"
    }`;

    let link = `${downloadLinkPrefix}/artifacts/vggish/${audioRec.project}/${audioRec.id}/raw_audioset_feats_960ms.npy`;
    console.log(link);
  }
}

run();
