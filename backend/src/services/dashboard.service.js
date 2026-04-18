const { sendJson } = require("../utils")
const {
  getBorrowedBooks,
  getActiveHolds,
  getUnpaidFines,
  getBorrowHistory,
} = require("../models/dashboard.model")

function toDateString(value) {
  if (!value) return null
  return new Date(value).toISOString().split("T")[0]
}

function toMysqlDateTime(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function getBorrowStatus(dueDate) {
  const now = new Date()
  const due = new Date(dueDate)
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return "overdue"
  if (diffDays <= 2) return "due_soon"
  return "on_time"
}

async function handleGetDashboard(_req, res, url) {
  try {
    const userId = url.searchParams.get("userId")
    if (!userId) {
      sendJson(res, 400, { ok: false, message: "userId is required" })
      return
    }

    const [borrowedBooks, holds, finesData, borrowHistory] = await Promise.all([
      getBorrowedBooks(userId),
      getActiveHolds(userId),
      getUnpaidFines(userId),
      getBorrowHistory(userId),
    ])

    const formattedBorrowed = borrowedBooks.map((book) => ({
      id: `${book.item_id}-${new Date(book.checkout_date).toISOString()}`,
      title: book.title || "Unknown Item",
      author: book.author || "",
      dueDate: toDateString(book.due_date),
      status: getBorrowStatus(book.due_date),
    }))

    const nowMs = Date.now()

    const formattedHolds = holds.map((hold) => {
      const graceExpiresAt = hold.grace_expires_at
        ? new Date(hold.grace_expires_at)
        : null
      const graceExpiresAtIso =
        graceExpiresAt && !Number.isNaN(graceExpiresAt.getTime())
          ? graceExpiresAt.toISOString()
          : null
      const graceSecondsRemaining = graceExpiresAtIso
        ? Math.max(Math.floor((graceExpiresAt.getTime() - nowMs) / 1000), 0)
        : null

      return {
        id: `${hold.item_id}-${new Date(hold.request_datetime).toISOString()}`,
        itemId: hold.item_id,
        requestDate: toMysqlDateTime(hold.request_datetime),
        title: hold.title || "Unknown Item",
        author: hold.author || "",
        status: graceExpiresAtIso ? "grace" : "active",
        graceStartedAt: hold.grace_started_at
          ? new Date(hold.grace_started_at).toISOString()
          : null,
        graceExpiresAt: graceExpiresAtIso,
        graceSecondsRemaining,
        queuePosition: Number(hold.queue_position) || 1,
        estimatedWait: `${Math.max((Number(hold.queue_position) || 1) - 1, 0) * 3 + 1} days`,
      }
    })

    const formattedFines = finesData.map((fine) => {
      const amount = Number(fine.amount || 0)
      const amountPaid = Number(fine.amount_paid || 0)
      const itemValue = Number(fine.item_value || 0)
      const outstanding = Math.max(amount - amountPaid, 0)
      const canPay = Boolean(fine.return_date)

      return {
        id: `${fine.item_id}-${new Date(fine.checkout_date).toISOString()}`,
        amount: outstanding,
        status: "unpaid",
        canPay,
        book: fine.title || "Unknown Item",
        daysOverdue: Math.max(Number(fine.days_overdue || 0), 0),
        isAtMaxValue: itemValue > 0 && amount >= itemValue,
        itemValue,
      }
    })

    const formattedHistory = borrowHistory.map((book) => ({
      id: `${book.item_id}-${new Date(book.checkout_date).toISOString()}`,
      title: book.title || "Unknown Item",
      author: book.author || "",
      returned: toDateString(book.return_date),
    }))

    sendJson(res, 200, {
      ok: true,
      borrowedBooks: formattedBorrowed,
      holdQueue: formattedHolds,
      fines: formattedFines,
      borrowHistory: formattedHistory,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    })
  }
}

module.exports = {
  handleGetDashboard,
}
