const { getPool } = require("../services/sql.service");

async function getHolidays() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT holiday_date
    FROM hr_holiday
  `);

  return new Set(
    result.recordset.map((r) => {
      const d = r.holiday_date;
      if (d instanceof Date) {
        return d.toISOString().slice(0, 10);
      }
      return String(d).slice(0, 10);
    }),
  );
}

async function getDevicesForOverdueCheck() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      e.equ_no,
      e.equ_name,
      e.use_date,
      e.max_mt_date,
      e.maintenance_type,
      e.maintenance_status,
      e.mnt_dept_no,
      d.mnt_dept_name,
      e.equ_dept_no,
      e.location,
      e.maintainer_emp_no,
      e.approver
    FROM eqm_mnt e
    LEFT JOIN dept_mnt d ON d.mnt_dept_no = e.mnt_dept_no
    WHERE e.maintenance_status NOT IN ('in_maintenance', 'rejected')
  `);

  return result.recordset;
}

module.exports = {
  getHolidays,
  getDevicesForOverdueCheck,
};
