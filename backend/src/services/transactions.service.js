const { sendJson, parseJsonBody } = require("../utils")
const {
  createBorrowTransaction,
  createBatchCheckinTransactions,
  createCheckinTransaction,
  createHold,
  cancelHold,
  getActiveBorrowCatalog,
  getUserAccountById,
  getActiveBorrowCount,
  hasOutstandingFines,
  OutOfStockError,
  ItemNotFoundError,
  ActiveBorrowNotFoundError,
} = require("../models/transactions.model")
const { getCartRowsByUserId } = require("../models/cart.model")
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

    const userHasOutstandingFines = await hasOutstandingFines(user.user_id)
    if (userHasOutstandingFines) {
      sendJson(res, 403, {
        ok: false,
        message: "Borrowing is blocked until all outstanding fines are paid.",
      })
      return
    }

    const borrowDays = user.is_faculty ? 14 : 7
    await createBorrowTransaction(user.user_id, itemId, borrowDays)

    sendJson(res, 200, {
      ok: true,
      message: `Item borrowed successfully for ${borrowDays} days.`,
    })
  } catch (error) {
    if (error instanceof ItemNotFoundError) {
      sendJson(res, 404, {
        ok: false,
        message: "Item not found",
      })
      return
    }

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

async function handleCheckin(req, res) {
  try {
    const body = await parseJsonBody(req)
    const { itemId, userId, returnDate, checkoutDate } = body
    const records = Array.isArray(body.records) ? body.records : null

    if (records?.length) {
      if (!returnDate) {
        sendJson(res, 400, {
          ok: false,
          message: "returnDate is required",
        })
        return
      }

      const userIds = [
        ...new Set(records.map((record) => Number(record?.userId))),
      ]

      for (const currentUserId of userIds) {
        if (!currentUserId) {
          sendJson(res, 400, {
            ok: false,
            message: "Each selected record must include a valid user.",
          })
          return
        }

        const user = await getUserAccountById(currentUserId)
        if (!user) {
          sendJson(res, 404, { ok: false, message: "User account not found" })
          return
        }
      }

      const results = await createBatchCheckinTransactions(records, returnDate)

      sendJson(res, 200, {
        ok: true,
        message: `${results.length} item(s) checked in successfully.`,
        data: results,
      })
      return
    }

    if (!itemId || !userId || !returnDate) {
      sendJson(res, 400, {
        ok: false,
        message: "itemId, userId, and returnDate are required",
      })
      return
    }

    const user = await getUserAccountById(userId)
    if (!user) {
      sendJson(res, 404, { ok: false, message: "User account not found" })
      return
    }

    const result = await createCheckinTransaction(
      user.user_id,
      itemId,
      returnDate,
      checkoutDate
    )

    sendJson(res, 200, {
      ok: true,
      message: "Item checked in successfully.",
      data: result,
    })
  } catch (error) {
    if (error instanceof ItemNotFoundError) {
      sendJson(res, 404, { ok: false, message: "Item not found" })
      return
    }

    if (error instanceof ActiveBorrowNotFoundError) {
      sendJson(res, 404, {
        ok: false,
        message: "No active borrow record was found for this item and user.",
      })
      return
    }

    if (error.message === "Invalid return date") {
      sendJson(res, 400, {
        ok: false,
        message: "Return date must be a valid date and time.",
      })
      return
    }

    if (error.message === "Invalid checkout date") {
      sendJson(res, 400, {
        ok: false,
        message: "Checkout record reference is invalid.",
      })
      return
    }

    if (error.message === "Invalid check-in record") {
      sendJson(res, 400, {
        ok: false,
        message: "One or more selected records are invalid.",
      })
      return
    }

    sendJson(res, 500, {
      ok: false,
      message: "Failed to check in item",
      error: error.message,
    })
  }
}

async function handleGetActiveBorrowCatalog(_req, res, url) {
  try {
    const search = url.searchParams.get("q") || ""
    const rows = await getActiveBorrowCatalog(search)

    sendJson(res, 200, {
      ok: true,
      rows,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to fetch active borrow catalog",
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

    const user = await getUserAccountById(userId)
    if (!user) {
      sendJson(res, 404, { ok: false, message: "User account not found" })
      return
    }

    const userHasOutstandingFines = await hasOutstandingFines(user.user_id)
    if (userHasOutstandingFines) {
      sendJson(res, 403, {
        ok: false,
        message: "Checkout is blocked until all outstanding fines are paid.",
      })
      return
    }

    const borrowDays = user.is_faculty ? 14 : 7
    const borrowLimit = user.is_faculty ? 6 : 3
    const activeCount = await getActiveBorrowCount(user.user_id)
    const totalAfterCheckout = activeCount + items.length

    if (totalAfterCheckout > borrowLimit) {
      sendJson(res, 400, {
        ok: false,
        message: `Borrow limit exceeded. You currently have ${activeCount} active borrow(s) and your limit is ${borrowLimit}. You can only check out ${borrowLimit - activeCount} more item(s).`,
        activeCount,
        borrowLimit,
      })
      return
    }

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

    // MySQL trigger signals borrow limit
    if (error.sqlState === "45000") {
      sendJson(res, 400, {
        ok: false,
        message: error.message || "Borrow limit reached.",
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

async function handleCancelHold(req, res) {
  try {
    const body = await parseJsonBody(req)
    const { itemId, userId, requestDate } = body

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

    const removed = await cancelHold(itemId, user.user_id, requestDate || null)
    if (!removed) {
      sendJson(res, 404, { ok: false, message: "Hold entry not found" })
      return
    }

    sendJson(res, 200, { ok: true, message: "Hold canceled successfully" })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to cancel hold",
      error: error.message,
    })
  }
}

module.exports = {
  handleCheckout,
  handleBorrow,
  handleCheckin,
  handleGetActiveBorrowCatalog,
  handleHold,
  handleCancelHold,
  handleBorrowStatus,
}

async function handleBorrowStatus(req, res, url) {
  try {
    const userId = url.searchParams.get("userId")
    if (!userId) {
      sendJson(res, 400, { ok: false, message: "userId is required" })
      return
    }

    const user = await getUserAccountById(userId)
    if (!user) {
      sendJson(res, 404, { ok: false, message: "User not found" })
      return
    }

    const borrowLimit = user.is_faculty ? 6 : 3
    const borrowDays = user.is_faculty ? 14 : 7
    const activeCount = await getActiveBorrowCount(user.user_id)
    const userHasOutstandingFines = await hasOutstandingFines(user.user_id)
    const cartRows = await getCartRowsByUserId(userId)
    const cartCount = cartRows.length

    sendJson(res, 200, {
      ok: true,
      isFaculty: Boolean(user.is_faculty),
      borrowLimit,
      borrowDays,
      activeCount,
      cartCount,
      remaining: Math.max(borrowLimit - activeCount, 0),
      hasOutstandingFines: userHasOutstandingFines,
      finesMessage: userHasOutstandingFines
        ? "Checkout is blocked until all outstanding fines are paid."
        : null,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to get borrow status",
      error: error.message,
    })
  }
}
