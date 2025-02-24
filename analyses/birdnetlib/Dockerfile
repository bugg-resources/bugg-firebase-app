
# syntax=docker/dockerfile:1

# First stage
FROM python:3.10 AS builder
WORKDIR /app

RUN pip install poetry==1.7.1

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

# Copy across poetry files first
COPY app/poetry.lock app/pyproject.toml ./
RUN touch README.md

# Install dependencies only
# Some dependencies require access to private GitHub repos
# Add GitHub's public key to known hosts, add deploy key
RUN --mount=type=secret,id=github_deploy_key \
    ssh-agent sh -c ' \
    mkdir -p -m 0700 ~/.ssh && \
    ssh-keyscan github.com >> ~/.ssh/known_hosts && \
    ssh-add -vvv /run/secrets/github_deploy_key && \
    poetry install --only main --no-root && \
    rm -rf $POETRY_CACHE_DIR'

FROM python:3.10-slim as runtime

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

COPY app/bugg_analyses_birdnetlib/ ./bugg_analyses_birdnetlib

CMD ["python", "bugg_analyses_birdnetlib/main.py"]
