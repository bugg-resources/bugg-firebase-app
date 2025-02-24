/**
 * Yo make downloading assets easier a user can access them with a sharable magic link
 */

import { firestore, storage } from "firebase-admin";
import * as functions from "firebase-functions";
import { AudioRecord } from "./types";

export const magicLink = functions
  .region("us-central1")
  .https.onRequest(async (req, res) => {
    console.log("request", req.path);

    // Example path
    // /download/<TOKEN>/audio/proj_sound-of-norway/bugg_RPiID-1000000013b4b8f2/conf_3b257ec/2021-06-21T09_02_10.245Z.mp3
    // <TOKEN> is the downloadToken param on the audio record

    let parts = req.path.split("/");
    let [token, ...pathParts] = parts.slice(2);

    if (!pathParts.length) {
      res.status(400).send("Invalid path");
      return;
    }

    console.log("Looking up token", token);

    let snaps = await firestore()
      .collection("audio")
      .where("downloadToken", "==", token)
      .limit(1)
      .get();
    if (snaps.empty) {
      console.log("Unable to find audio matching token", token);
      res.status(401).send("Not authorised");
      return;
    }

    let audio = snaps.docs[0].data() as AudioRecord;

    if (pathParts[0] === "audio") {
      // Verify the link the user gave is for the audio file on the record
      let providedPath = `gs://bugg-301712.appspot.com/${pathParts.join("/")}`;
      if (audio.uri !== providedPath) {
        console.log(
          "The audio URIs did not match. Expected",
          audio.uri,
          "received",
          providedPath
        );
        res.status(400).send("Invalid path");
        return;
      }
    } else if (pathParts[0] === "artifacts") {
      if (pathParts.length < 4) {
        res.status(400).send("Invalid path");
        return;
      }

      // Ensure the audio ID in the path matches
      let providedAudioId = pathParts[3];
      if (providedAudioId !== audio.id) {
        console.log(
          "Audio IDs did not match up. Expected",
          audio.id,
          "received",
          providedAudioId
        );
        res.status(400).send("Invalid path");
        return;
      }
    } else if (pathParts[0] === "detections") {
      // e.g. gs://bugg-301712.appspot.com/detections/001Mo19GAweIBthcR1Aj/d8ad95.mp3

      // Ensure the audio ID in the path matches
      let providedAudioId = pathParts[1];
      if (providedAudioId !== audio.id) {
        console.log(
          "Audio IDs did not match up. Expected",
          audio.id,
          "received",
          providedAudioId
        );
        res.status(400).send("Invalid path");
        return;
      }
    } else {
      res.status(400).send("Invalid path");
      return;
    }

    // At this point the download is valid

    console.log(
      "Redirecting to file",
      `gs://bugg-301712.appspot.com/${pathParts.join("/")}`
    );

    let file = storage()
      .bucket("bugg-301712.appspot.com")
      .file(pathParts.join("/"));

    let exists = await file.exists();
    if (!exists) {
      console.error("File doesn't exist", req.path);
      res.status(404).send("Invalid path");
      return;
    }

    let [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    res.redirect(url);
  });
