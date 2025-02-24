import hashlib
import json
import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import storage


def init_firebase():
    # Use the application default credentials
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {
        'projectId': "bugg-301712",
    })

init_firebase()

db = firestore.client()

def getDb():
    return db
 
def getAudioDBRecord(audioId: str): 
    # fetches the record we have for this audio file from the database
    audio_ref = db.collection(u'audio').document(audioId)
    doc = audio_ref.get()
    if doc.exists:
        return doc.to_dict()

    return None

def getAnalysisResult(analysisId: str, audioId: str): 
    """
    Will return the result from firestore if there is one or None if not.

    Note that storing results in the palce is optional (and subject to 1mb limit). This method is just for convenience
    """
    results_ref = db.collection(u'audio').document(audioId).collection(analysisId).document(u'result')
    doc = results_ref.get()
    if doc.exists:
        return doc.to_dict()

    return None

def setAnalysisResult(analysisId: str, audioId: str, result: dict): 
    """
    Store a result in the common place in firestore. Will merge into any existing result.
    
    (Storing in this spot is optional.)

    Note no transactions are used, you may want to explore them if writing multiple entries.
    """
    results_ref = db.collection(u'audio').document(audioId).collection(analysisId).document(u'result')
    results_ref.set(result, merge=True)

# def recordDetection(analysisId: str, audioId: str, startTimeSecs: int, endTimeSecs: int, tags: list[str]): 
#     """
#     Record a detection discovered within this audio
#     """

#     # To prevent duplicates we need some stable ID. Attempt to derive one from the timestamps
#     idStr = f"{analysisId}-{startTimeSecs}-{endTimeSecs}"
#     id = hashlib.md5(idStr.encode()) 

#     results_ref = db.collection(u'audio').document(audioId).collection("detections").document(id)
#     results_ref.set({
#         u'id': id,
#         # The timestamp in seconds the detection occured in the sample
#         u'start': startTimeSecs,
#         # The timestamp in seconds the detection finished in the sample
#         u'end': endTimeSecs,
#         # Supplied tags to help classify the audio. Usually user supplied
#         u'tags': tags,
#         # The analysis that produced this detection
#         u'analysisId': analysisId
#     }, merge=True)


def markAnalysisComplete(analysisId: str, audioId: str, detections: list): 
    """
    Updates the audio record to show that analysis is done (which will kick off other analyses)
    """
    transaction = db.transaction()
    _markCompleteInTransaction(transaction, analysisId, audioId, detections)


@firestore.transactional
def _markCompleteInTransaction(transaction, analysisId: str, audioId: str, detections: list):
    audioRef = db.collection(u'audio').document(audioId)

    snapshot = audioRef.get(transaction=transaction)
    analysesPerformed = snapshot.get(u'analysesPerformed')    

    if analysisId in analysesPerformed:
        print(f"Analysis {analysisId} already complete for {audioId}")
        return

    analysesPerformed.append(analysisId)

    prevDetections = snapshot.get(u'detections')    
    # Add in any that don't have an ID that matches in the list

    for d in detections:
        match = next((x for x in prevDetections if d["id"] == x["id"]), None)
        if match == None:
            prevDetections.append(d)

    transaction.update(audioRef, {
        u'analysesPerformed': analysesPerformed,
        u'detections': prevDetections,
        u'hasDetections': len(prevDetections) > 0
    })

def downloadAudio(analysisId: str, audioRecord: dict) -> str: 
    """ 
    Downloads the audio file from cloud storage to a place locally.

    Be sure to delete the file after processing.

    Will return the filename once download is complete
    """

    audio_id = audioRecord["id"]
    uri = audioRecord["uri"]

    destinationPath = f"tmp/{analysisId}";
    Path(destinationPath).mkdir(parents=True, exist_ok=True)
    destinationFile = f"{destinationPath}/{audio_id}.mp3"
    
    print(f"Downloading {uri}")

    client = storage.Client()
    with open(destinationFile, "wb") as file_obj:
        client.download_blob_to_file(uri, file_obj)

    return destinationFile

def deleteDownloadedAudio(filepath: str):
    os.remove(filepath)
