import torch
import json
from pyannote.audio.utils.signal import Binarize

def detect_speech(wav_file_path: str):
    # Device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load the PyAnnote model
    print("Loading the model...")
    sad = torch.hub.load('pyannote/pyannote-audio', 'sad_ami', device=device, batch_size=128)

    print("Loading the audio...")
    binarize = Binarize(offset=0.52, onset=0.52, log_scale=True, min_duration_off=0.6, min_duration_on=0.6)    
    sad_scores = sad({'uri': 'file', 'audio': wav_file_path})

    # speech regions as a list / Can be an alternative to
    # speech.duration if we want to know WHERE is the speech
    speech = binarize.apply(sad_scores, dimension=1)

    # print the speech regions to the console
    print("speech regions")
    print(speech)


    # Convert to Dict
    # Example of object:
    # {
    #     pyannote: "Timeline",
    #     content: [
    #         { start: 0.01015625, end: 88.31871874999999 },
    #         { start: 89.46284374999999, end: 92.63365625 },
    #         { start: 93.31878125, end: 98.24459375 },
    #         { start: 101.71240624999999, end: 109.49178125 },
    #         { start: 110.51103125, end: 122.49228124999999 },
    #         { start: 123.10315625000001, end: 132.51096875 },
    #         { start: 133.99934374999998, end: 169.99203125 },
    #         { start: 170.99271875, end: 182.58921875 },
    #         { start: 183.49203125, end: 193.49215625 },
    #         { start: 194.62446875, end: 203.52603125 },
    #         { start: 206.00834375, end: 215.10734374999998 },
    #         { start: 216.13334375, end: 243.31559375 },
    #         { start: 244.01084375, end: 254.43453125 },
    #         { start: 257.01134375000004, end: 300.00884375 },
    #     ],
    # }

    speech_obj = speech.for_json()
    return speech_obj['content']
