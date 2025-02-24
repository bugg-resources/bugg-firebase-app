import json
import os

import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, jsonify, request
from mutagen.mp3 import MP3

from bugg import *

app = Flask(__name__)

db = firestore.Client()

# A sample that analyses the audio file and posts the results to the database
@app.route("/", methods=['POST'])
def hello_world():

    # This is just a convenience to deseralise the json POST body into an object the IDE will be able to auto complete for
    analysisRequest = unpack(request)

    print("received:")
    print(analysisRequest.to_json())

    # Example on how to fetch the database record of this audio. Handy to see what other analyses have been completed. 
    audioDBRecord = getAudioDBRecord(analysisRequest.audioId)
    print("audioDBRecord")
    print(json.dumps(audioDBRecord, sort_keys=True, default=str))

    # Download the audio file from storage to the local disk.
    print("downloading audio")
    audioPath = downloadAudio(analysisRequest)

    # An toy example of processing the audio file
    audioMeta = MP3(audioPath)
    print("audio file length")
    print(audioMeta.info.length)

    # Cloud Run uses an in-memory disk that is shared across requests so it's important the file is deleted after
    print("deleting file")
    deleteAudio(audioPath)

    # If it's less than 1mb you can store the result in firebase
    setAnalysisResult(analysisRequest.analysisId, analysisRequest.audioId, {
        "length": audioMeta.info.length,
        "channels": audioMeta.info.channels,
        "bitrate": audioMeta.info.bitrate,
        "sample_rate": audioMeta.info.sample_rate,
        "encoder_info": audioMeta.info.encoder_info,
        "encoder_settings": audioMeta.info.encoder_settings,
        "bitrate_mode": audioMeta.info.bitrate_mode,
        "track_gain": audioMeta.info.track_gain,
        "track_peak": audioMeta.info.track_peak,
        "album_gain": audioMeta.info.album_gain,
        "version": audioMeta.info.version,
        "layer": audioMeta.info.layer,
        "mode": audioMeta.info.mode,
        "protected": audioMeta.info.protected,
        "sketchy": audioMeta.info.sketchy,
    })
    print("analysis result is set")

    # Example of fetching a result for an analysis
    result = getAnalysisResult(analysisRequest.analysisId, analysisRequest.audioId)
    print("got analysis result")
    print(json.dumps(result, sort_keys=True, default=str))

    # Add in a sample detection 
    recordDetection(analysisRequest.analysisId, analysisRequest.audioId, 3, 8, ["sample", "demo"])

    # Finally, when complete update the database saying so. 
    # This is required to then kick off any other analyses that want to be processed 
    markAnalysisComplete(analysisRequest.analysisId, analysisRequest.audioId)

    print("Done!")

    return "OK"


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
