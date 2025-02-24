/***
 * To be able to access the audio the user needs to have a claim to the project in their auth token
 *
 * This function watches for changes to the projects members and syncs that with the claims
 */

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

export const giveUserProjectClaims = functions
  .region("europe-west2")
  .firestore.document(`projects/{projectId}/members/{memberId}`)
  .onWrite(async (snapshot, context) => {
    let { memberId } = context.params;

    // find all the projects this user is a member of
    let snapshots = await admin
      .firestore()
      .collectionGroup("members")
      .where("uid", "==", memberId)
      .get();

    let projectIds = snapshots.docs.map((s) => s.ref.parent.parent!.id);
    console.log("Projects user is member of:", projectIds);
    await admin.auth().setCustomUserClaims(memberId, {
      projects: projectIds,
    });

    // update the user record so they can use the project selector easily
    await admin.firestore().doc(`profiles/${memberId}`).update({
      projects: projectIds,
    });
  });
