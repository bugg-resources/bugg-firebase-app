# Firestore

Firestore is used as the database for all general data.

## Firestore top-level collections

### analyses

This contains basic aesthetic information about the analyses: display name `displayName` and colours of label `colourPrimary` and `colourSecondary`.

They are determined using the `id` (eg `birdnet-lite`).

It is not known which other fields are still in use:

* `hidden`
* `AnoymalyIcon`
* `topic`
* `trigger`

### audio

In this collection is a document for each piece of audio uploaded and processed by the system.

* `downloadToken`
* `hasDetections`: did any of the analyses find detections (true/false)
* `id`
* `location`: longitude and latitude of recording
* `metadata`
* `project`
* `recorder`
* `site`
* `uploadedAt`: timestamp of upload
* `uri`: address of audio file within Google Cloud Storage

### config

* `configId`
* `createdAt`
* `deployed`
* `mobile_network`
* `projectId`
* `recorders`
* `sensor`

### exports

* `beganProcessing`
* `completedAt`
* `createdAt`
* `from`
* `id`
* `projectId`
* `recordedProcessed`
* `status`
* `type`
* `uri`

### filtered

This no longer seems to be in use.

### profiles

This holds user accounts.

* `createdAt`: timestamp
* `displayName`: Displayed name
* `id`: authentication ID
* `isAdmin`: whether they have access to the admin tabs and functionality
* `projects`: which projects are enabled in their account

### projects

Each project is a document here, with the following fields.

* `id`: eg `proj_demo`
* `name`: display name eg "Demo project"
* `analyses`: list of analyses to run on uploads to the project

### tasks

This seems to be used internally to track analyses to be run on audio files. It may have been replaced with an alternative mechanism (Pub/Sub) but records may still be created for debugging purposes.
