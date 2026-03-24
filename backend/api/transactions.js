const { query } = require("../db")
const { sendJson, parseJsonBody } = require("../utils")

async function handleBorrow(req, res) {
  try {
    const body = await parseJsonBody(req)
    const { itemId, itemType } = body

    if (!itemId || !itemType) {
      return sendJson(res, 400, {
        ok: false,
        message: "itemId and itemType are required",
      })
    }

    let typeCode = 1 // 1: BOOK, 2: VIDEO, 3: AUDIO, 4: RENTAL_EQUIPMENT
    if (itemType === "video") typeCode = 2
    else if (itemType === "audiobook" || itemType === "audio") typeCode = 3
    else if (itemType === "equipment") typeCode = 4

    // For demo purposes, assuming borrower_type = 1 (Student), borrower_id = 1
    // And setting due_date = 7 days from now

    await query(
      `
      INSERT INTO borrow (item_type_code, item_id, borrower_type, borrower_id, checkout_date, due_date)
      VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))
    `,
      [typeCode, itemId, 1, 1]
    )

    sendJson(res, 200, { ok: true, message: "Item borrowed successfully" })
  } catch (error) {
    console.error(error)
    sendJson(res, 500, {
      ok: false,
      message: "Failed to borrow item",
      error: error.message,
    })
  }
}

async function handleHold(req, res) {
  try {
    const body = await parseJsonBody(req)
    const { itemId, itemType } = body

    if (!itemId || !itemType) {
      return sendJson(res, 400, {
        ok: false,
        message: "itemId and itemType are required",
      })
    }

    // In a real system, we'd calculate the next queue position.
    // For demo, position 1
    await query(
      `
      INSERT INTO hold_item (item_id, user_type, user_id, hold_status, queue_position)
      VALUES (?, ?, ?, 'active', 1)
    `,
      [itemId, 1, 1]
    )

    sendJson(res, 200, { ok: true, message: "Hold placed successfully" })
  } catch (error) {
    console.error(error)
    sendJson(res, 500, {
      ok: false,
      message: "Failed to place hold",
      error: error.message,
    })
  }
}

module.exports = {
  handleBorrow,
  handleHold,
}
