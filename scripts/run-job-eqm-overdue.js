const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  quiet: true,
});

const { closePool } = require("../services/sql.service.js");
const { sendOverdueSummary } = require("../services/wecom.eqm.service");

(async () => {
  const jobName = "eqm_overdue";

  try {
    console.log(
      `[${new Date().toISOString()}] [JOB] ${jobName}: === START ===`,
    );

    const webhook =
      process.env.EQM_OVERDUE_WEBHOOK ||
      process.env.ALERT_BI_51_WECOM_WEBHOOK_TEST;

    if (!webhook) {
      throw new Error("Thiếu EQM_OVERDUE_WEBHOOK trong .env");
    }

    const result = await sendOverdueSummary(webhook);

    if (result.sent) {
      console.log(
        `[${new Date().toISOString()}] [JOB] ${jobName}: Đã gửi ${result.total} thiết bị trễ`,
      );
    } else {
      console.log(
        `[${new Date().toISOString()}] [JOB] ${jobName}: Không có dữ liệu trễ → bỏ qua`,
      );
    }

    console.log(
      `[${new Date().toISOString()}] [JOB] ${jobName}: === COMPLETED ===`,
    );
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] [JOB] ${jobName}: === FAILED ===`,
      err,
    );
    process.exit(1);
  } finally {
    await closePool();
  }
})();
