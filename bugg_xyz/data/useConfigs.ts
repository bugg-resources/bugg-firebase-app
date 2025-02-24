import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useLoadingBar } from "../components/LoadingBar";
import { useProjectId } from "./useProjects";
import { RecorderConfig } from "../types";

export function useConfigs() {
  let currentProjectId = useProjectId();
  let [configs, setConfigs] = useState(null as null | RecorderConfig[]);
  let loadingBar = useLoadingBar();

  useEffect(() => {
    if (!currentProjectId) {
      return;
    }
    loadingBar.start();

    let ref = collection(getFirestore(), "config");
    let q = query(
      ref,
      where("projectId", "==", currentProjectId),
      orderBy("createdAt", "desc")
    );
    let unsub = onSnapshot(q, (snap) => {
      loadingBar.complete();
      let incomming = snap.docs.map((d) => d.data() as RecorderConfig);
      setConfigs(incomming);
    });

    return () => {
      unsub();
    };
  }, [currentProjectId, setConfigs, loadingBar]);

  return configs;
}
