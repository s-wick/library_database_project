const { sendJson } = require("../utils")
const { checkDatabaseConnection } = require("../models/health.model")

async function handleHealth(_req, res) {
  try {
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      sendJson(res, 500, { ok: false, message: "Database not ready." })
      return
    }

    sendJson(res, 200, {
      ok: true,
      message: "Backend and MySQL are connected.",
      database: process.env.DB_NAME,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Database connection failed.",
      error: error.message,
    })
  }
}

module.exports = {
  handleHealth,
}
