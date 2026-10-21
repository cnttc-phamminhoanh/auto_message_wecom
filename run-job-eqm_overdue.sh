#!/bin/bash

LOG_DIR="/home/it/auto_message_wecom/logs"
LOG_FILE="$LOG_DIR/eqm_overdue.log"
NODE_BIN="/home/it/.nvm/versions/node/v22.18.0/bin/node"
JOB_FILE="/home/it/auto_message_wecom/scripts/run-job-eqm_overdue.js"

mkdir -p "$LOG_DIR"

HOLIDAYS=(
  "01092026"
  "02092026"
  "03092026"
)

TODAY=$(date +%d%m%Y)
for day in "${HOLIDAYS[@]}"; do
  if [[ "$TODAY" == "$day" ]]; then
    echo "$(date): Skip run-job-eqm_overdue on $TODAY" >> "$LOG_FILE"
    exit 0
  fi
done

cd /home/it/auto_message_wecom || exit 1

"$NODE_BIN" "$JOB_FILE" >> "$LOG_FILE" 2>&1