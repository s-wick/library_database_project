const { query } = require("../db")
const { sendJson } = require("../utils")

async function handleGetDashboard(req, res) {
  try {
    // In a real app we would determine the user ID from auth/session.
    // For now, since the frontend just sends a GET to /api/dashboard and expects general dashboard
    // or mocked data (it doesn't send userid), we will just return empty or mocked data arrays.

    // We could return dummy queries if we wanted. But returning empty arrays for now,
    // or select all for demo purposes.

    const borrowedBooks = await query(`
        SELECT b.borrow_transaction_id as id, 
               bk.title, 
               b.due_date as dueDate 
        FROM borrow b
        LEFT JOIN book bk ON b.item_id = bk.book_id
        WHERE b.item_type_code = 1
        LIMIT 5
    `)

    // Convert property names for frontend expectations:
    // frontend expects: id, title, dueDate for borrowedBooks
    const formattedBorrowed = borrowedBooks.map((b) => ({
      id: b.id,
      title: b.title || "Unknown Item",
      dueDate: b.dueDate
        ? new Date(b.dueDate).toISOString().split("T")[0]
        : "2026-10-01",
    }))

    const holds = await query(`
        SELECT h.hold_id as id,
               bk.title,
               h.queue_position as position
        FROM hold_item h
        LEFT JOIN book bk ON h.item_id = bk.book_id
        WHERE h.hold_status = 'active'
        LIMIT 5
    `)

    const formattedHolds = holds.map((h) => ({
      id: h.id,
      title: h.title || "Unknown Item",
      status: "Active", // frontend expects Active, Ready, etc
      position: h.position || 1,
    }))

    const finesData = await query(`
        SELECT f.fine_id as id,
               f.amount,
               f.fine_reason as reason
        FROM fined_for f
        WHERE f.is_paid = 0
        LIMIT 5
    `)

    const formattedFines = finesData.map((f) => ({
      id: f.id,
      amount: f.amount,
      reason: f.reason,
    }))

    // For borrow history
    const borrowHistory = await query(`
        SELECT b.borrow_transaction_id as id, 
               bk.title, 
               b.return_date as returnDate 
        FROM borrow b
        LEFT JOIN book bk ON b.item_id = bk.book_id
        WHERE b.return_date IS NOT NULL
        LIMIT 5
    `)

    const formattedHistory = borrowHistory.map((b) => ({
      id: b.id,
      title: b.title || "Unknown Item",
      returnDate: b.returnDate
        ? new Date(b.returnDate).toISOString().split("T")[0]
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
    console.error(error)
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
