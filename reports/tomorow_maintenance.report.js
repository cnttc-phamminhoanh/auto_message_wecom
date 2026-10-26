module.exports = `
  SELECT
    e.equ_no,
    e.use_date,
    e.max_mt_date,
    e.maintenance_type,
    e.maintenance_status,
    d.mnt_dept_name AS dept_name_mt
  FROM eqm_mnt e
  LEFT JOIN dept_mnt d ON d.mnt_dept_no = e.mnt_dept_no
`;
