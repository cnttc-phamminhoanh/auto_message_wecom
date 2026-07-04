require("dotenv").config({ quiet: process.env.NODE_ENV === "production" });
const path = require("path");
const tomorowQuery = require("../reports/tomorow_maintenance.report");
const { executeQuery } = require("../services/report.service");
const { notifyMaintenanceTomorow } = require("../services/wecom.service");
const { closePool } = require("../services/sql.service");

(async () => {
  const jobName = process.argv[2];

  if (!jobName) {
    throw new Error("Job name is required");
  }

  try {
    console.log(`[${new Date().toISOString()}] [JOB] ${jobName}: === START ===`);

    const tomorowData = await executeQuery(tomorowQuery)

    if (!Array.isArray(tomorowData) || tomorowData.length === 0) {
      console.log(`[${new Date().toISOString()}] [JOB] ${jobName}: No data. Skip notification.`);
      return;
    }

    console.log(tomorowData)

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const maintenanceDate = tomorrow.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    for (const row of tomorowData) {
      await notifyMaintenanceTomorow({
        users: process.env.WECOM_USERS.split(","),
        title: "📢 Danh sách bảo trì ngày mai",
        description: "Maintenance List For Tomorrow / 明天进行维护",
        image: process.env.TOMOROW_IMAGE,
        departments: [row.dept_name_mt],
        totalDevices: row.qty,
        maintenanceDate,
        reportUrl: process.env.REPORT_URL
      });
    }

    console.log(`[${new Date().toISOString()}] [JOB] ${jobName} === COMPLETED ===`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] [JOB] ${jobName} === FAILED ===`, err);
    process.exit(1);
  } finally {
    await closePool();
  }
})();
