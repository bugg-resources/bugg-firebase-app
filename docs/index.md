# Bugg backend and frontend app

The Bugg Firebase App exists to collect data from, and manage the configuration of, Bugg devices.

## Overview

The backend consists of several parts within the Google Cloud Platform (GCP) ecosystem:

* [Cloud Run Functions](runfunctions.md), which provide the backend logic
* [Audio Analysis](analysis.md) on Google Cloud Computer Engine.
* [Cloud Storage](storage.md), which stores audio data
* [Firestore database](firestore.md)

The [frontend](frontend.md) is built in React, and lives in the `bugg_xyz` directory.

For more information on each part, click the links above.
