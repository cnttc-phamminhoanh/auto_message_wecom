mkdir -p logs

/home/it/.nvm/versions/node/v22.18.0/bin/node auto_message_wecom/scripts/run-job-tomorow_maintenance.js tomorow_maintenance >> auto_message_wecom/logs/tomorow_maintenance.log 2>&1
