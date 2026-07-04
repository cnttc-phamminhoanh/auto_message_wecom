const { getPool } = require('./sql.service')

async function executeQuery(query) {
  const pool = await getPool()

  const result = await pool
    .request()
    .query(query)

  return result.recordset
}

module.exports = {
  executeQuery,
}
