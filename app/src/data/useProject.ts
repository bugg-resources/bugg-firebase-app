import firebase from "firebase/app";
import { useEffect, useState } from "react";
import { Project } from "../../types";

/***
 * Fetch and watch a project from Firestore
 */
export function useProject(projectId?: string) {
  let [project, setProject] = useState(null as null | Project);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let unsub = firebase
      .firestore()
      .doc(`projects/${projectId}`)
      .onSnapshot((snap) => {
        if (!snap.exists) {
          setProject(null);
        } else {
          setProject(snap.data() as Project);
        }
      });
    return () => {
      unsub();
      setProject(null);
    };
  }, [projectId, setProject]);

  return project;
}
