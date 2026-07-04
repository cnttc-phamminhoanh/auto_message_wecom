const sql = require("mssql");
const config = require("../config/database");

let pool;

async function getPool() {
  if (pool) {
    return pool;
  }

  try {
    pool = await sql.connect(config);
    return pool;
  } catch (err) {
    pool = null;
    throw err;
  }
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = {
  getPool,
  closePool
};
