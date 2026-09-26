const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "../.env"),
    quiet: process.env.NODE_ENV === "production"
});
const alertQuery = require("../reports/alert_maintenance.report");
const { executeQuery } = require("../services/report.service");
const { notifyMaintenanceAlert } = require("../services/wecom.service");
const { closePool } = require("../services/sql.service");

(async () => {
    const jobName = process.argv[2];

    if (!jobName) {
        throw new Error("Job name is required");
    }

    try {
        console.log(`[${new Date().toISOString()}] [JOB] ${jobName}: === START ===`);

        const alertData = await executeQuery(alertQuery)

        if (!Array.isArray(alertData) || alertData.length === 0) {
            console.log(`[${new Date().toISOString()}] [JOB] ${jobName}: No data. Skip notification.`);
            return;
        }

        for (const row of alertData) {
            await notifyMaintenanceAlert({
                users: row.id_acc.split(","),
                title: "⏰ Cảnh báo bảo trì thiết bị",
                description: `Equipment Maintenance Alert / 设备保养提醒`,
                image: process.env.ALERT_IMAGE,
                departments: [`${row.dept_name_mt}`],
                totalDevices: row.sl_tong,
                lateQty: row.sl_tre,
                todayQty: row.sl_hn,
                reportUrl: process.env.REPORT_URL
            })
        }

        console.log(`[${new Date().toISOString()}] [JOB] ${jobName} === COMPLETED ===`);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] [JOB] ${jobName} === FAILED ===`, err);
        process.exit(1);
    } finally {
        await closePool();
    }
})();