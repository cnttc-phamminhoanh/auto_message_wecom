module.exports = {
  // ===== Query chạy trên SQL RDS (database erp_t8_GI) =====
  // Danh sách MO chưa cập nhật WO (chưa join với gi_bi)
  rds: `
    SELECT
      m.sheet_no,
      m.sheet_id,
      m.sheet_qty,
      m.goods_no,
      m.def02,
      m.def01
    FROM erp_t8_GI.dbo.sfc_mo2 AS m
    INNER JOIN erp_t8_GI.dbo.sfc_mo1 AS m1 ON m.sheet_no = m1.sheet_no
    WHERE m1.sheet_date >= '2025-01-01'
      AND m1.sheet_kind = 0
      AND m.def16 IS NULL
      AND m1.sheet_type NOT IN ('MOGIC', 'MOGICW')
      AND m.sheet_no NOT IN (
        'MOGID260515034',
        'MOGID260410002',
        'MOGID260512006'
      );
  `,
  // ===== Query chạy trên server gi_bi =====
  // Các số phiếu đã tồn tại trong bảng ig_pywrkord (cột ext_field07)
  giBi: `
    SELECT DISTINCT ext_field07
    FROM ig_pywrkord;
  `,
};
