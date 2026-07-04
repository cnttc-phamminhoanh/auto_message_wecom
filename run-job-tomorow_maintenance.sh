mkdir -p logs

JOB_NAME=$1

/home/it/.nvm/versions/node/v22.18.0/bin/node node scripts/run-job-tomorow_maintenance.js tomorow_maintenance >> logs/tomorow_maintenance.log 2>&1
