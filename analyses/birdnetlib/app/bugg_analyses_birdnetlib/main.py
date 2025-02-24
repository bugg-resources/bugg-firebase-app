import hashlib
from datetime import datetime

from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
from bugg_analysis_lib.firebase import BuggFirebase
from bugg_analysis_lib.pubsub import BuggMessageAnalyser, init_subscription

BIRDNET_ANALYZER_VERSION = "2.4"

fb = BuggFirebase("bugg-301712")
analysis_id = "birdnetlib"
subscription_id = "analyses.birdnetlib-sub"
minimum_confidence_threshold = 0.45


def analyse_audio_file(
    file_path: str,
    time: datetime,
    lat: float,
    lon: float,
    minimum_confidence_threshold: float,
):
    # Load and initialize the BirdNET-Analyzer models.
    analyzer = Analyzer(version=BIRDNET_ANALYZER_VERSION)

    recording = Recording(
        analyzer,
        file_path,
        lat=lat,
        lon=lon,
        # Note that we use the ISO week number whereas BirdNET uses week_48
        # Difference should be minimal, see:
        # https://github.com/kahst/BirdNET-Analyzer/issues/128#issuecomment-1842258483
        week_48=time.isocalendar()[1],
        min_conf=minimum_confidence_threshold,
    )
    recording.analyze()
    return recording.detections


def on_process_audio(audio_rec: dict, audio_file_path: str):
    upload_time = audio_rec["uploadedAt"]
    location = audio_rec["location"]

    results = analyse_audio_file(
        audio_file_path,
        upload_time,
        location.latitude,
        location.longitude,
        minimum_confidence_threshold,
    )

    detections = []
    for r in results:
        # create the detections
        detections.append(
            {
                "id": hashlib.md5(
                    f"{r['start_time']}-{r['end_time']}-{r['scientific_name']}".encode(
                        "utf-8"
                    )
                ).hexdigest()[:6],
                "start": str(r["start_time"]),
                "end": str(r["end_time"]),
                "tags": [r["common_name"]],
                "analysisId": analysis_id,
                "confidence": str(r["confidence"]),
            }
        )

    return detections


def on_message(message):
    with BuggMessageAnalyser(message, analysis_id, fb) as m:
        # Getting audio and metadata is handled by BuggMessageAnalyser class

        print(f"PROCESSING audioId={m.audio_id}")

        detections = on_process_audio(m.audio_rec, m.audio_file_path)
        m.submit_detections(detections)
        print(f"{m.audio_id} completed with {len(detections)} detections")

        # Cleanup and message ack is handled by the BuggMessageAnalyser class


if __name__ == "__main__":
    init_subscription(subscription_id, analysis_id, on_message)
