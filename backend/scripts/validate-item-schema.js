require("dotenv").config()
const { query, pool } = require("../db")
const { loadItemSchemasFromDatabase } = require("../item-schema")

async function run() {
  try {
    await loadItemSchemasFromDatabase(query, process.env.DB_NAME)
    process.stdout.write("Schema sync check passed.\n")
  } finally {
    await pool.end()
  }
}

run().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exit(1)
})
