const { query } = require("../database")

async function getBorrowedBooks() {
  return query(`
    SELECT b.borrow_transaction_id as id,
           bk.title,
           b.due_date as dueDate
    FROM borrow b
    LEFT JOIN book bk ON b.item_id = bk.book_id
    WHERE b.item_type_code = 1
    LIMIT 5
  `)
}

async function getActiveHolds() {
  return query(`
    SELECT h.hold_id as id,
           bk.title,
           h.queue_position as position
    FROM hold_item h
    LEFT JOIN book bk ON h.item_id = bk.book_id
    WHERE h.hold_status = 'active'
    LIMIT 5
  `)
}

async function getUnpaidFines() {
  return query(`
    SELECT f.fine_id as id,
           f.amount,
           f.fine_reason as reason
    FROM fined_for f
    WHERE f.is_paid = 0
    LIMIT 5
  `)
}

async function getBorrowHistory() {
  return query(`
    SELECT b.borrow_transaction_id as id,
           bk.title,
           b.return_date as returnDate
    FROM borrow b
    LEFT JOIN book bk ON b.item_id = bk.book_id
    WHERE b.return_date IS NOT NULL
    LIMIT 5
  `)
}

module.exports = {
  getBorrowedBooks,
  getActiveHolds,
  getUnpaidFines,
  getBorrowHistory,
}
