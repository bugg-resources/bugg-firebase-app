require("./initFirebase");
import * as crypto from "crypto";
import { addMinutes } from "date-fns";
import * as admin from "firebase-admin";
import * as seedrandom from "seedrandom";
import { AudioRecord, Detection, Recorder } from "./types";

// create an audio sample every 20 mins for each recorder between the start and end dates

async function runScript() {
  const projectId = "SmjDFWRRvri0rbqiOo0R";
  const startDate = new Date("2021-03-01T00:00:00.000Z");
  const endDate = new Date("2021-04-21T00:00:00.000Z");

  let recorderSnaps = await admin
    .firestore()
    .collection(`/projects/${projectId}/recorders`)
    .get();
  let recorders = recorderSnaps.docs.map((snap) => snap.data() as Recorder);
  console.log(`${recorders.length} recorders`);

  // chance of hitting a detection
  let audioList = [];

  let currentTimestamp = startDate;
  while (currentTimestamp < endDate) {
    currentTimestamp = addMinutes(currentTimestamp, 20);

    // Create an audio record for each recorder.
    let batch = admin.firestore().batch();
    for (let r of recorders) {
      let audio = createAudioRecord(projectId, r, currentTimestamp);
      audioList.push(audio);
      batch.set(admin.firestore().doc(`/audio/${audio.id}`), audio);
    }
    await batch.commit();
  }
}

runScript();

function createAudioRecord(
  project: string,
  recorder: Recorder,
  timestamp: Date
): AudioRecord {
  let audioId = simpleHash(
    `${project}-${recorder.deviceId}-${timestamp.toISOString()}`
  );

  let detections = generateDetections(audioId);

  return {
    id: audioId,
    analysesPerformed: [
      "vggish-feature-extraction",
      "gibbon-detection",
      "bird-detection",
      "anomaly-detection",
    ],
    createdAt: admin.firestore.Timestamp.fromDate(timestamp),
    project: project,
    recorder: recorder.deviceId,
    siteName: recorder.site,
    siteLocation: recorder.location,
    bucket: "bugg-301712.appspot.com",
    path: "audio/profile_123AA/00000000249ae42f/audio-abcdefghjklmnopqrstw.mp3",
    uri:
      "https://firebasestorage.googleapis.com/v0/b/bugg-301712.appspot.com/o/audio%2Fprofile_123AA%2F00000000249ae42f%2Faudio-abcdefghjklmnopqrstw.mp3?alt=media",

    // True if something has been detected in this audio sample
    hasDetections: detections.length > 0,
    detections: detections,
  };
}
function generateDetections(hash: string): Detection[] {
  let detections: Detection[] = [];
  let rng = seedrandom(hash);
  let randomNo = rng();

  let audioLengthSecs = 1000; // assume less than 20 mins

  // 40% chance there will be a detection in a sample
  if (randomNo < 0.41) {
    return [];
  }

  // 3% chance of a gibbon or two
  for (let i = 0; i < 2; i++) {
    let randomGib = rng();
    if (randomGib < 0.031) {
      let start = Math.round(rng() * (audioLengthSecs - 5));
      let end = start + 5;

      detections.push({
        id: simpleHash(`gib-${hash}-${randomGib}`),
        start: start,
        end: end,
        tags: [randomGibbon(rng)],
        analysisId: "gibbon-detection",
      });
    }
  }

  // 5% chance of a bird or two
  for (let i = 0; i < 2; i++) {
    let randomGib = rng();
    if (randomGib < 0.051) {
      let start = Math.round(rng() * (audioLengthSecs - 5));
      let end = start + 5;

      detections.push({
        id: simpleHash(`bird-${hash}-${randomGib}`),
        start: start,
        end: end,
        tags: [randomBird(rng)],
        analysisId: "bird-detection",
      });
    }
  }

  // 2% chance of an anomaly
  for (let i = 0; i < 2; i++) {
    let randomGib = rng();
    if (randomGib < 0.021) {
      let start = Math.round(rng() * (audioLengthSecs - 5));
      let end = start + 5;

      detections.push({
        id: simpleHash(`anomaly-${hash}-${randomGib}`),
        start: start,
        end: end,
        tags: [],
        analysisId: "anomaly-detection",
      });
    }
  }

  return detections;
}

function simpleHash(input: string) {
  return crypto
    .createHash("md5")
    .update(`${input}`)
    .digest("hex")
    .substr(0, 10);
}

let birds = ["Babbler", "Woodpecker", "Dove", "Flowerpecker"];
function randomBird(rng: () => number) {
  return birds[Math.floor(rng() * birds.length)];
}

let gibbons = ["Lar", "Hoolock", "Yellow-cheeked", "Northern"];
function randomGibbon(rng: () => number) {
  return gibbons[Math.floor(rng() * gibbons.length)];
}
