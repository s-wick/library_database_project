const fs = require("node:fs/promises")
const path = require("node:path")
const mysql = require("mysql2/promise")
require("dotenv").config()

const ITEM_TYPES_TO_TABLES = {
  BOOK: "book",
  VIDEO: "video",
  AUDIO: "audio",
  RENTAL_EQUIPMENT: "rental_equipment",
}

function snakeToCamel(value = "") {
  return String(value).replace(/_([a-z])/g, (_, char) => char.toUpperCase())
}

function buildBodyKey(columnName) {
  return snakeToCamel(columnName)
}

async function main() {
  const dbName = process.env.DB_NAME
  if (!dbName) {
    throw new Error("DB_NAME is required to generate item schema.")
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
  })

  try {
    const itemTypeRows = await connection.execute(
      "SELECT item_type AS itemType FROM item_type ORDER BY item_code ASC"
    )
    const types = itemTypeRows[0]
      .map((row) => String(row.itemType || "").trim().toUpperCase())
      .filter(Boolean)
      .filter((itemType) => ITEM_TYPES_TO_TABLES[itemType])

    const tableNames = types.map((itemType) => ITEM_TYPES_TO_TABLES[itemType])
    if (!tableNames.length) {
      throw new Error("No supported item types found in item_type table.")
    }

    const placeholders = tableNames.map(() => "?").join(", ")
    const [columns] = await connection.execute(
      `SELECT
         table_name AS tableName,
         column_name AS columnName,
         is_nullable AS isNullable,
         column_key AS columnKey,
         extra AS extraInfo
       FROM information_schema.columns
       WHERE table_schema = ?
         AND table_name IN (${placeholders})
       ORDER BY table_name, ordinal_position`,
      [dbName, ...tableNames]
    )

    const tableColumns = {}
    for (const column of columns) {
      if (!tableColumns[column.tableName]) tableColumns[column.tableName] = []
      tableColumns[column.tableName].push(column)
    }

    const config = {}
    for (const itemType of types) {
      const table = ITEM_TYPES_TO_TABLES[itemType]
      const metadata = tableColumns[table] || []
      if (!metadata.length) {
        throw new Error(`Missing table '${table}' while generating schema.`)
      }

      const primaryColumn = metadata.find((column) => column.columnKey === "PRI")
      if (!primaryColumn) {
        throw new Error(`Missing primary key for table '${table}'.`)
      }

      const idColumn = primaryColumn.columnName
      const bodyToColumn = {}
      const requiredBodyFields = []

      for (const column of metadata) {
        const columnName = column.columnName
        const isAuto = String(column.extraInfo || "").includes("auto_increment")
        const skipColumns = new Set([idColumn, "item_type_code"])
        if (skipColumns.has(columnName) || isAuto) continue

        const bodyKey = buildBodyKey(columnName)
        bodyToColumn[bodyKey] = columnName

        const isRequired = column.isNullable === "NO"
        if (isRequired) requiredBodyFields.push(bodyKey)
      }

      config[itemType] = {
        table,
        idColumn,
        requiredBodyFields,
        bodyToColumn,
      }
    }

    const outputPath = path.resolve(__dirname, "../item-schema.generated.js")
    const fileContents = `const ITEM_ENTITY_CONFIG = ${JSON.stringify(
      config,
      null,
      2
    )}\n\nmodule.exports = {\n  ITEM_ENTITY_CONFIG,\n}\n`

    await fs.writeFile(outputPath, fileContents, "utf8")
    process.stdout.write(`Generated ${outputPath}\n`)
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exit(1)
})
