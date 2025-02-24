FROM debian:buster-slim

# install the conda environment
RUN apt-get -qq update && apt-get -qq -y install curl bzip2 \
    && curl -sSL https://repo.continuum.io/miniconda/Miniconda3-latest-Linux-x86_64.sh -o /tmp/miniconda.sh \
    && bash /tmp/miniconda.sh -bfp /usr/local \
    && rm -rf /tmp/miniconda.sh \
    && conda install -y python=3.6 \
    && conda update conda \
    && apt-get -qq -y remove curl bzip2 \
    && apt-get -qq -y autoremove \
    && apt-get autoclean \
    && rm -rf /var/lib/apt/lists/* /var/log/dpkg.log \
    && conda clean --all --yes

ENV PATH /opt/conda/bin:$PATH

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY app/requirements.txt /app/requirements.txt

RUN python --version

# Install production dependencies.
# RUN python -m pip install --upgrade pip setuptools
RUN conda install -y -c numba numba
RUN pip install -r requirements.txt
RUN conda install -y -c conda-forge librosa


COPY app /app
RUN python /app/bootstrap.py
RUN python /app/vggish_smoke_test.py

# TODO remove these once ready to deploy
# COPY bugg-301712-d0c6fce74b02.json /.gcloud/bugg-301712-d0c6fce74b02.json
# ENV GOOGLE_APPLICATION_CREDENTIALS=/.gcloud/bugg-301712-d0c6fce74b02.json

CMD ["python3", "-u", "/app/main.py"]