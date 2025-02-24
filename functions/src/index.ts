import * as firebase from "firebase-admin";
import { analysisTriggerCompletedAnalysis } from "./analysisTriggerCompletedAnalysis";
import { analysisTriggerNewAudio } from "./analysisTriggerNewAudio";
import { giveUserProjectClaims } from "./giveUserProjectClaims";
import { magicLink } from "./magicLink";
import { onAudioRecordChanged } from "./onAudioRecordChanged";
import { onExportRequested } from "./onExportRequested";
import { onNewAudioFile } from "./onNewAudioFile";
import { onNewUser } from "./onNewUser";
import { onSpeechFilterRequested } from "./onSpeechFilterRequested";
import { onUploadFromBugg } from "./onUploadFromBugg";
import { processAnomalyFitModelRequests } from "./processAnomalyFitModelRequests";
import { onAudioQuarantined } from "./onAudioQuarantined";
import { createAggregates } from "./createAggregates";

firebase.initializeApp();

module.exports.analysisTriggerCompletedAnalysis =
  analysisTriggerCompletedAnalysis;
module.exports.analysisTriggerNewAudio = analysisTriggerNewAudio;
module.exports.giveUserProjectClaims = giveUserProjectClaims;
module.exports.onNewAudioFile = onNewAudioFile;
module.exports.onNewUser = onNewUser;
module.exports.onUploadFromBugg = onUploadFromBugg;
module.exports.magicLink = magicLink;
module.exports.onAudioRecordChanged = onAudioRecordChanged;
module.exports.onExportRequested = onExportRequested;
module.exports.processAnomalyFitModelRequests = processAnomalyFitModelRequests;

module.exports.onSpeechFilterRequested = onSpeechFilterRequested;
module.exports.onAudioQuarantined = onAudioQuarantined;

module.exports.createAggregates = createAggregates;
