require("./initFirebase");
import * as admin from "firebase-admin";
import { Analysis } from "./types";

// ["anomaly-detection", "bird-detection", "gibbon-detection"]

let analyses: Analysis[] = [
  {
    id: "anomaly-detection",
    colourPrimary: "#00C79D",
    colourSecondary: "#E4F4F3",
    displayName: "Anomalies",
    icon: "AnomalyIcon",
    hidden: false,
    url: "example.com",
    trigger: "to add",
  },
  {
    id: "bird-detection",
    colourPrimary: "#00C7AA",
    colourSecondary: "#E4F4AA",
    displayName: "Birds",
    icon: "AnomalyIcon",
    hidden: false,
    url: "example.com",
    trigger: "to add",
  },
  {
    id: "gibbon-detection",
    colourPrimary: "#EB4F20",
    colourSecondary: "#FEECE8",
    displayName: "Gibbons",
    icon: "GibbonIcon",
    hidden: false,
    url: "example.com",
    trigger: "vggish-feature-extraction",
  },
];

async function run() {
  for (let a of analyses) {
    await admin.firestore().doc(`analyses/${a.id}`).set(a);
  }
}

run();
