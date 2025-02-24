import json
import logging
import multiprocessing
import time
from concurrent import futures

import dateutil.parser
from firebase_admin import firestore
from google.api_core import retry
from google.cloud import pubsub_v1

from bugg import getDb
from train_model import train_gmm_model

multiprocessing.log_to_stderr()
logger = multiprocessing.get_logger()
logger.setLevel(logging.INFO)
processes = dict()


# Fitting the GMM model can take longer than the maximum timeout pubsub 
# allows. We setup multiple processes here, one to fit the model and the other
# to watch the clock. As we approach the timeout, we push out the ack deadline 
#
# Details on the process here: https://cloud.google.com/pubsub/docs/pull#synchronous_pull_with_lease_management
#

project_id = "bugg-301712"
subscription_id = "analyses.anomaly-train-gmm-sub"

def on_message(message_str):
    message_dict = json.loads(message_str)

    if "project" not in message_dict:
        logger.info("Message missing project. Not processing.")
        return 

    if "request" not in message_dict:
        logger.info("Message missing request ID. Not processing.")
        return

    logger.info("Recieved request")
    logger.info(f"  request:       {message_dict['request']}")
    logger.info(f"  project:       {message_dict['project']}")
    logger.info(f"  recorder:      {message_dict['recorder']}")
    logger.info(f"  from_iso_date: {message_dict['from_iso_date']}")
    logger.info(f"  to_iso_date:   {message_dict['to_iso_date']}")


    # Update the request in firebase marking it as processing
    db = getDb()
    request_ref = db.collection(u'analyses').document(u'anomaly-detection').collection(u'models').document(message_dict["request"])

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

        logger.error(f"Failed to train model: {e}")
        raise e

    # Update the request in firebase marking it as in complete  
    request_ref.update({
        "status": "complete",
        "completedAt": firestore.SERVER_TIMESTAMP
    })

    # Submit the audio that was on hold for processing
    from_date = dateutil.parser.isoparse(message_dict["from_iso_date"])
    to_date = dateutil.parser.isoparse(message_dict["to_iso_date"])

    docs = db.collection(u'audio').where("project", "==", message_dict["project"]).where("recorder", "==", message_dict["recorder"])\
        .where("uploadedAt", ">=", from_date).where("uploadedAt", "<=", to_date).order_by(u"uploadedAt", direction=firestore.Query.ASCENDING).get()

    logger.info(f"Submitting {len(docs)} audio records to be processed")
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, "analyses.anomaly-detection")
    publish_futures = []

    # Resolve the publish future in a separate thread.
    def callback(future: pubsub_v1.publisher.futures.Future) -> None:
        # message_id = future.result()
        # logger.info(message_id)
        pass

    for doc in docs:
        audiorec = doc.to_dict()
        logger.info(f"Submitting {doc.id} {audiorec['uploadedAt']}")

        # Convert the firestore timestamp to a datetime object
        data = doc.id.encode("utf-8")
        publish_future = publisher.publish(topic_path, data)
        # Non-blocking. Allow the publisher client to batch multiple messages.
        publish_future.add_done_callback(callback)
        publish_futures.append(publish_future)
    
    futures.wait(publish_futures, return_when=futures.ALL_COMPLETED)
    logger.info("Finished resubmitting audio records for anomaly detection")


def fetch_messages():
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(project_id, subscription_id)

    response = subscriber.pull(
        request={"subscription": subscription_path, "max_messages": 1},
        retry=retry.Retry(deadline=301),
    )

    # Start a process for each message
    for message in response.received_messages:
        logger.info("Message received")

        process = multiprocessing.Process(
            target=on_message, args=(message.message.data.decode("utf-8"),)
        )
        processes[process] = (message.ack_id, message.message.data)
        process.start()

    while processes:
        # Check in every 30 seconds
        if processes:
            time.sleep(2)

        for process in list(processes):

            # logger.info all the process stats:
            logger.info(f"Process: {process.name}, {process.is_alive()}, {process.exitcode}")

            ack_id, msg_data = processes[process]
            # If the process is running, reset the ack deadline.
            if process.is_alive():
                subscriber.modify_ack_deadline(
                    request={
                        "subscription": subscription_path,
                        "ack_ids": [ack_id],
                        # Must be between 10 and 600.
                        "ack_deadline_seconds": 120,
                    }
                )
                logger.info(f"Reset ack deadline.")

            # If the process is complete, acknowledge the message.
            else:
                subscriber.acknowledge(
                    request={"subscription": subscription_path, "ack_ids": [ack_id]}
                )
                logger.info(f"Acknowledged {msg_data}.")
                processes.pop(process)

    # Close the underlying gPRC channel. Alternatively, wrap subscriber in
    # a 'with' block to automatically call close() when done.
    subscriber.close()
    logger.info(f"Subscriber Closed Received and acknowledged {len(response.received_messages)} messages from {subscription_path}.")


def start():
    logger.info("Starting")
    while True:
        fetch_messages()


if __name__ == "__main__":
    start()
