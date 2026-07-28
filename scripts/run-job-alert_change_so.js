const path = require("path");
const fs = require("fs/promises");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  quiet: true
});
const alertQuery = require("../reports/alert_change_so.report");
const { createReportFile } = require("../utils/report-file.util")
const { generateExcel } = require("../services/excel.service");
const { executeQuery } = require("../services/report.service");
const { notifySOChange, uploadFile, sendFile } = require("../services/wecom.service");
const { closePool } = require("../services/sql.service");
const { getPool } = require("../services/sql.service");

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

    const reportTitle = process.env.CHANGE_SO_REPORT_TITLE
    const fileName = process.env.CHANGE_SO_FILE_NAME
    const sheetName = process.env.CHANGE_SO_SHEET_NAME

    const filePath = createReportFile(fileName);

    console.log("Generating Excel...");
    await generateExcel(alertData, filePath, {
      reportTitle,
      fileName,
      sheetName,
    });

    console.log("Sending summary...");
    await notifySOChange(alertData);

    console.log("Uploading Excel...");
    const mediaId = await uploadFile(filePath);

    console.log("Sending Excel...");
    await sendFile(mediaId);

    console.log("Cleaning database and Remove excel file...");
    const pool = await getPool();

    await pool.request().query(`
      EXEC ('
          USE erp_t8_GI;
          TRUNCATE TABLE dbo.shipping_ctrl_so;
      ') AT [RDS];
    `);

    await fs.unlink(filePath);

    console.log(`[${new Date().toISOString()}] [JOB] ${jobName} === COMPLETED ===`)
  } catch (err) {
    console.error(`[${new Date().toISOString()}] [JOB] ${jobName} === FAILED ===`, err);
    process.exit(1);
  } finally {
    await closePool();
  }
})();
