FROM node:14-slim

RUN apt-get update && apt-get install -y ffmpeg --no-install-recommends \
  && rm -rf /var/lib/apt/lists/* 

ENV APP_HOME /app
WORKDIR $APP_HOME

COPY app/package.json /app/package.json
COPY app/yarn.lock /app/yarn.lock

RUN yarn

COPY app/index.js /app/index.js

# TODO remove these once ready to deploy
# COPY bugg-301712-d0c6fce74b02.json /.gcloud/bugg-301712-d0c6fce74b02.json
# ENV GOOGLE_APPLICATION_CREDENTIALS=/.gcloud/bugg-301712-d0c6fce74b02.json

CMD ["yarn", "start"]