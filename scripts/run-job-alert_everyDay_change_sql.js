
const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "../.env"),
    quiet: process.env.NODE_ENV === "production"
});
const { runNotificationJob } = require('../services/runNotificationJob.services');
const wecomService = require('../services/wecom.service');
const { closePool } = require('../services/sql.service');

const runOnce = async () => {
    const result = await runNotificationJob();

    if (!result.data || result.data.length === 0) {
        console.log('[linux-cron] Không có dữ liệu, không gửi WeCom');
        return;
    }

    const wecomResult = await wecomService.sendSheetNotification();
    console.log(
        '[linux-cron] WeCom:',
        wecomResult.skipped ? 'bỏ qua' : 'đã gửi thông báo thành công'
    );
};

const main = async () => {
    try {
        await runOnce();
    } finally {
        await closePool();
    }
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('[linux-cron] Job thất bại:', error.message);
        process.exit(1);
    });
