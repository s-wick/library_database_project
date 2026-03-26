const { sendJson, parseJsonBody } = require("../utils")
const {
  createBorrowTransaction,
  createHold,
  getUserAccountById,
  OutOfStockError,
} = require("../models/transactions.model")
const { deleteCartItem } = require("../models/cart.model")

async function handleBorrow(req, res) {
  try {
    const body = await parseJsonBody(req)
    const { itemId, userId } = body

    if (!itemId || !userId) {
      sendJson(res, 400, {
        ok: false,
        message: "itemId and userId are required",
      })
      return
    }

    const user = await getUserAccountById(userId)
    if (!user) {
      sendJson(res, 404, { ok: false, message: "User account not found" })
      return
    }

    const borrowDays = user.is_faculty ? 14 : 7
    await createBorrowTransaction(user.user_id, itemId, borrowDays)

    sendJson(res, 200, {
      ok: true,
      message: `Item borrowed successfully for ${borrowDays} days.`,
    })
  } catch (error) {
    if (error instanceof OutOfStockError) {
      sendJson(res, 409, {
        ok: false,
        message: "Item is currently not available.",
      })
      return
    }

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
    const { itemId, userId } = body

    if (!itemId || !userId) {
      sendJson(res, 400, {
        ok: false,
        message: "itemId and userId are required",
      })
      return
    }

    const user = await getUserAccountById(userId)
    if (!user) {
      sendJson(res, 404, { ok: false, message: "User account not found" })
      return
    }

    const created = await createHold(itemId, user.user_id)
    if (!created) {
      sendJson(res, 200, { ok: true, message: "Hold already exists." })
      return
    }

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
    const { items, userId } = body

    if (!userId) {
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

    const user = await getUserAccountById(userId)
    if (!user) {
      sendJson(res, 404, { ok: false, message: "User account not found" })
      return
    }

    const borrowDays = user.is_faculty ? 14 : 7

    for (const item of items) {
      await createBorrowTransaction(user.user_id, item.itemId, borrowDays)
      await deleteCartItem(user.user_id, item.itemId)
    }

    sendJson(res, 200, { ok: true, message: "Successfully checked out items" })
  } catch (error) {
    if (error instanceof OutOfStockError) {
      sendJson(res, 409, {
        ok: false,
        message: "One or more selected items are currently unavailable.",
      })
      return
    }

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
