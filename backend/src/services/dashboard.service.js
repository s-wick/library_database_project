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

function getBorrowStatus(dueDate) {
  const now = new Date()
  const due = new Date(dueDate)
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return "overdue"
  if (diffDays <= 2) return "due_soon"
  return "on_time"
}

function computeDaysOverdue(dueDate, returnDate) {
  const endDate = returnDate ? new Date(returnDate) : new Date()
  const due = new Date(dueDate)
  const diff = Math.ceil((endDate - due) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
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

    const formattedHolds = holds.map((hold) => ({
      id: `${hold.item_id}-${new Date(hold.request_date).toISOString()}`,
      title: hold.title || "Unknown Item",
      author: hold.author || "",
      status: "active",
      queuePosition: Number(hold.queue_position) || 1,
      estimatedWait: `${Math.max((Number(hold.queue_position) || 1) - 1, 0) * 3 + 1} days`,
    }))

    const formattedFines = finesData.map((fine) => ({
      id: `${fine.item_id}-${new Date(fine.checkout_date).toISOString()}`,
      amount: Number(fine.amount || 0) - Number(fine.amount_paid || 0),
      status: "unpaid",
      book: fine.title || "Unknown Item",
      daysOverdue: computeDaysOverdue(fine.due_date, fine.return_date),
    }))

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
