require("./initFirebase");
import * as crypto from "crypto";
import * as admin from "firebase-admin";
import { Recorder } from "./types";

// take the sites and add them to the recorders in the project if they're not there already

// taken from the borneo project
const sites = [
  {
    site_name: "E100_edge",
    habitat: "Logged Fragment",
    photo: {},
    short_desc: null,
    longitude: 117.58604,
    latitude: 4.68392,
    n_audio: 3826,
  },
  {
    site_name: "D100_641",
    habitat: "Logged Fragment",
    photo: {},
    short_desc: null,
    longitude: 117.58753,
    latitude: 4.71129,
    n_audio: 362,
  },
  {
    site_name: "C10_621",
    habitat: "Logged Fragment",
    photo: {},
    short_desc: null,
    longitude: 117.61899,
    latitude: 4.71118,
    n_audio: 173,
  },
  {
    site_name: "B10",
    habitat: "Logged Fragment",
    photo: {},
    short_desc: null,
    longitude: 117.61433,
    latitude: 4.72747,
    n_audio: 3412,
  },
  {
    site_name: "E1_648",
    habitat: "Logged Fragment",
    photo: {},
    short_desc: null,
    longitude: 117.581175,
    latitude: 4.693722,
    n_audio: 6810,
  },
  {
    site_name: "D_Matrix",
    habitat: "Cleared Forest",
    photo: {},
    short_desc: null,
    longitude: 117.59141,
    latitude: 4.70272,
    n_audio: 8872,
  },
  {
    site_name: "C_Matrix",
    habitat: "Cleared Forest",
    photo: {},
    short_desc: null,
    longitude: 117.61071,
    latitude: 4.71011,
    n_audio: 46,
  },
  {
    site_name: "Riparian_1",
    habitat: "Riparian Reserve",
    photo: {},
    short_desc: null,
    longitude: 117.54203,
    latitude: 4.65041,
    n_audio: 10614,
  },
  {
    site_name: "Riparian_2",
    habitat: "Riparian Reserve",

    short_desc: null,
    longitude: 117.54653,
    latitude: 4.65278,
    n_audio: 2422,
  },
  {
    site_name: "VJR_1",
    habitat: "Old Growth",

    short_desc: null,
    longitude: 117.535133,
    latitude: 4.664433,
    n_audio: 12757,
  },
  {
    site_name: "VJR_2",
    habitat: "Old Growth",

    short_desc: null,
    longitude: 117.53897,
    latitude: 4.66803,
    n_audio: 777,
  },
  {
    site_name: "B1_602",
    habitat: "Logged Fragment",

    short_desc: null,
    longitude: 117.6235,
    latitude: 4.72834,
    n_audio: 42,
  },
  {
    site_name: "OP3_843",
    habitat: "Oil Palm",
    short_desc: null,
    longitude: 117.45265,
    latitude: 4.64005,
    n_audio: 26,
  },
  {
    site_name: "OP_Belian",
    habitat: "Oil Palm",
    short_desc: null,
    longitude: 117.52016,
    latitude: 4.63707,
    n_audio: 29,
  },
];

async function run() {
  const projectId = "SmjDFWRRvri0rbqiOo0R";

  for (let site of sites) {
    let deviceId = crypto
      .createHash("md5")
      .update(site.site_name)
      .digest("hex")
      .substr(0, 10);

    let recorder: Recorder = {
      createdAt: admin.firestore.Timestamp.now(),
      deviceId,
      project: projectId,
      status: "OK",
      site: site.site_name,
      location: new admin.firestore.GeoPoint(site.latitude, site.longitude),
      config: null,
      disabled: false,
    };

    await admin
      .firestore()
      .doc(`projects/${projectId}/recorders/${deviceId}`)
      .set(recorder);
  }
}

run();
