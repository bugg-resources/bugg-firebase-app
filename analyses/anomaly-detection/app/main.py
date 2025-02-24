import hashlib
import os
from concurrent.futures import TimeoutError

from google.cloud import pubsub_v1

from bugg import *
from calc_anomaly_scores import analyse_audio_file
from utils import *

subscription_id = "analyses.anomaly-detection-sub"
analysis_id = "anomaly-detection"

def on_process_audio_features(model_file_path: str, features_file_path: str, audio_id: str, audio_rec: dict):
    
    print(f"PROCESSING audioId={audio_id} {model_file_path} {features_file_path}")
    
    results = analyse_audio_file(model_file_path, features_file_path)
    print(len(results), "results", results)

    detections = []
    for r in results: 
        start = r["start"]
        end = r["end"]
        confidence = r["confidence"]
        threshold = r["threshold"]

        # create the detections
        detections.append({
            u"id": hashlib.md5(f"{start}-{end}-{analysis_id}".encode('utf-8')).hexdigest()[:6],
            u"start": start,
            u"end": end,
            u"tags": [],
            u"analysisId": analysis_id,
            u"confidence": confidence,
            u"threshold": threshold,
        })

    # add the detections to the audio database record
    markAnalysisComplete(analysisId=analysis_id, audioId=audio_id, detections=detections)

    print(f"{audio_id} completed with {len(detections)} detections")

def get_or_create_model(audio_rec):
    """
    Will return the record from Firebase or create the record and return None.

    In the later case a job to create the GMM model will be started and the audio file will be reprocessed once the model is ready.
    """

    # Determine if the model for inference has been created 
    recorder = getRecorder(audio_rec["project"], audio_rec["recorder"])
    model_info = calculate_model_info(audio_rec["project"], audio_rec["recorder"], recorder["createdAt"], audio_rec["uploadedAt"])

    if model_info is None:
        # can happen if there isnt enough days to create the model i.e. the first 5 days when a recorder has just been deployed
        return None

    db = getDb()

    model_rec = db.collection("analyses").document("anomaly-detection") \
        .collection("models").document(model_info["id"]).get()

    if not model_rec.exists:
        print(f"Model {model_info['id']} needs to be created. Deferring processing")
        # create the record in firebase    <--    this is a lock. May need a mechanism to retry these?
        db.collection("analyses").document("anomaly-detection") \
            .collection("models") \
            .document(model_info["id"]).set({
                u"createdAt": firestore.SERVER_TIMESTAMP,
                u"processingAt": None,
                u"completedAt": None,
                u"project": audio_rec["project"],
                u"recorder": audio_rec["recorder"],
                u"sourceDataStart": model_info["source_data_start"],
                u"sourceDataEnd": model_info["source_data_end"],
                u"inferenceValidStart":  model_info["inference_valid_start"],
                u"inferenceValidEnd":  model_info["inference_valid_end"],
                u"filename": model_info["filename"],
                u"uri": model_info["uri"],
                u"status": "pending"
            }, merge=True)
        return None
    else:
        item = model_rec.to_dict()

        if item["status"] == "complete":
            return item
            
        # the model is not ready yet.
        print(f"Model {model_info['id']} is not ready yet. Deferring processing")
        return None


def on_message(message):
    audio_id = message.data.decode("utf-8") 

    # Fetch the database record we have for this audio clip
    audio_rec = getAudioDBRecord(audio_id)

    # Ensure the vggish processing has been completed. We'll be downloading the features later.
    if "vggish" not in audio_rec["analysesPerformed"]:
        raise Exception(f"{audio_id} has not been processed by vggish")

    # Note that if the model is not ready, this will return None and
    # we will not process the audio yet. It will be retried after the 
    # model has been created.
    model_rec = get_or_create_model(audio_rec)

    if model_rec is not None:
        # Download the model
        model_file_path = downloadFromCloudStorage(model_rec["uri"], f"/tmp/{model_rec['filename']}")

        # Download the features
        features_uri = f"gs://bugg-301712.appspot.com/artifacts/vggish/{audio_rec['project']}/{audio_id}/raw_audioset_feats_960ms.npy"
        features_file_path = downloadFromCloudStorage(features_uri, f"/tmp/{audio_id}_raw_audioset_feats_960ms.npy")

        # Run inference
        on_process_audio_features(model_file_path, features_file_path, audio_id, audio_rec)

        # Cleanup
        os.remove(features_file_path)

        # The models can get used a lot and they're reasonably small. 
        # Maybe it is better to keep them around. The preemptable VMs we use will likely restart before the disk is full.
        # os.remove(model_file_path)

    message.ack()
    print(f"Processing complete for {audio_id}")


def start():
    project_id = "bugg-301712"
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    # Limit the subscriber to only have one outstanding message at a time.
    flow_control = pubsub_v1.types.FlowControl(max_messages=1)

    streaming_pull_future = subscriber.subscribe(
        subscription_path, callback=on_message, flow_control=flow_control
    )
    print(f"Listening for messages on {subscription_path}..\n")

    # Wrap subscriber in a 'with' block to automatically call close() when done.
    with subscriber:
        try:
            # When `timeout` is not set, result() will block indefinitely,
            # unless an exception is encountered first.
            streaming_pull_future.result()
        except TimeoutError:
            streaming_pull_future.cancel()  # Trigger the shutdown.
            streaming_pull_future.result()  # Block until the shutdown is complete.


if __name__ == "__main__":
    start()
