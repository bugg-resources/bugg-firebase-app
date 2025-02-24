// Checks to see if the project specifies that audio should be deleted and deletes it if so

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Project } from "./types";

// When an audio file is uploaded to gs://bugg-audio-speech-filter send a pubsub message to the speech-filter topic.
export const onAudioQuarantined = functions
  .region("europe-west2")
  .storage.bucket("bugg-audio-speech-quarantine")
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

    if (!path.startsWith("audio/") || !path.endsWith(".mp3")) {
      console.log("file wasn't an audio file", path, obj.contentType);
      return;
    }

    let [root, projectId, recorderId, configId, fileName] = parts;
    let filenameParts = fileName.split(".");
    let extension = filenameParts.pop();
    let t = filenameParts.join(".");
    let time = t.replace(/_/g, ":");

    console.log(
      "New audio received: ",
      JSON.stringify({
        root,
        projectId,
        recorderId,
        configId,
        fileName,
        time,
        extension,
      })
    );

    let projectSnap = await admin
      .firestore()
      .doc(`projects/${projectId}`)
      .get();

    if (!projectSnap.exists) {
      console.log(`Unknown projectID: ${projectId}`, path);
      // may want to delete here eventually. But for now it's useful to see if ones don't get matched
      return;
    }

    let project = projectSnap.data() as Project;
    if (project.deleteAudioInQuarantine) {
      console.log("Deleting audio file", path);
      await admin.storage().bucket(obj.bucket).file(path).delete();
    } else {
      // Change the storage class to nearline
      console.log("Changing storage class to nearline", path);
      await admin
        .storage()
        .bucket(obj.bucket)
        .file(path)
        .setStorageClass("NEARLINE");
    }
  });
