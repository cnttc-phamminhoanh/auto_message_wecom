const sql = require("mssql");
const config = require("../config/database");

let pool;
let poolGiBi;

// Pool cho SQL RDS (erp_t8_GI)
async function getPool() {
  if (pool) {
    return pool;
  }

  try {
    pool = await sql.connect(config.rds);
    return pool;
  } catch (err) {
    pool = null;
    throw err;
  }
}

// Pool cho server gi_bi
async function getPoolGiBi() {
  if (poolGiBi) {
    return poolGiBi;
  }

  try {
    poolGiBi = await sql.connect(config.giBi);
    return poolGiBi;
  } catch (err) {
    poolGiBi = null;
    throw err;
  }
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }

  if (poolGiBi) {
    await poolGiBi.close();
    poolGiBi = null;
  }
}

module.exports = {
  getPool,
  getPoolGiBi,
  closePool
};
