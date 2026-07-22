module.exports = `
  SELECT
    id,
    so_no,
    so_id,
    cust_name,
    cust_po,
    modified_user,
    change_detail,
    modified_at
  FROM [RDS].erp_t8_GI.dbo.shipping_ctrl_so
  WHERE send_status = 0
  ORDER BY modified_at ASC, id ASC;
`
