#!/bin/bash
gcloud builds submit --tag gcr.io/bugg-301712/hello-world
gcloud run deploy --image gcr.io/bugg-301712/hello-world --platform managed
