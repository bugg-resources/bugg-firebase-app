
import json
from concurrent import futures
from concurrent.futures import TimeoutError

import dateutil.parser
from firebase_admin import firestore
from google.api_core import retry
from google.cloud import pubsub_v1

from bugg import getDb
from train_model import train_gmm_model

project_id = "bugg-301712"
subscription_id = "analyses.anomaly-train-gmm-sub"

def on_message(message):
    message_str = message.data.decode("utf-8")
    message_dict = json.loads(message_str)

    if "project" not in message_dict:
        print("Message missing project. Not processing.")
        return 

    if "request" not in message_dict:
        print("Message missing request ID. Not processing.")
        return

    print("Recieved request")
    print(f"  request:       {message_dict['request']}")
    print(f"  project:       {message_dict['project']}")
    print(f"  recorder:      {message_dict['recorder']}")
    print(f"  from_iso_date: {message_dict['from_iso_date']}")
    print(f"  to_iso_date:   {message_dict['to_iso_date']}")


    # Update the request in firebase marking it as processing
    db = getDb()
    request_ref = db.collection(u'analyses').document(u'anomaly-detection').collection(u'models').document(message_dict["request"])

    request_snap = request_ref.get()
    if not request_snap.exists:
        print(f"Request {message_dict['request']} no longer present. Not processing.")
        return 

    request_dict = request_snap.to_dict()
    if request_dict["status"] != "queued":
        print(f"Request {message_dict['request']} status no longer queued. Not processing.")
        return

    request_ref.update({
        "status": "processing",
        "processingAt": firestore.SERVER_TIMESTAMP
    })

    try: 
        train_gmm_model(message_dict["project"], message_dict["recorder"], message_dict["from_iso_date"], message_dict["to_iso_date"])
    except Exception as e:
        request_ref.update({
            "status": "failed",
            "error": str(e)
        })

        print(f"Failed to train model: {e}")
        raise e

    # Update the request in firebase marking it as in complete  
    request_ref.update({
        "status": "complete",
        "completedAt": firestore.SERVER_TIMESTAMP
    })

    # Submit the audio that was on hold for processing
    from_date = request_dict["inferenceValidStart"]
    to_date = request_dict["inferenceValidEnd"]

    docs = db.collection(u'audio').where("project", "==", message_dict["project"]).where("recorder", "==", message_dict["recorder"])\
        .where("uploadedAt", ">=", from_date).where("uploadedAt", "<=", to_date).order_by(u"uploadedAt", direction=firestore.Query.ASCENDING).get()

    print(f"Submitting {len(docs)} audio records to be processed")
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, "analyses.anomaly-detection")
    publish_futures = []

    # Resolve the publish future in a separate thread.
    def callback(future: pubsub_v1.publisher.futures.Future) -> None:
        # message_id = future.result()
        # print(message_id)
        pass

    for doc in docs:
        audiorec = doc.to_dict()
        print(f"Submitting {doc.id} {audiorec['uploadedAt']}")

        # Convert the firestore timestamp to a datetime object
        data = doc.id.encode("utf-8")
        publish_future = publisher.publish(topic_path, data)
        # Non-blocking. Allow the publisher client to batch multiple messages.
        publish_future.add_done_callback(callback)
        publish_futures.append(publish_future)
    
    futures.wait(publish_futures, return_when=futures.ALL_COMPLETED)
    print("Finished resubmitting audio records for anomaly detection")


def start():
    project_id = "bugg-301712"
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    # Wrap the subscriber in a 'with' block to automatically call close() to
    # close the underlying gRPC channel when done.
    with subscriber:
        while True:
            # The subscriber pulls a specific number of messages. The actual
            # number of messages pulled may be smaller than max_messages.
            response = subscriber.pull(
                request={"subscription": subscription_path, "max_messages": 1},
                retry=retry.Retry(deadline=300),
            )

            for received_message in response.received_messages:
                # The processing takes longer than the max allowed time
                # and the multiprocessing method to extend the ack deadline
                # throws a GRPC error when in a docker container.
                # working around by acking here. The job will be retried by Firestore function if it fails or takes longer than 8 hrs
                subscriber.acknowledge(
                        request={"subscription": subscription_path, "ack_ids": [received_message.ack_id]}
                )
                on_message(received_message.message)    

            print(
                f"Received and acknowledged {len(response.received_messages)} messages from {subscription_path}."
            )


if __name__ == "__main__":
    start()
