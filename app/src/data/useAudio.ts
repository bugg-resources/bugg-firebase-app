/***
 * Fetch all the analyses
 *
 * fetch the audio that has detections within the time range
 */

import firebase from "firebase/app";
import { useEffect, useState } from "react";
import { AudioRecord } from "../../types";

export function useAudio(projectId?: string) {
  let [reloadKey, setReloadKey] = useState("-");

  // Get all the recorders

  // fetch all the audio

  // work through and find all the unique tags

  //

  // Create an index of tags to audio(?)

  useEffect(() => {
    if (!projectId || !reloadKey) {
      return;
    }

    console.log("loading audio");

    let unsub = firebase
      .firestore()
      .collection(`audio`)
      .where("project", "==", projectId)
      .where("hasDetections", "==", true)
      .where("createdAt", ">=", new Date("2021-04-19T00:00:00.000Z"))
      .where("createdAt", "<=", new Date("2021-04-21T00:00:00.000Z"))
      .onSnapshot(
        (snaps) => {
          let audio = snaps.docs.map((d) => d.data() as AudioRecord);
          console.log("audio", audio);

          //
        },
        (err) => {
          console.error(err);
          // error, try reloading
          // setReloadKey(new Date().toISOString());
        }
      );

    return () => {
      unsub();
    };
  }, [projectId, setReloadKey, reloadKey]);
}
