# Docker image for bugg-analyses-birdnetlib

These instructions are for creating and running the Docker image.

Note: to develop and run the application locally, you can use Poetry without Docker.

# Image notes

This Docker image doesn't install ffmpeg, which can be used by birdnetlib for certain operations.

# To build Docker image locally

You must provide a Github deploy key to load bugg-analysis-lib.

```
DOCKER_BUILDKIT=1 docker build --progress=plain --secret id=github_deploy_key,src=PATH_TO_GITHUB_DEPLOY_KEY -t eu.gcr.io/bugg-301712/analyses-birdnetlib .
```

# To run Docker image locally

You must provide GCP service account credentials (these are added automatically when runinng in Compute Engine)

```
docker run -v PATH_TO_SERVICE_CREDENTIALS.json:/tmp/service.json -e GOOGLE_APPLICATION_CREDENTIALS=/tmp/service.json YOUR_IMAGE
```


