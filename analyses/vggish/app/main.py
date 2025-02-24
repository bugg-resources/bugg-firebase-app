import os
from concurrent.futures import TimeoutError

import numpy as np
from google.cloud import pubsub_v1, storage

from AudiosetAnalysis import AudiosetAnalysis
from bugg import *

subscription_id = "analyses.vggish-sub"
analysis_id = "vggish"

an = AudiosetAnalysis()
an.setup()

def on_process_audio(audio_id: str, audio_rec: dict, audio_file_path: str):
    
    print(f"PROCESSING audioId={audio_id}")

    results = an.analyse_audio(audio_file_path)
    print("analysis complete") 
        
    # We store these results in cloud storage
    client = storage.Client()
    bucket = client.bucket("bugg-301712.appspot.com")

    for res in results.items():
        print('{}: {}'.format(res[0],res[1]))

        filename = '{}.npy'.format(res[0])
        workingDir = os.path.abspath(".")
        filePath = f"{workingDir}/{filename}"

        print(f"Writing result to {filePath}")
        np.save(filePath, res[1], False)

        project = audio_rec["project"]
        destinationFile = f"artifacts/{analysis_id}/{project}/{audio_id}/{filename}"
        blob = bucket.blob(destinationFile)
        blob.upload_from_filename(filePath)
        os.remove(filePath)
        print('saved {}'.format(res[0]))

        metadata = {'projectId': project}
        blob.metadata = metadata
        blob.patch()
    
    # add the detections to the audio 
    markAnalysisComplete(analysisId=analysis_id, audioId=audio_id, detections=[])

    print(f"{audio_id} completed")



def on_message(message):
    audio_id = message.data.decode("utf-8") 

    audio_rec = getAudioDBRecord(audio_id)

    # Download the audio file 
    audio_file_path = downloadAudio(analysis_id, audio_rec)    

    on_process_audio(audio_id, audio_rec, audio_file_path)

    # cleanup
    deleteDownloadedAudio(audio_file_path)

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
