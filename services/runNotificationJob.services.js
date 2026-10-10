
const findPendingNotifications = require('../reports/find_pending_notifications_report');
const { executeQuery } = require('./report.service');
const runNotificationJob = async () => {
    const rows = await executeQuery(findPendingNotifications);
    return {
        executedAt: new Date().toISOString(),
        count: rows.length,
        data: rows,
    };
};

module.exports = {
    runNotificationJob
};