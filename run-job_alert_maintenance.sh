mkdir -p logs

/home/it/.nvm/versions/node/v22.18.0/bin/node node scripts/run-job-alert_maintenance.js alert_maintenance >> logs/alert_maintenance.log 2>&1
