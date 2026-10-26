const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  quiet: process.env.NODE_ENV === "production",
});
const alertQuery = require("../reports/alert_maintenance.report");
const { executeQuery } = require("../services/report.service");
const { notifyMaintenanceAlert } = require("../services/wecom.service");
const { closePool } = require("../services/sql.service");
const {
  buildEffectiveDueMap,
  businessToday,
  daysBetween,
} = require("../utils/eqm-dates");

const PENDING_APPROVAL = "pending_approval";

const DEPT_ID_ACC = {
  "Sock & Embroidering": "865953693,931122418,352569641",
  Mechanic: "776227674,355321678",
  "Electrical maintainance": "nguyndng,833675565",
  IT: "germton,379180014",
};

(async () => {
  const jobName = process.argv[2];

  if (!jobName) {
    throw new Error("Job name is required");
  }

  try {
    console.log(
      `[${new Date().toISOString()}] [JOB] ${jobName}: === START ===`,
    );

    const [rows, holidayRows] = await Promise.all([
      executeQuery(alertQuery),
      executeQuery(`SELECT holiday_date FROM hr_holiday`),
    ]);

    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(
        `[${new Date().toISOString()}] [JOB] ${jobName}: No data. Skip notification.`,
      );
      return;
    }

    const holidaySet = new Set(
      (holidayRows || []).map((r) => {
        const d = r.holiday_date;
        if (d instanceof Date) return d.toISOString().slice(0, 10);
        return String(d).slice(0, 10);
      }),
    );

    const effectiveMap = buildEffectiveDueMap(rows, holidaySet);
    const today = businessToday();

    const byDept = new Map();
    for (const row of rows) {
      const due = effectiveMap.get(row.equ_no);
      if (!due) continue;

      const diff = daysBetween(today, due);
      if (diff > 0) continue; // chỉ hôm nay + trễ

      // đang chờ duyệt mà đã trễ → không hiển thị / không báo
      if (row.maintenance_status === PENDING_APPROVAL && diff < 0) continue;

      const dept = row.dept_name_mt;
      if (!dept) continue;

      if (!byDept.has(dept)) {
        byDept.set(dept, { total: 0, late: 0, today: 0 });
      }
      const g = byDept.get(dept);
      g.total += 1;
      if (diff < 0) g.late += 1;
      else g.today += 1;
    }

    if (byDept.size === 0) {
      console.log(
        `[${new Date().toISOString()}] [JOB] ${jobName}: No data. Skip notification.`,
      );
      return;
    }

    for (const [dept, { total, late, today: todayQty }] of byDept) {
      const idAcc = DEPT_ID_ACC[dept];
      if (!idAcc) continue;

      await notifyMaintenanceAlert({
        users: idAcc.split(","),
        title: "⏰ Cảnh báo bảo trì thiết bị",
        description: `Equipment Maintenance Alert / 设备保养提醒`,
        image: process.env.ALERT_IMAGE,
        departments: [`${dept}`],
        totalDevices: total,
        lateQty: late,
        todayQty,
        reportUrl: process.env.REPORT_URL,
      });
    }

    console.log(
      `[${new Date().toISOString()}] [JOB] ${jobName} === COMPLETED ===`,
    );
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] [JOB] ${jobName} === FAILED ===`,
      err,
    );
    process.exit(1);
  } finally {
    await closePool();
  }
})();
