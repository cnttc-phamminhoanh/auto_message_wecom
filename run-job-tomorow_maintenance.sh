#!/bin/bash

mkdir -p /home/it/auto_message_wecom/logs

HOLIDAYS=(
  "01092026"
  "02092026"
  "03092026"
)

TODAY=$(date +%d%m%Y)
for day in "${HOLIDAYS[@]}"; do
  if [[ "$TODAY" == "$day" ]]; then
    echo "$(date): Skip run-job-tomorow_maintenance on $TODAY" >> /home/it/auto_message_wecom/logs/tomorow_maintenance.log
    exit 0
  fi
done

mkdir -p /home/it/auto_message_wecom/logs

/home/it/.nvm/versions/node/v22.18.0/bin/node auto_message_wecom/scripts/run-job-tomorow_maintenance.js tomorow_maintenance >> auto_message_wecom/logs/tomorow_maintenance.log 2>&1
