mkdir -p /home/it/auto_message_wecom/logs
mkdir -p /home/it/auto_message_wecom/excel_reports

/home/it/.nvm/versions/node/v22.18.0/bin/node --no-warnings auto_message_wecom/scripts/run-job-alert_change_so.js alert_change_so >> auto_message_wecom/logs/alert_change_so.log 2>&1
