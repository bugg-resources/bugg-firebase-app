#!/bin/bash
gcloud builds submit --timeout=900s --tag eu.gcr.io/bugg-301712/clippy
