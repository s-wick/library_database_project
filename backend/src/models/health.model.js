const { query } = require("../database")

async function checkDatabaseConnection() {
  const rows = await query("SELECT 1 AS ok")
  return rows[0]?.ok === 1
}

module.exports = {
  checkDatabaseConnection,
}
