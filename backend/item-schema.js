const { ITEM_ENTITY_CONFIG } = require("./item-schema.generated")

async function loadItemSchemasFromDatabase(queryFn, dbName) {
  const tableNames = Object.values(ITEM_ENTITY_CONFIG).map(
    (config) => config.table
  )
  const placeholders = tableNames.map(() => "?").join(", ")
  const rows = await queryFn(
    `SELECT table_name AS tableName, column_name AS columnName
     FROM information_schema.columns
     WHERE table_schema = ?
       AND table_name IN (${placeholders})
     ORDER BY table_name, ordinal_position`,
    [dbName, ...tableNames]
  )

  const tableColumns = {}
  for (const row of rows) {
    if (!tableColumns[row.tableName]) tableColumns[row.tableName] = []
    tableColumns[row.tableName].push(row.columnName)
  }

  const schemas = {}
  for (const [itemType, config] of Object.entries(ITEM_ENTITY_CONFIG)) {
    const columns = tableColumns[config.table]
    if (!columns || columns.length === 0) {
      throw new Error(
        `Schema sync failed: table '${config.table}' missing for '${itemType}'.`
      )
    }

    const expected = new Set([
      config.idColumn,
      "item_type_code",
      ...Object.values(config.bodyToColumn),
    ])
    for (const column of expected) {
      if (!columns.includes(column)) {
        throw new Error(
          `Schema sync failed: missing column '${column}' in table '${config.table}'.`
        )
      }
    }

    schemas[itemType] = {
      ...config,
      attributes: columns,
    }
  }

  return schemas
}

module.exports = {
  ITEM_ENTITY_CONFIG,
  loadItemSchemasFromDatabase,
}
