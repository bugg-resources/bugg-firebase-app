import * as functions from "firebase-functions";
import * as PubSub from "@google-cloud/pubsub";

// When an audio file is uploaded to gs://bugg-audio-speech-filter send a pubsub message to the speech-filter topic.
export const onSpeechFilterRequested = functions
  .region("europe-west2")
  .storage.bucket("bugg-audio-speech-filter")
  .object()
  .onFinalize(async (obj, context) => {
    if (!obj.name) {
      console.log("Object had no path name");
      return;
    }

    let path = obj.name;
    let parts = path.split("/");
    if (!path.includes("/") || parts.length !== 5) {
      console.log("incorrect name format", obj.name);
      return;
    }

    if (
      !path.startsWith("audio/") ||
      !path.endsWith(".mp3") ||
      obj.contentType !== "audio/mpeg"
    ) {
      console.log("file wasn't an audio file", path, obj.contentType);
      return;
    }

    let storageUrl = `gs://${obj.bucket}/${obj.name}`;
    console.log("New audio received: ", storageUrl);

    let client = new PubSub.PubSub();
    let messageId = await client
      .topic("speech-filter")
      .publish(Buffer.from(storageUrl));
    console.log(
      `Published message ${messageId} to speech-filter topic. ${storageUrl}`
    );
  });
