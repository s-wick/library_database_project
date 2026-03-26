const { sendJson } = require("../utils")
const {
  getBorrowedBooks,
  getActiveHolds,
  getUnpaidFines,
  getBorrowHistory,
} = require("../models/dashboard.model")

async function handleGetDashboard(_req, res) {
  try {
    const [borrowedBooks, holds, finesData, borrowHistory] = await Promise.all([
      getBorrowedBooks(),
      getActiveHolds(),
      getUnpaidFines(),
      getBorrowHistory(),
    ])

    const formattedBorrowed = borrowedBooks.map((book) => ({
      id: book.id,
      title: book.title || "Unknown Item",
      dueDate: book.dueDate
        ? new Date(book.dueDate).toISOString().split("T")[0]
        : "2026-10-01",
    }))

    const formattedHolds = holds.map((hold) => ({
      id: hold.id,
      title: hold.title || "Unknown Item",
      status: "Active",
      position: hold.position || 1,
    }))

    const formattedFines = finesData.map((fine) => ({
      id: fine.id,
      amount: fine.amount,
      reason: fine.reason,
    }))

    const formattedHistory = borrowHistory.map((book) => ({
      id: book.id,
      title: book.title || "Unknown Item",
      returnDate: book.returnDate
        ? new Date(book.returnDate).toISOString().split("T")[0]
        : "2026-09-01",
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
