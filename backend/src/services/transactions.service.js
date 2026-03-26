const { sendJson, parseJsonBody } = require("../utils")
const {
  createBorrowTransaction,
  createHold,
} = require("../models/transactions.model")
const { deleteCartItem } = require("../models/cart.model")
const { getItemTypeCode } = require("./cart.service")

function getBorrowerTypeCode(userType) {
  const normalized = String(userType || "")
    .trim()
    .toLowerCase()
  if (normalized === "faculty") return 2
  if (normalized === "staff" || normalized === "librarian") return 3
  if (normalized === "admin") return 4
  return 1
}

async function handleBorrow(req, res) {
  try {
    const body = await parseJsonBody(req)
    const { itemId, itemType } = body

    if (!itemId || !itemType) {
      sendJson(res, 400, {
        ok: false,
        message: "itemId and itemType are required",
      })
      return
    }

    const typeCode = getItemTypeCode(itemType)
    await createBorrowTransaction(typeCode, itemId, 1, 1)

    sendJson(res, 200, { ok: true, message: "Item borrowed successfully" })
  } catch (error) {
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
      sendJson(res, 400, {
        ok: false,
        message: "itemId and itemType are required",
      })
      return
    }

    await createHold(itemId, 1, 1, 1)
    sendJson(res, 200, { ok: true, message: "Hold placed successfully" })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to place hold",
      error: error.message,
    })
  }
}

async function handleCheckout(req, res) {
  try {
    const body = await parseJsonBody(req)
    const { items, userId, userType } = body

    if (!userId || !userType) {
      sendJson(res, 400, {
        ok: false,
        message: "User context is required for checkout",
      })
      return
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      sendJson(res, 400, { ok: false, message: "No items to checkout" })
      return
    }

    if (items.length > 5) {
      sendJson(res, 400, {
        ok: false,
        message: "Exceeded maximum checkout limit of 5 items",
      })
      return
    }

    const borrowerTypeCode = getBorrowerTypeCode(userType)

    for (const item of items) {
      const typeCode = getItemTypeCode(item.itemType)
      await createBorrowTransaction(
        typeCode,
        item.itemId,
        borrowerTypeCode,
        userId
      )
      await deleteCartItem(userId, typeCode, item.itemId)
    }

    sendJson(res, 200, { ok: true, message: "Successfully checked out items" })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to checkout",
      error: error.message,
    })
  }
}

module.exports = {
  handleCheckout,
  handleBorrow,
  handleHold,
}
