/***
 * Some functions need to be run when the audio record is updated
 *  - Check to see if a clipped audio record needs to be created
 */

import * as PubSub from "@google-cloud/pubsub";
import * as functions from "firebase-functions";
import { AudioRecord } from "./types";

export const onAudioRecordChanged = functions
  .region("europe-west2")
  .firestore.document(`audio/{audioId}`)
  .onUpdate(async (snapshot, context) => {
    let { audioId } = context.params;

    let beforeAudioRec = snapshot.before.data() as AudioRecord;
    let audioRec = snapshot.after.data() as AudioRecord;

    let beforeDetectionIds = new Set(
      beforeAudioRec.detections.map((d) => d.id)
    );

    // Check to see if the audio has any new detections and if those
    // detections don't have clip URIs yet, send them to be clipped
    for (let detection of audioRec.detections) {
      if (!beforeDetectionIds.has(detection.id)) {
        if (!detection.uri) {
          let client = new PubSub.PubSub();
          let messageId = await client.topic("clippy").publish(
            Buffer.from(
              JSON.stringify({
                audioId: audioId,
                detectionId: detection.id,
              })
            )
          );
          console.log(
            `Published ${audioRec.id} ${detection.id} to be clipped. Message ID = ${messageId}`
          );
        }
      }
    }
  });
