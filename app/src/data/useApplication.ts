import firebase from "firebase/app";
import moment, { Moment } from "moment";
import { useEffect, useState } from "react";
import {
  atom,
  selector,
  selectorFamily,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import {
  Analysis,
  AudioRecord,
  DetectedAudioSegment,
  Recorder,
} from "../../types";
import { useSetLoading } from "../components/LoadingBar";

const allAudioAtom = atom({
  default: [] as AudioRecord[],
  key: "allAudioAtom",
});

export const allRecordersAtom = atom({
  default: [] as Recorder[],
  key: "allRecordersAtom",
});

export const allAnalysesAtom = atom({
  default: [] as Analysis[],
  key: "allAnalysesAtom",
});

/***
 * Pull out the detections from the audio
 */
const detectedSegmentsAtom = selector({
  key: "detectedSegmentsAtom",
  get: ({ get }) => {
    const audio = get(allAudioAtom);

    let detectedSegment = [] as DetectedAudioSegment[];
    for (let a of audio) {
      if (!a.detections?.length) {
        continue;
      }

      for (let detection of a.detections) {
        let d: DetectedAudioSegment = {
          id: `${a.id}-${detection.id}`,
          createdAt: a.createdAt,
          recorder: a.recorder,
          siteName: a.site,
          audioUrl: a.uri,
          start: detection.start,
          end: detection.end,
          tags: detection.tags,
          analysisId: detection.analysisId,
        };

        detectedSegment.push(d);
      }
    }
    return detectedSegment;
  },
});

// Filtering the segments
//   update the users selected tags and devices here
export const selectedTagsAtom = atom({
  default: [] as {
    label: string;
    // tag
    value: string;
  }[],
  key: "selectedTagsAtom",
});
export const selectedRecorderIdsAtom = atom({
  default: [] as {
    label: string;
    // recorderId
    value: string;
  }[],
  key: "selectedRecorderIdsAtom",
});

export const availableTagsAtom = selector({
  key: "availableTagsAtom",
  get: ({ get }) => {
    const allSegments = get(detectedSegmentsAtom);

    let tags = new Set<string>();
    allSegments.forEach((s) => s.tags.forEach((t) => tags.add(t)));

    return Array.from(tags).sort();
  },
});

// the analyses that are present in the current audio dataset
export const availableAnalysesAtom = selector({
  key: "availableAnalysesAtom",
  get: ({ get }) => {
    const allSegments = get(detectedSegmentsAtom);
    const allAnalyses = get(allAnalysesAtom);

    let analysesIds = new Set<string>();
    allSegments.forEach((s) => analysesIds.add(s.analysisId));

    return allAnalyses
      .filter((a) => analysesIds.has(a.id))
      .sort((a, b) => a.id.localeCompare(b.id));
  },
});

// the recorder IDs that are present in the current audio dataset
export const availableRecordersAtom = selector({
  key: "availableRecordersAtom",
  get: ({ get }) => {
    const allSegments = get(detectedSegmentsAtom);
    const allRecorders = get(allRecordersAtom);

    let recorders = new Set<string>();
    allSegments.forEach((s) => recorders.add(s.recorder));

    return Array.from(recorders)
      .map((rId) => allRecorders.find((r) => r.deviceId === rId))
      .filter((r) => !!r)
      .sort((a, b) => a!.name.localeCompare(b!.name)) as Recorder[];
  },
});

/***
 * Use these on the dashboard
 */
export const filteredDetectedSegmentsAtom = selector({
  key: "filteredDetectedSegmentsAtom",
  get: ({ get }) => {
    const allSegments = get(detectedSegmentsAtom);
    const selectedTagOptions = get(selectedTagsAtom);
    const selectedRecorderOptions = get(selectedRecorderIdsAtom);

    let selectedRecorderIds = new Set(
      selectedRecorderOptions.map((r) => r.value)
    );
    let selectedTags = new Set(selectedTagOptions.map((t) => t.value));

    return allSegments
      .filter((s) => {
        // tag filter
        if (selectedTags.size) {
          return s.tags.some((t) => selectedTags.has(t));
        } else {
          return true;
        }
      })
      .filter((s) => {
        // deviceId filter
        if (selectedRecorderIds.size) {
          return selectedRecorderIds.has(s.recorder);
        } else {
          return true;
        }
      });
  },
});

// the recorder IDs that are present in the current audio dataset
export const availableRecorderIdsInFilteredSetAtom = selector({
  key: "availableRecorderIdsInFilteredSetAtom",
  get: ({ get }) => {
    const segments = get(filteredDetectedSegmentsAtom);

    let recorders = new Set<string>();
    segments.forEach((s) => recorders.add(s.recorder));

    return recorders;
  },
});

export const filteredDetectedSegmentsByAnalysisAtom = selectorFamily({
  key: "filteredDetectedSegmentsByAnalysisAtom",
  get:
    (analysisId: string) =>
    ({ get }) => {
      let segments = get(filteredDetectedSegmentsAtom);
      return segments.filter((s) => s.analysisId === analysisId);
    },
});

export const percentageHitsByAnalysisAtom = selectorFamily({
  key: "percentageHitsByAnalysisAtom",
  get:
    (analysisId: string) =>
    ({ get }) => {
      let segments = get(filteredDetectedSegmentsAtom);
      let analysisSegments = get(
        filteredDetectedSegmentsByAnalysisAtom(analysisId)
      );
      return Math.round((analysisSegments.length / segments.length) * 100);
    },
});

export const dateRangeAtom = atom({
  key: "dateRangeAtom",
  default: {
    startDate: moment().subtract(7, "days") as Moment | null,
    endDate: moment() as Moment | null,
  },
});

/***
 * Loads in everything setting up the data to run the dashboard and other screens
 */
export function useApplication(projectId: string) {
  let [reloadKey, setReloadKey] = useState("-");

  let dateRange = useRecoilValue(dateRangeAtom);
  useShowLoadingBar(projectId, dateRange.startDate, dateRange.endDate);
  let setLoading = useSetLoading();

  // Load in the audio
  let setAllAudio = useSetRecoilState(allAudioAtom);
  useEffect(() => {
    if (
      !projectId ||
      !reloadKey ||
      !dateRange.startDate ||
      !dateRange.endDate
    ) {
      return;
    }
    let unsub = firebase
      .firestore()
      .collection(`audio`)
      .where("project", "==", projectId)
      .where("hasDetections", "==", true)
      .where("uploadedAt", ">=", dateRange.startDate.toDate())
      .where("uploadedAt", "<=", dateRange.endDate.toDate())
      .orderBy("uploadedAt", "desc")
      .onSnapshot(
        (snaps) => {
          let audio = snaps.docs.map((d) => d.data() as AudioRecord);
          setAllAudio(audio);

          if (audio.length === 0) {
            setLoading(false);
          }
        },
        (err) => {
          console.error("get audio error", err);
          // error, try reloading
          setReloadKey(new Date().toISOString());
        }
      );

    return () => {
      unsub();
    };
  }, [projectId, setReloadKey, reloadKey, setAllAudio, dateRange, setLoading]);

  // Load in the recorders
  let setAllRecorders = useSetRecoilState(allRecordersAtom);
  useEffect(() => {
    if (!projectId || !reloadKey) {
      return;
    }
    let unsub = firebase
      .firestore()
      .collection(`projects/${projectId}/recorders`)
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snaps) => {
          let recorders = snaps.docs.map((d) => d.data() as Recorder);
          setAllRecorders(recorders);
        },
        (err) => {
          console.error(err);
          // error, try reloading
          setReloadKey(new Date().toISOString());
        }
      );

    return () => {
      unsub();
    };
  }, [projectId, setReloadKey, reloadKey, setAllRecorders]);

  // Load in the analyses

  let setAllAnalyses = useSetRecoilState(allAnalysesAtom);
  useEffect(() => {
    let unsub = firebase
      .firestore()
      .collection(`analyses`)
      .where("hidden", "==", false)
      .onSnapshot(
        (snaps) => {
          let analyses = snaps.docs.map((d) => d.data() as Analysis);
          setAllAnalyses(analyses);
        },
        (err) => {
          console.error(err);
          // error, try reloading
          setReloadKey(new Date().toISOString());
        }
      );

    return () => {
      unsub();
    };
  }, [setReloadKey, reloadKey, setAllAnalyses]);
}

function useShowLoadingBar(
  projectId: string,
  startDate: Moment | null,
  endDate: Moment | null
) {
  let setLoading = useSetLoading();

  useEffect(() => {
    if (startDate && endDate) {
      setLoading(true);
    }
  }, [setLoading, projectId, startDate, endDate]);

  // turns off the loading bar when the filteredDetectedSegmentsAtom has been calculated
  let segments = useRecoilValue(filteredDetectedSegmentsAtom);
  useEffect(() => {
    if (segments.length) {
      setLoading(false);
    }
  }, [segments, setLoading]);
}
