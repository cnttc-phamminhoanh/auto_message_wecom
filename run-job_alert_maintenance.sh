mkdir -p logs

/home/it/.nvm/versions/node/v22.18.0/bin/node auto_message_wecom/scripts/run-job-alert_maintenance.js alert_maintenance >> auto_message_wecom/logs/alert_maintenance.log 2>&1
