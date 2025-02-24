/***
 * Kick off an analysis when another has completed
 */
import * as PubSub from "@google-cloud/pubsub";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { dispatchTask } from "./analysisTriggerNewAudio";
import { Analysis, AudioRecord } from "./types";

/***
 * Responsible for starting analyses running that are watching for new audio
 */
export const analysisTriggerCompletedAnalysis = functions
  .region("europe-west2")
  .firestore.document(`audio/{audioId}`)
  .onWrite(async (snapshot, context) => {
    if (!snapshot.before.exists || !snapshot.after.exists) {
      return;
    }

    let audioRecBefore = snapshot.before.data() as AudioRecord;
    let audioRecAfter = snapshot.after.data() as AudioRecord;

    console.log(
      "Checking audio",
      audioRecBefore.id,
      audioRecBefore.analysesPerformed,
      audioRecAfter.analysesPerformed
    );

    // Check to see if the analysesPerformed has changed
    let newlyCompletedAnalyses = [] as string[];

    let analysesPerformedBeforeSet = new Set(audioRecBefore.analysesPerformed);
    let analysesPerformedAfterSet = new Set(audioRecAfter.analysesPerformed);
    for (let after of analysesPerformedAfterSet) {
      if (!analysesPerformedBeforeSet.has(after)) {
        newlyCompletedAnalyses.push(after);
      }
    }

    console.log("difference:", newlyCompletedAnalyses);

    if (newlyCompletedAnalyses.length === 0) {
      console.log("No change in analyses");
      return;
    }

    for (let completedAnalysisId of newlyCompletedAnalyses) {
      // Fetch all the analyses that need to be triggered when this analysis had completed
      let analysesSnaps = await admin
        .firestore()
        .collection("analyses")
        .where("trigger", "==", completedAnalysisId)
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
          await dispatchTask(a, audioRecAfter, completedAnalysisId);
        }
        if (a.topic) {
          let client = new PubSub.PubSub();
          let messageId = await client
            .topic(a.topic)
            .publish(Buffer.from(audioRecAfter.id));
          console.log(
            `Published ${audioRecAfter.id} to topic ${a.topic}. Message ID = ${messageId}`
          );
        }
      }
    }
  });
