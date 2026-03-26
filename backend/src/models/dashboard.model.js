const { query } = require("../database")
const { DAILY_FINE_RATE } = require("../utils/fine-calculation")

async function syncOverdueFines(userId) {
  await query(
    `
    INSERT INTO fined_for (item_id, user_id, checkout_date, amount, amount_paid)
    SELECT b.item_id,
           b.user_id,
           b.checkout_date,
           LEAST(
             ROUND(GREATEST(TIMESTAMPDIFF(DAY, b.due_date, COALESCE(b.return_date, NOW())), 0) * ?, 2),
             i.monetary_value
           ) AS amount,
           0
    FROM borrow b
    INNER JOIN item i ON i.item_id = b.item_id
    WHERE b.user_id = ?
      AND TIMESTAMPDIFF(DAY, b.due_date, COALESCE(b.return_date, NOW())) > 0
    ON DUPLICATE KEY UPDATE
      amount = VALUES(amount),
      amount_paid = LEAST(COALESCE(amount_paid, 0), VALUES(amount))
  `,
    [DAILY_FINE_RATE, userId]
  )
}

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

async function cancelHold(userId, itemId, requestDate = null) {
  let sql = `
    DELETE FROM hold_item
    WHERE user_id = ?
      AND item_id = ?
  `
  const params = [userId, itemId]

  // Optional legacy support for requestDate. Most clients should omit this.
  if (requestDate) {
    sql += ` AND request_date = ?`
    params.push(requestDate)
  }

  const result = await query(sql, params)
  return Number(result.affectedRows || 0) > 0
}

async function getUnpaidFines(userId) {
  return query(
    `
    SELECT f.item_id,
           f.checkout_date,
           i.title,
          i.monetary_value AS item_value,
           bk.author,
           f.amount,
           f.amount_paid,
           b.due_date,
              b.return_date,
              GREATEST(TIMESTAMPDIFF(DAY, b.due_date, COALESCE(b.return_date, NOW())), 0) AS days_overdue
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
  syncOverdueFines,
  getBorrowedBooks,
  getActiveHolds,
  cancelHold,
  getUnpaidFines,
  getBorrowHistory,
}
