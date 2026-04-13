const { sendJson, parseJsonBody } = require("../utils")
const { getFinesForPayment, payAllFines } = require("../models/dashboard.model")

async function handleGetFines(req, res, url) {
  try {
    const userId = url.searchParams.get("user_id")
    if (!userId) {
      sendJson(res, 400, { ok: false, message: "user_id is required" })
      return
    }
    const fines = await getFinesForPayment(userId)
    sendJson(res, 200, fines)
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to fetch fines",
      error: error.message,
    })
  }
}

async function handlePayFines(req, res) {
  try {
    const body = await parseJsonBody(req)
    const userId = body.user_id
    if (!userId) {
      sendJson(res, 400, { ok: false, message: "user_id is required" })
      return
    }
    const updated = await payAllFines(userId)
    sendJson(res, 200, {
      ok: true,
      message:
        updated > 0
          ? `${updated} checked-in fine(s) paid.`
          : "No checked-in fines available to pay.",
      count: updated,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to process payment",
      error: error.message,
    })
  }
}

module.exports = { handleGetFines, handlePayFines }
