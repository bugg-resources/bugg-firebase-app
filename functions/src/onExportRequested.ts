import * as PubSub from "@google-cloud/pubsub";
import * as functions from "firebase-functions";

/***
 * Watch the exports collection and submit the job to be processed by the clippy service.
 */
export const onExportRequested = functions
  .region("europe-west2")
  .firestore.document(`exports/{exportId}`)
  .onCreate(async (snapshot, context) => {
    let { exportId } = context.params;

    await snapshot.ref.update({
      status: "QUEUED",
    });

    let client = new PubSub.PubSub();
    let messageId = await client.topic("clippy").publish(
      Buffer.from(
        JSON.stringify({
          exportId: exportId,
        })
      )
    );
    console.log(
      `Published ${exportId} to be exported. Message ID = ${messageId}`
    );
  });
