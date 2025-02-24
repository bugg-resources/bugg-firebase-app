/***
 * The Buggs upload into a dedicated create-only dropbox
 *
 * As the service accounts they use can only restrict to the whole bucket (not particular folders)
 * we do some work here to validate the upload is correct. If it is we move it across to the
 */

import { firestore, storage } from "firebase-admin";
import * as functions from "firebase-functions";
import { Project } from "./types";

export const onUploadFromBugg = functions
  .region("europe-west2")
  .storage.bucket("bugg-audio-dropbox")
  .object()
  .onFinalize(async (obj, context) => {
    // e.g. proj_sound-of-norway/bugg_RPiID-10000000ea7cb2bc/conf_3b257ec/2021-06-23T14_54_03.208Z.mp3
    //  pattern is {project}/{recorderId}/{configId}/{time}.mp3

    console.log("name", obj.name);

    if (!obj.name) {
      console.log("Object had no path name");
      return;
    }

    let path = obj.name;
    let parts = path.split("/");

    if (!path.includes("/") || !(parts.length === 4)) {
      console.log("incorrect name format", obj.name);
      return;
    }

    if (!path.endsWith(".mp3") || obj.contentType !== "audio/mpeg") {
      console.log("file wasn't an audio file", path, obj.contentType);
      return;
    }

    let [projectId, recorderId, configId, fileName] = parts;
    let filenameParts = fileName.split(".");
    let extension = filenameParts.pop();
    let t = filenameParts.join(".");

    let iso = t.replace(/_/g, ":");
    let dateTime = new Date(iso);

    if (isNaN(dateTime.getTime())) {
      console.log("Invalid time value. Rejecting", t, iso);
      return;
    }

    console.log(
      `Audio uploaded. Project: ${projectId}, recorder: ${recorderId}, config: ${configId}, time: ${iso}, extension: ${extension}`
    );

    let projectSnap = await firestore().doc(`projects/${projectId}`).get();

    if (!projectSnap.exists) {
      console.log(`Unknown projectID: ${projectId}`, path);
      // may want to delete here eventually. But for now it's useful to see if ones don't get matched
      return;
    }

    let project = projectSnap.data() as Project;
    console.log(
      "Found project to match with",
      project.name,
      recorderId,
      fileName
    );

    // Check to see if this project requires speech filtering
    if (project.speechFiltering) {
      console.log("Speech filtering is enabled for this project");
      // Move this file into the speech filtering bucket
      let srcFile = storage().bucket(obj.bucket).file(obj.name);
      let newLocation = `gs://bugg-audio-speech-filter/audio/${projectId}/${recorderId}/${configId}/${fileName}`;
      await srcFile.move(newLocation);
      console.log("File moved to", newLocation);
      return;
    }

    // Move this file into the main bucket now
    let srcFile = storage().bucket(obj.bucket).file(obj.name);
    let newLocation = `gs://bugg-301712.appspot.com/audio/${projectId}/${recorderId}/${configId}/${fileName}`;
    await srcFile.move(newLocation);
    console.log("File moved to", newLocation);
  });
