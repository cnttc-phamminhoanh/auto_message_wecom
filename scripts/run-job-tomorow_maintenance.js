const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  quiet: process.env.NODE_ENV === "production",
});
const tomorowQuery = require("../reports/tomorow_maintenance.report");
const { executeQuery } = require("../services/report.service");
const { notifyMaintenanceTomorow } = require("../services/wecom.service");
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
      executeQuery(tomorowQuery),
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
      if (diff !== 1) continue;

      // chờ duyệt + trễ → không hiện (mai không phải trễ, nhưng giữ rule thống nhất)
      if (row.maintenance_status === PENDING_APPROVAL && diff < 0) continue;

      const dept = row.dept_name_mt;
      if (!dept) continue;
      byDept.set(dept, (byDept.get(dept) || 0) + 1);
    }

    if (byDept.size === 0) {
      console.log(
        `[${new Date().toISOString()}] [JOB] ${jobName}: No data. Skip notification.`,
      );
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const maintenanceDate = tomorrow.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    for (const [dept, qty] of byDept) {
      const idAcc = DEPT_ID_ACC[dept];
      if (!idAcc) continue;

      await notifyMaintenanceTomorow({
        users: idAcc.split(","),
        title: "📢 Danh sách bảo trì ngày mai",
        description: "Maintenance List For Tomorrow / 明天进行维护",
        image: process.env.TOMOROW_IMAGE,
        departments: [dept],
        totalDevices: qty,
        maintenanceDate,
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
