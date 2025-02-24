import firebase from "firebase-admin";

export interface Recorder {
  createdAt: firebase.firestore.Timestamp;
  deviceId: string;
  lastUpload?: firebase.firestore.Timestamp;
  project: string;
  status: "OK";

  //Ensure the site name is only in use by one recorder
  // NOTE - DO NOT PROCESS AUDIO UNLESS A SITE IS SET
  site?: string; // the name of the site the recorder was at when recorded
  location?: firebase.firestore.GeoPoint;

  // The device configuration
  config?: RecorderConfig;

  // If true any audio coming from this device will be ignored.
  disabled?: boolean;
}

export interface RecorderConfig {
  configId: string; // should be a hash of the settings
  hostname: string;
  username: string;
  password: string;
  recordingFrequency: number;
  recordingLenthSecs: number;
  sleepTimes: number;
  compressAudio: boolean;
}

export interface AudioRecord {
  id: string;
  analysesPerformed: string[];
  createdAt: firebase.firestore.Timestamp;
  // the time given to us by the bugg
  uploadedAt: firebase.firestore.Timestamp;
  project?: string | null;
  recorder: string;
  config: string;
  site: string; // the name of the site the recorder was at when recorded
  location: firebase.firestore.GeoPoint;
  bucket: string;
  path: string; // path of the file in the bucket
  uri: string;

  // True if something has been detected in this audio sample
  hasDetections?: boolean;
  detections?: Detection[];

  metadata: any;

  // Used to secure the download links
  downloadToken?: string;
}

export interface Detection {
  id: string;
  // The timestamp in seconds the detection occured in the sample
  start: number;
  // The timestamp in seconds the detection finished in the sample
  end: number;
  // Supplied tags to help classify the audio. Usually user supplied
  tags: string[];
  // The analysis that produced this detection
  analysisId: string;
  // the link to the clipped audio file
  uri?: string;
  // the link to the clipped audio after it's been passed through a loudnorm filter
  uriLoudnorm?: string;
  // The time the detection occured
  time?: firebase.firestore.Timestamp;
}

export interface Analysis {
  id: string;
  colourPrimary?: string;
  colourSecondary?: string;
  displayName?: string;
  icon?: string;

  // false removes it from the firebase UI. Useful for intermediate steps
  hidden: boolean;

  // the url the service lives at
  url: string;
  // either one of these tokens or an analysis ID
  trigger: "new_audio" | "daily" | "weekly" | string;
}

export interface Profile {
  id: string;
  createdAt: firebase.firestore.Timestamp;
  displayName: string;
  projects: string[];
}

export interface Project {
  id: string;
  createdAt: firebase.firestore.Timestamp;
  name: string;
  uploadKey: string;
}
