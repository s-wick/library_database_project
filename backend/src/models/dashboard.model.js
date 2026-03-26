const { query } = require("../database")

async function getBorrowedBooks(userId) {
  return query(
    `
    SELECT b.item_id,
           b.checkout_date,
           b.due_date,
           i.title,
           bk.author
    FROM borrow b
    INNER JOIN item i ON i.item_id = b.item_id
    LEFT JOIN book bk ON bk.item_id = i.item_id
    WHERE b.user_id = ?
      AND b.return_date IS NULL
    ORDER BY b.checkout_date DESC
    LIMIT 25
  `,
    [userId]
  )
}

async function getActiveHolds(userId) {
  return query(
    `
    SELECT h.item_id,
           h.request_date,
           i.title,
           bk.author,
           (
             SELECT COUNT(*) + 1
             FROM hold_item h2
             WHERE h2.item_id = h.item_id
               AND h2.request_date < h.request_date
           ) AS queue_position
    FROM hold_item h
    INNER JOIN item i ON i.item_id = h.item_id
    LEFT JOIN book bk ON bk.item_id = i.item_id
    WHERE h.user_id = ?
    ORDER BY h.request_date DESC
    LIMIT 25
  `,
    [userId]
  )
}

async function getUnpaidFines(userId) {
  return query(
    `
    SELECT f.item_id,
           f.checkout_date,
           i.title,
           bk.author,
           f.amount,
           f.amount_paid,
           b.due_date,
           b.return_date
    FROM fined_for f
    INNER JOIN borrow b
      ON b.item_id = f.item_id
     AND b.user_id = f.user_id
     AND b.checkout_date = f.checkout_date
    INNER JOIN item i ON i.item_id = f.item_id
    LEFT JOIN book bk ON bk.item_id = i.item_id
    WHERE f.user_id = ?
      AND (f.amount_paid IS NULL OR f.amount_paid < f.amount)
    ORDER BY f.checkout_date DESC
    LIMIT 25
  `,
    [userId]
  )
}

async function getBorrowHistory(userId) {
  return query(
    `
    SELECT b.item_id,
           b.checkout_date,
           b.return_date,
           i.title,
           bk.author
    FROM borrow b
    INNER JOIN item i ON i.item_id = b.item_id
    LEFT JOIN book bk ON bk.item_id = i.item_id
    WHERE b.user_id = ?
      AND b.return_date IS NOT NULL
    ORDER BY b.return_date DESC
    LIMIT 50
  `,
    [userId]
  )
}

module.exports = {
  getBorrowedBooks,
  getActiveHolds,
  getUnpaidFines,
  getBorrowHistory,
}
