module.exports = `
  SELECT 
    order_no as [SO No],
    order_id as [SO ID],
    direct_cust_name as [Direct Cust Name],
    cust_po_no as [Cust PO],
    line as LINE,
    modified_user as [Modified User],
    modified_at as [Modified At],
    old_ord_qty as [Old Order Qty],
    new_ord_qty as [New Order Qty],
    old_pri as [Old Price],
    new_pri as [New Price],
    old_cus_crd as [Old Customer CRD],
    new_cus_crd as [New Customer CRD],
    old_country as [Old Country],
    new_country as [New Country],
    old_pac_method as [Old Packing Method],
    new_pac_method as [New Packing Method]
  FROM [RDS].erp_t8_GI.dbo.shipping_ctrl_so
  WHERE send_status = 0
  ORDER BY modified_at ASC, id ASC;
`
