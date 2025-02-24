

# Receive Audio

# Get the recorder

# Determine what the name of the gmm model is we should be using 

import hashlib
from datetime import date, datetime, timedelta


def calculate_model_info(project: str, recorder: str, recorder_created: datetime, audio_upload_date: datetime):
    """
    Here we work out what the date will have been for the model that this audio file should perform inference against.
    Can return None at the start of a recorder's life when there's not enough data

    Models are created every 5 days after the recorder was first seen. 
    This can be used then to either download the model and perform inference or issue a command for the model to be generated
    """

    # the number of days a model lasts for
    days_valid = 5

    delta = audio_upload_date - recorder_created
    if delta.days < days_valid:
        return None

    gmm_model_date = recorder_created + timedelta(days=(delta.days - (delta.days % days_valid) - 1))

    gmm_model_start_date = gmm_model_date - timedelta(days=(days_valid) - 1)

    # Using strings to clamp to the right utc time
    source_utc_start = datetime.strptime(f'{gmm_model_start_date.strftime("%Y-%m-%d")}T00:00:00+0000', "%Y-%m-%dT%H:%M:%S%z")
    source_utc_end = datetime.strptime(f'{gmm_model_date.strftime("%Y-%m-%d")}T23:59:59+0000', "%Y-%m-%dT%H:%M:%S%z")

    if_st_d  = gmm_model_date + timedelta(days=1)
    if_end_d = gmm_model_date + timedelta(days=(days_valid))

    inference_valid_start = datetime.strptime(f'{if_st_d.strftime("%Y-%m-%d")}T00:00:00+0000', "%Y-%m-%dT%H:%M:%S%z")
    inference_valid_end   = datetime.strptime(f'{if_end_d.strftime("%Y-%m-%d")}T23:59:59+0000', "%Y-%m-%dT%H:%M:%S%z")

    filename = f'{recorder}_{source_utc_start.strftime("%y-%m-%d")}_{source_utc_end.strftime("%y-%m-%d")}_gmm_model.pickle'

    uri = f"gs://bugg-301712.appspot.com/artifacts/gmm/{project}/{recorder}/{filename}"

    model_id = hashlib.md5(f'{project}_{filename}'.encode('utf-8')).hexdigest()

    return {
        # Audio files that went into generating this model were uploaded between model_start and model_end
        "source_data_start": source_utc_start,
        "source_data_end": source_utc_end,
        # Dates of audio uploads that this model is valid for inference
        "inference_valid_start": inference_valid_start,
        "inference_valid_end": inference_valid_end,
        "filename": filename,
        "uri": uri,
        "id": model_id
    }



# - Testing -
# rec_date        = datetime(2021, 1, 1, 1, 0, 0, 0)
# for i in range(100):
#     audio_uploaded = rec_date + timedelta(days=(i))
#     info = calculate_model_info("proj_123", "rec_123", rec_date, audio_uploaded)
#     if info:
#         print(audio_uploaded,",", info["source_data_start"],",", info["source_data_end"],",", info["inference_valid_start"],",", info["inference_valid_end"], ",", info["id"])
#         # print(audio_uploaded.strftime("%y-%m-%d"),",", info["source_data_start"].strftime("%y-%m-%d"),",", info["source_data_end"].strftime("%y-%m-%d"),",", info["inference_valid_start"].strftime("%y-%m-%d"),",", info["inference_valid_end"].strftime("%y-%m-%d"))




