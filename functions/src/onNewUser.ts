import { firestore } from "firebase-admin";
import * as functions from "firebase-functions";
import { Profile } from "./types";

/***
 * Creates a new profile record when a user authenticates for the first time
 */
export const onNewUser = functions
  .region("europe-west2")
  .auth.user()
  .onCreate(async (user, context) => {
    let profile: Profile = {
      id: user.uid,
      displayName: user.displayName || "",
      createdAt: firestore.Timestamp.now(),
      projects: [],
    };

    await firestore().doc(`profiles/${user.uid}`).set(profile, { merge: true });
  });
