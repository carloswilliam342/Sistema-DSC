#!/bin/bash
set -e

cd "$(dirname "$0")"

if [ "$1" = "prod" ]; then
    docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml build
else
    docker compose --env-file .env.dev build
fi
