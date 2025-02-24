import firebase from "firebase/app";

export interface Recorder {
  createdAt: firebase.firestore.Timestamp;
  deviceId: string;
  name: string;
  project?: string;

  //Ensure the site name is only in use by one recorder
  // NOTE - DO NOT PROCESS AUDIO UNLESS A SITE IS SET
  site?: string; // the name of the site the recorder was at when recorded
  location?: firebase.firestore.GeoPoint;

  // The device configuration
  configId?: string;

  // If true any audio coming from this device will be ignored.
  disabled?: boolean;

  // A slim copy of the audio record. Used for the map view
  lastUpload?: {
    id: string;
    uploadedAt: firebase.firestore.Timestamp;
    uri: string;
  };
}

export interface RecorderConfig {
  createdAt: firebase.firestore.Timestamp;
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
  createdAt: firebase.firestore.Timestamp;
  // the time given to us by the bugg
  uploadedAt: firebase.firestore.Timestamp;
  project: string;
  recorder: string;
  // The config that was on the device when the audio received
  config: string;
  site: string; // the name of the site the recorder was at when recorded
  location: firebase.firestore.GeoPoint;

  uri: string;

  // True if something has been detected in this audio sample
  hasDetections?: boolean;
  detections?: Detection[];

  // place for any extra data to be added
  metadata: any;
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

export type Trigger = "new_audio" | "daily" | "weekly" | string;

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
  trigger: Trigger;
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

/***
 * Derrived from the audio objects. This is the main workhorse of the dashboard.
 *
 * It encapsulates parts of audio where a detection has been made
 */
export interface DetectedAudioSegment {
  id: string;

  // Date formated in the way it'll be displayed
  createdAt: firebase.firestore.Timestamp;

  recorder: string;
  siteName: string;

  audioUrl: string;
  // The timestamp in seconds the detection occured in the sample
  start: number;
  // The timestamp in seconds the detection finished in the sample
  end: number;
  // Supplied tags to help classify the audio. Usually user supplied
  tags: string[];
  // The analysis that produced this detection
  analysisId: string;
}

export interface ExportJob {
  id: string;
  createdAt: firebase.firestore.Timestamp;
  projectId: string;
  beganProcessing?: firebase.firestore.Timestamp;
  completedAt?: firebase.firestore.Timestamp;
  recordsProcessed?: number;
  status: "CREATED" | "QUEUED" | "PROCESSING" | "COMPLETE";
  type: "audio" | "detections";
  from?: firebase.firestore.Timestamp;
  to?: firebase.firestore.Timestamp;
  uri?: string;
}
