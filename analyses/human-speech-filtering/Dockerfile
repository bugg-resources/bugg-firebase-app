FROM python:3.8
# FROM debian:buster-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    ffmpeg \    
    build-essential \
    llvm-9-dev \
    bash \
    ; \
    rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/llvm-config-9 /usr/bin/llvm-config

# RUN pip3 install -U pip setuptools 
RUN python3 -m pip install --upgrade pip

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME

# Install dependencies.
COPY app/requirements.txt /app/requirements.txt
RUN pip3 install -r requirements.txt

# Downloads the model into the container so we don't have to do it at runtime
COPY app/preload.py /app/preload.py
RUN python3 -u /app/preload.py

COPY app /app

# TODO remove these once ready to deploy
# COPY bugg-301712-d0c6fce74b02.json /.gcloud/bugg-301712-d0c6fce74b02.json
# ENV GOOGLE_APPLICATION_CREDENTIALS=/.gcloud/bugg-301712-d0c6fce74b02.json

CMD ["python3", "-u", "/app/main.py"]