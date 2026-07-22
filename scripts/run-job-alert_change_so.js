const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  quiet: true
});
const alertQuery = require("../reports/alert_change_so.report");
const { executeQuery } = require("../services/report.service");
const { notifySOChange  } = require("../services/wecom.service");
const { closePool } = require("../services/sql.service");
const { getPool } = require("../services/sql.service");

(async () => {
  const jobName = process.argv[2];

  if (!jobName) {
    throw new Error("Job name is required");
  }

  try {
    // console.log(`[${new Date().toISOString()}] [JOB] ${jobName}: === START ===`);

    const alertData = await executeQuery(alertQuery)

    if (!Array.isArray(alertData) || alertData.length === 0) {
      // console.log(`[${new Date().toISOString()}] [JOB] ${jobName}: No data. Skip notification.`);
      return;
    }

    // console.log(alertData)

    const pool = await getPool()

    for (const row of alertData) {
      try {
        await notifySOChange({
          id: row.id,
          soNo: row.so_no,
          soId: row.so_id,
          custPo: row.cust_po,
          customer: row.cust_name,
          modifiedUser: row.modified_user,
          modifiedAt: row.modified_at,
          changeDetail: row.change_detail
        });

        await pool.request()
          .input("id", row.id)
          .query(`
              UPDATE [RDS].erp_t8_GI.dbo.shipping_ctrl_so
              SET
                  send_status = 1,
                  send_time = GETDATE()
              WHERE id=@id
          `);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] - ID: ${row.id} - Error: `, error);
      }
    }
    
    // console.log(`[${new Date().toISOString()}] [JOB] ${jobName} === COMPLETED ===`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] [JOB] ${jobName} === FAILED ===`, err);
    process.exit(1);
  } finally {
    await closePool();
  }
})();
