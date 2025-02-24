import * as admin from "firebase-admin";
import * as Papa from "papaparse";
import { AudioRecord } from "./types";

require("./initFirebase");

async function run() {
  let count = 0;

  let hasOutputHeader = false;
  let hasMore = true;
  let after = null as any;
  while (hasMore) {
    let query = admin
      .firestore()
      .collection("audio")
      .where("hasDetections", "==", true)
      .where("project", "==", "proj_sound-of-norway")
      .where("createdAt", "<", new Date())
      .where("createdAt", ">=", new Date("2021-09-18T00:00:00.000Z"))
      .limit(10000);
    if (after) {
      query = query.startAfter(after);
    }
    let audioSnaps = await query.get();

    if (audioSnaps.empty) {
      hasMore = false;
      console.error("FIN", count);

      process.exit(0);
      return;
    } else {
      let items = [];

      for (let snap of audioSnaps.docs) {
        console.error(snap.id);

        let record = snap.data() as AudioRecord;

        if (!record.location) {
          continue;
        }

        for (let detection of record.detections) {
          count = count + 1;
          let downloadLinkPrefix = `https://bugg-301712.web.app/download/${
            record.downloadToken || "MISSIGNO"
          }`;

          items.push({
            id: `${record.id}${detection.id}`,
            analysis: detection.analysisId,
            tags: detection.tags.join(", "),
            start_secs: detection.start,
            end_secs: detection.end,
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
          }
        }

        after = snap;
      }

      console.error("unparsing...");
      let csv = Papa.unparse(items, {
        header: !hasOutputHeader,
      });
      hasOutputHeader = true;
      console.log(csv);
    }
  }
}

run();
