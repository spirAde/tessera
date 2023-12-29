#!/bin/bash

./scripts/wait.sh "$PG_HOST":"$PG_PORT" -t 0
./scripts/migration.sh

npm run start
