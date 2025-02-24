from concurrent.futures import TimeoutError
from unittest import result
from google.cloud import pubsub_v1
from bugg import *
from google.cloud import storage
from pyannote_predict import detect_speech
import os
from datetime import datetime, timedelta
import librosa
import hashlib

subscription_id = "speech-filter-sub"


def getDateFileName(datetime_base: datetime, time_in_audio: float):
    """
    Adds on the number of seconds in the audio file to the datetime object so that the timestamp is correct for the clip.
    """
    # Extract the value before the decimal point
    t_seconds = int(time_in_audio)
    # Extract the value after the decimal point
    t_milliseconds = int((time_in_audio - t_seconds) * 1000)
    t_datetime = datetime_base + \
        timedelta(seconds=t_seconds, milliseconds=t_milliseconds)
    t_iso_datetime = t_datetime.isoformat(
        timespec='milliseconds').replace("+00:00", "Z")
    return t_iso_datetime.replace(":", "_")


def on_filter_audio(storage_url: str, audio_file_path: str):
    # example storage_url
    # gs://bugg-audio-speech-filter/audio/proj_sig/bugg_RPiID-10000sigdemo1/conf_f336ad3/2022-02-22T17_32_42.598Z.mp3

    object_name = storage_url.replace("gs://bugg-audio-speech-filter/", "")
    print(f"PROCESSING audio={object_name}")

    file_extension = storage_url.split(".")[-1]

    # e.g. audio/proj_sig/bugg_RPiID-10000sigdemo1/conf_f336ad3
    path_prefix = "/".join(object_name.split("/")[:-1])

    # Get the duration of the audio file
    full_duration = librosa.get_duration(filename=audio_file_path)
    print(f"full_duration={full_duration}")

    # Convert the mp3 to a wav file
    wav_file_path = audio_file_path.replace(".mp3", ".wav")
    command = f"ffmpeg -hide_banner -loglevel error -y -i {audio_file_path} {wav_file_path}"
    print(f"Converting {audio_file_path} to {wav_file_path}")
    os.system(command)

    detections = detect_speech(wav_file_path)
    has_human_speech = len(detections) > 0

    client = storage.Client()

    if has_human_speech:
        # We need to extract the date from the file name
        isodate = object_name.split(
            '/')[-1].replace("_", ":").replace(".mp3", "")
        datetime_base = datetime.strptime(isodate, "%Y-%m-%dT%H:%M:%S.%f%z")

        # Split into clips of audio with and audio without human speech
        # and upload to the respective buckets

        if not os.path.exists("/tmp/audio-with-speech"):
            os.makedirs("/tmp/audio-with-speech")

        if not os.path.exists("/tmp/audio-without-speech"):
            os.makedirs("/tmp/audio-without-speech")

        # Slice the speech out of the audio
        current_time = 0
        for detection in detections:
            start = detection["start"]
            end = detection['end']

            if start > current_time:
                # Extract the audio before the human speech
                duration = start - current_time
                if duration > 0.1:
                    iso_filename = getDateFileName(datetime_base, current_time)
                    print(f"pre without iso_filename={iso_filename}")
                    command = f"ffmpeg -hide_banner -loglevel error -y -ss {current_time} -i {audio_file_path} -t {duration} -c copy /tmp/audio-without-speech/{iso_filename}.{file_extension}"
                    os.system(command)
                else:
                    print("duration of clean audio is too short")
                    start = current_time

            # Extract the human speech
            duration = end - start
            iso_filename = getDateFileName(datetime_base, start)
            print(f"with iso_filename={iso_filename}")
            command = f"ffmpeg -hide_banner -loglevel error -y -ss {start} -i {audio_file_path} -t {duration} -c copy /tmp/audio-with-speech/{iso_filename}.{file_extension}"
            os.system(command)

            current_time = end

        # Clip the last section of audio
        if current_time < full_duration:
            duration = full_duration - current_time
            iso_filename = getDateFileName(datetime_base, current_time)
            print(f"last without iso_filename={iso_filename}")
            command = f"ffmpeg -hide_banner -loglevel error -y -ss {current_time} -i {audio_file_path} -t {duration} -c copy /tmp/audio-without-speech/{iso_filename}.{file_extension}"
            os.system(command)

        # upload the segments with speech to the quarantine bucket
        quarantine_bucket_name = "bugg-audio-speech-quarantine"
        quarantine_bucket = client.get_bucket(quarantine_bucket_name)
        for file in os.listdir("/tmp/audio-with-speech/"):
            blob = quarantine_bucket.blob(f"{path_prefix}/{file}")
            blob.upload_from_filename(
                filename=f"/tmp/audio-with-speech/{file}")

        # all others continue processing
        bucket = client.get_bucket("bugg-301712.appspot.com")
        for file in os.listdir("/tmp/audio-without-speech/"):
            blob = bucket.blob(f"{path_prefix}/{file}")
            blob.upload_from_filename(
                filename=f"/tmp/audio-without-speech/{file}")

        # Delete the dir /tmp/audio-with-speech and /tmp/audio-without-speech
        os.system("rm -rf /tmp/audio-with-speech")
        os.system("rm -rf /tmp/audio-without-speech")

        db = getDb()

        project = object_name.split("/")[1]
        recorder = object_name.split("/")[2]
        config = object_name.split("/")[3]
        date = object_name.split("/")[4]

        db.collection(u'filtered').add({
            u'filter': u'speech-detection-pyannote',
            u'object': object_name,
            u'uploadedAt': isodate,
            u'project': project,
            u'recorder': recorder,
            u'config': config,
            u'date': date.replace(f".{file_extension}", ""),
            u'fileExtension': file_extension,
            u'detections': [{
                u'start': x['start'],
                u'end': x['end'],
                u'tags': ['speech']
            } for x in detections]
        })

    else:
        print("no speech detected")
        # can continue processing
        # upload the audio file to the standard audio bucket
        bucket = client.get_bucket("bugg-301712.appspot.com")
        blob = bucket.blob(object_name)
        blob.upload_from_filename(audio_file_path)

    # delete the audio file from the bugg-audio-speech-filter bucket
    bucket = client.get_bucket("bugg-audio-speech-filter")
    blob = bucket.blob(object_name)
    blob.delete()

    os.remove(wav_file_path)

    print(f"{storage_url} completed")


analysis_id = "speech-detection-pyannote"


def on_process_audio(audio_id: str, audio_rec: dict, audio_file_path: str):

    print(f"PROCESSING audioId={audio_id} audio_file_path={audio_file_path}")

    # Convert the mp3 to a wav file
    wav_file_path = audio_file_path.replace(".mp3", ".wav")
    command = f"ffmpeg -hide_banner -loglevel error -y -i {audio_file_path} {wav_file_path}"
    print(f"Converting {audio_file_path} to {wav_file_path}")
    os.system(command)

    results = detect_speech(wav_file_path)
    os.remove(wav_file_path)

    detections = []
    for detection in results:
        start = detection["start"]
        end = detection['end']

        # create the detections
        detections.append({
            u"id": hashlib.md5(f"{start}-{end}".encode('utf-8')).hexdigest()[:6],
            u"start": start,
            u"end": end,
            u"tags": ["speech"],
            u"analysisId": analysis_id
        })

    # add the detections to the audio database record
    markAnalysisComplete(analysisId=analysis_id,
                         audioId=audio_id, detections=detections)

    print(f"{audio_id} completed with {len(detections)} detections")


def on_message(message):
    message_string = message.data.decode("utf-8")

    # If message_string starts with "gs://bugg-audio-speech-filter" then it is a storage url and we need to run filtering
    if message_string.startswith("gs://bugg-audio-speech-filter"):
        storage_url = message_string

        # Download the audio file
        audio_file_path = downloadAudioUrl(storage_url)

        # Run the processing
        on_filter_audio(storage_url, audio_file_path)

        # Cleanup
        deleteDownloadedAudio(audio_file_path)

        message.ack()
        print(f"Filtering complete for {storage_url}")

    else:
        # We should have an audio id to run an analysis with
        audio_id = message_string
        # Fetch the database record we have for this audio clip
        audio_rec = getAudioDBRecord(audio_id)

        # Download the audio file
        audio_file_path = downloadAudio(analysis_id, audio_rec)

        # Run the processing
        on_process_audio(audio_id, audio_rec, audio_file_path)

        # Cleanup
        deleteDownloadedAudio(audio_file_path)

        message.ack()
        print(f"Processing complete for {audio_id}")


def start():
    project_id = "bugg-301712"
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(
        project_id, subscription_id)

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
            # Block until the shutdown is complete.
            streaming_pull_future.result()


if __name__ == "__main__":
    start()
