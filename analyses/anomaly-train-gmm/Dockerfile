FROM debian:buster-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

RUN set -eux; \
	apt-get update; \
	apt-get install -y --no-install-recommends \
		python3-dev \
        python3-pip \
	; \
	rm -rf /var/lib/apt/lists/*

RUN pip3 install -U pip setuptools 

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY app/requirements.txt /app/requirements.txt

# Install production dependencies.
RUN pip3 install -r requirements.txt

COPY app /app

# TODO remove these once ready to deploy
# COPY bugg-301712-d0c6fce74b02.json /.gcloud/bugg-301712-d0c6fce74b02.json
# ENV GOOGLE_APPLICATION_CREDENTIALS=/.gcloud/bugg-301712-d0c6fce74b02.json

CMD ["python3", "-u", "/app/main.py"]