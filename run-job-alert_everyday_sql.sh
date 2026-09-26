#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="/home/it/auto_message_wecom"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/alert_everyday_sql.log"
NODE_BIN="/home/it/.nvm/versions/node/v22.18.0/bin/node"
JOB_FILE="${PROJECT_DIR}/scripts/run-job-alert_everyDay_change_sql.js"

mkdir -p "${LOG_DIR}"
cd "${PROJECT_DIR}" || exit 1

CRON_ENABLED=false "${NODE_BIN}" "${JOB_FILE}" >> "${LOG_FILE}" 2>&1
