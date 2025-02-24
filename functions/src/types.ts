import * as admin from "firebase-admin";

export interface Recorder {
  createdAt: admin.firestore.Timestamp;

  deviceId: string;
  name: string;
  // the ID of the project
  project?: string;

  //Ensure the site name is only in use by one recorder
  // NOTE - DO NOT PROCESS AUDIO UNLESS A SITE IS SET
  site?: string; // the name of the site the recorder was at when recorded
  location?: admin.firestore.GeoPoint;

  // The device configuration
  configId?: string;

  // If true any audio coming from this device will be ignored.
  disabled?: boolean;

  // A slim copy of the audio record. Used for the map view
  lastUpload?: {
    // The ID may not be supplied if the recorder doesn't have a site and thus
    // audio shouldnt be processed yet
    id?: string;
    uploadedAt: admin.firestore.Timestamp;
    uri: string;
  };
}

export interface RecorderConfig {
  createdAt: admin.firestore.Timestamp;
  configId: string; // should be a hash of the settings
  projectId: string;
  sensor: {
    capture_delay: number;
    sensor_type: string;
    record_length: number;
    compress_data: boolean;
    record_freq: number;
    awake_times: string[];
  };
  mobile_network: {
    hostname: string;
    username: string;
    password: string;
  };

  // true if we have received at least one sample from a device running this config
  deployed?: boolean;
  // ID's of the devices this config is running on
  recorders: string[];
}

export interface AudioRecord {
  id: string;
  analysesPerformed: string[];
  // the time this record was created
  createdAt: admin.firestore.Timestamp;
  // the time given to us by the bugg
  uploadedAt: admin.firestore.Timestamp;
  // ID of the project this audio is connected with
  project: string;
  recorder: string;
  // The config that was on the device when the audio received
  config: string;
  site: string; // the name of the site the recorder was at when recorded
  location: admin.firestore.GeoPoint;

  uri: string;

  // True if something has been detected in this audio sample
  hasDetections: boolean;
  detections: Detection[];

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
  // The time the detection occured
  time?: admin.firestore.Timestamp;
}

export type Trigger = "new_audio" | "daily" | "weekly" | string;

export interface Analysis {
  id?: string;
  colourPrimary?: string;
  colourSecondary?: string;
  displayName?: string;
  icon?: string;

  // false removes it from the admin UI. Useful for intermediate steps
  hidden: boolean;

  // the url the service lives at @deprecated
  url: string;
  // either one of these tokens or an analysis ID
  trigger: Trigger;

  // the pubsub topic to add a task to
  topic: string;
}

export interface Profile {
  id: string;
  createdAt: admin.firestore.Timestamp;
  displayName: string;
  // project IDs attached to this user
  projects: string[];
}

export interface Project {
  id: string;
  createdAt: admin.firestore.Timestamp;
  name: string;
  uploadKey: string;
  // if true audio will undergo a test to see if it contains speech before further processing
  speechFiltering?: boolean;
  // if true then audio containing speech will be deleted
  // if false it will remain, in-accessible, in the quarantine bucket
  deleteAudioInQuarantine?: boolean;
}

export interface Task {
  id: string;
  createdAt: admin.firestore.Timestamp;
  analysisId: string;
  recorder: string;
  project: string;
  audioId: string;
  audioUri: string;
  processingStarted?: admin.firestore.Timestamp;
  trigger: Trigger;
  status:
    | "SCHEDULED" // newly created and waiting to be worked on
    | "PROCESSING" // a worker as claimed it
    | "FAILED" // timed out, the worker didn't ACK in time
    | "COMPLETE"; // worker has finished processing. Task can be deleted.
}

export interface GMMFitRequest {
  createdAt: admin.firestore.Timestamp;
  queuedAt: admin.firestore.Timestamp | null;
  processingAt: admin.firestore.Timestamp;
  completedAt: admin.firestore.Timestamp | null;

  filename: string;

  inferenceValidEnd: admin.firestore.Timestamp;
  inferenceValidStart: admin.firestore.Timestamp;
  sourceDataEnd: admin.firestore.Timestamp;
  sourceDataStart: admin.firestore.Timestamp;

  attempts: number;

  project: string;
  recorder: string;
  status: "pending" | "queued" | "processing" | "complete" | "failed";
  uri: string;
}
