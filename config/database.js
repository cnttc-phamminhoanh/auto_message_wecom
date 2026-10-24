module.exports = {
  // ===== Kết nối 1: SQL RDS — database erp_t8_GI =====
  // Các bảng: shipping_ctrl_so, v_eqm_bas_mt_def02_GC, bas_emp, bas_dept, sfc_mo2, sfc_mo1
  rds: {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  },

  // ===== Kết nối 2: server BI - database gi_bi =====
  // Bảng: ig_pywrkord
  giBi: {
    server: process.env.DB2_SERVER,
    database: process.env.DB2_DATABASE,
    user: process.env.DB2_USER,
    password: process.env.DB2_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  },
};
