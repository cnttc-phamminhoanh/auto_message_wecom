module.exports = `
SELECT
  m.sheet_no,
  m.sheet_id,
  m.sheet_qty,
  m.goods_no,
  m.def02,
  m.def01
FROM [rds].[erp_t8_gi].[dbo].sfc_mo2 AS m
INNER JOIN [rds].[erp_t8_gi].[dbo].sfc_mo1 AS m1
  ON m.sheet_no = m1.sheet_no
INNER JOIN ig_pywrkord AS o
  ON m1.sheet_no = o.ext_field07
WHERE m1.sheet_date >= '2025-01-01'
  AND m1.sheet_kind = 0
  AND m.def16 IS NULL
  AND m1.sheet_type NOT IN ('MOGIC', 'MOGICW')
  AND m.sheet_no NOT IN (
    'MOGID260515034',
    'MOGID260410002',
    'MOGID260512006'
  );
`