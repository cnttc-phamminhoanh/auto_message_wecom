module.exports = `
  select
    count(*) sl_tong, sum(diff_days_late) sl_tre, sum(diff_days_today) as sl_hn, dept_name_mt,
    case
      when dept_name_mt in ('Sock & Embroidering') then '7:28' 
      when dept_name_mt in ('Mechanic') then '7:29' 
      when dept_name_mt in ('Electrical maintainance') then '7:30' 
      when dept_name_mt in ('IT') then '8:00'
    end tg, 
    case
      when dept_name_mt in ('Sock & Embroidering') then '865953693,931122418,352569641'
      when dept_name_mt in ('Mechanic') then '776227674,355321678'
      when dept_name_mt in ('Electrical maintainance') then 'nguyndng,833675565'
      when dept_name_mt in ('IT') then 'germton,379180014'
    end as id_acc
  from (
    SELECT
      e.dept_no as dept_no_mt, dif_day,
      case when dif_day = 0 then 1 else 0 end as diff_days_today,
      case when dif_day <> 0 then 1 else 0 end as diff_days_late,
      case when d.dept_name in ('Sock', 'Embroidering') then 'Sock & Embroidering' else d.dept_name end as dept_name_mt
    FROM [RDS].erp_t8_GI.dbo.v_eqm_bas_mt_def02_GC x
    inner join [RDS].erp_t8_GI.dbo.bas_emp e on e.emp_no = x.emp_no
    inner join [RDS].erp_t8_GI.dbo.bas_dept d on d.dept_no = e.dept_no
    WHERE
      equ_no IN (
        SELECT equ_no
        FROM [RDS].erp_t8_GI.dbo.v_eqm_bas_mt_def02_GC
        GROUP BY equ_no
        HAVING SUM(CASE WHEN maintenance_value <> 0 THEN 1 ELSE 0 END) > 0
      )
    and dif_day >= 0 and x.act_sw = 1
  ) x
  group by dept_name_mt
`;
