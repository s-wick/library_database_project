function createGetItemTypesHandler({ query, getItemSchemas, sendJson }) {
  return async function handleGetItemTypes(_req, res) {
    try {
      const rows = await query(
        "SELECT item_code AS itemCode, item_type AS itemType FROM item_type ORDER BY item_code ASC"
      )
      sendJson(res, 200, {
        ok: true,
        itemTypes: rows.filter((row) => getItemSchemas()[row.itemType]),
      })
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        message: "Failed to fetch item types.",
        error: error.message,
      })
    }
  }
}

module.exports = {
  createGetItemTypesHandler,
}
