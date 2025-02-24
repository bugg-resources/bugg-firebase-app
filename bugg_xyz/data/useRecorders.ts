// Fetch all the recorders for this project

import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { Recorder } from "../types";
import { currentProjectIdAtom, useProject, useProjectId } from "./useProjects";

export const allRecordersAtom = atom({
  default: [] as Recorder[],
  key: "allRecordersAtom",
});

export function useAllRecorders() {
  return useRecoilValue(allRecordersAtom);
}

function useFetchRecorders() {
  let currentProjectId = useProjectId();
  let setAllRecorders = useSetRecoilState(allRecordersAtom);

  useEffect(() => {
    if (!currentProjectId) {
      return;
    }
    let recordersRef = collection(
      getFirestore(),
      `projects/${currentProjectId}/recorders`
    );

    let unsub = onSnapshot(recordersRef, (snaps) => {
      let recorders = snaps.docs.map((d) => d.data() as Recorder);
      setAllRecorders(recorders);
    });

    return () => {
      setAllRecorders([]);
      unsub();
    };
  }, [currentProjectId]);
}

export function RecordersFetcher() {
  useFetchRecorders();
  return null;
}
