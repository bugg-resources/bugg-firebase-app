# Analyses

Analyses run on Google Cloud Compute Engine.

## High level overview of analyses process

* Each analysis is built into a docker container
* An _instance template_ is created from each docker container
* An _auto-scaling instance group_ is created for each instance template
* When audio is uploaded, each analysis job is pushed onto a _pub/sub_ queue for the particular analysis, which is then picked up within the docker instances for that analysis
* The instance group scales the analysis with the backlog of the queue.
* Spot instances are used for lower cost, which may be shut down at any time and retried later

## bugg-analysis-lib

[Bugg analysis lib](https://github.com/bugg-resources/bugg-analysis-lib) is a python library that begins the work of splitting out the common boilerplate code needed to create a new analyser.

Currently it is only in full use by the analysis `birdnetlib`
