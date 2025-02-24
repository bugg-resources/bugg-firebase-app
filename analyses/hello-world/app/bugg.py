import hashlib
import json
import os
from dataclasses import dataclass, field
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore, storage

# Use the application default credentials
cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred, {
  'projectId': "bugg-301712",
})

db = firestore.client()

@dataclass()
class AnalysisJobRequest():
    data: dict
    analysisId: str
    audioId: str
    path: str
    recorder: str
    project: str
    bucket: str
    uri: str
    
    def to_json(self):
        """
        The original data for the request
        """

        return json.dumps(self.data)

def getDb():
    return db

def unpack(request) -> AnalysisJobRequest:
    # will deseralise the incomming request into something nicer for intellisense
    # the original data posted will look like this: 
    # {
    #    analysisId: "hello-world",
    #    audioId: NusNcygBojyrwyFLb7Ws, 
    #    path: audio/project_123AA/00000000249ae42f/16129620954379.mp3, 
    #    recorder: 00000000249ae42f, 
    #    project: "project_123AA",
    #    bucket: "bugg-301712.appspot.com",
    #    uri: https://firebasestorage.googleapis.com/v0/b/bugg-301712.appspot.com/o/audio%2Fproject_123AA%2F00000000249ae42f%2F16129620954379.mp3?alt=media
    # }
    data = request.json
    return AnalysisJobRequest(data= data, analysisId= data["analysisId"], audioId= data["audioId"],path= data["path"],recorder= data["recorder"],project= data["project"],bucket= data["bucket"],uri= data["uri"])

 
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

def recordDetection(analysisId: str, audioId: str, startTimeSecs: int, endTimeSecs: int, tags: list[str]): 
    """
    Record a detection discovered within this audio
    """

    # To prevent duplicates we need some stable ID. Attempt to derive one from the timestamps
    idStr = f"{analysisId}-{startTimeSecs}-{endTimeSecs}"
    id = hashlib.md5(idStr.encode()) 

    results_ref = db.collection(u'audio').document(audioId).collection("detections").document(id)
    results_ref.set({
        u'id': id,
        # The timestamp in seconds the detection occured in the sample
        u'start': startTimeSecs,
        # The timestamp in seconds the detection finished in the sample
        u'end': endTimeSecs,
        # Supplied tags to help classify the audio. Usually user supplied
        u'tags': tags,
        # The analysis that produced this detection
        u'analysisId': analysisId
    }, merge=True)


def markAnalysisComplete(analysisId: str, audioId: str): 
    """
    Updates the audio record to show that analysis is done (which will kick off other analyses)
    """
    transaction = db.transaction()
    _markCompleteInTransaction(transaction, analysisId, audioId)


@firestore.transactional
def _markCompleteInTransaction(transaction, analysisId: str, audioId: str):
    audioRef = db.collection(u'audio').document(audioId)

    snapshot = audioRef.get(transaction=transaction)
    analysesPerformed = snapshot.get(u'analysesPerformed')    

    if analysisId in analysesPerformed:
        return

    analysesPerformed.append(analysisId)
    transaction.update(audioRef, {
        u'analysesPerformed': analysesPerformed
    })

def downloadAudio(request: AnalysisJobRequest) -> str: 
    """ 
    Downloads the audio file from cloud storage to a place locally.

    Be sure to delete the file after processing as Cloud Run uses an in-memory disk that persists during requests.

    Will return the filename once download is complete
    """
    bucket = storage.bucket(request.bucket)

    destinationPath = f"local/{request.analysisId}/{request.audioId}";
    Path(destinationPath).mkdir(parents=True, exist_ok=True)
    destinationFile = f"{destinationPath}/{request.audioId}.mp3"
    
    # Construct a client side representation of a blob.
    # Note `Bucket.blob` differs from `Bucket.get_blob` as it doesn't retrieve
    # any content from Google Cloud Storage. As we don't need additional data,
    # using `Bucket.blob` is preferred here.
    blob = bucket.blob(request.path)
    blob.download_to_filename(destinationFile)

    return destinationFile

def deleteAudio(filepath: str):
    os.remove(filepath)
