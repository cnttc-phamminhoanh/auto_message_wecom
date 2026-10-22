const { getPool, getPoolGiBi } = require('./sql.service')

// Chạy query trên SQL RDS (erp_t8_GI)
async function executeQuery(query) {
  const pool = await getPool()

  const result = await pool
    .request()
    .query(query)

  return result.recordset
}

// Chạy query trên server gi_bi
async function executeQueryGiBi(query) {
  const pool = await getPoolGiBi()

  const result = await pool
    .request()
    .query(query)

  return result.recordset
}

module.exports = {
  executeQuery,
  executeQueryGiBi,
}
