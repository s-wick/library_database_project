const { query } = require("../database")

async function createBorrowTransaction(
  itemTypeCode,
  itemId,
  borrowerType,
  borrowerId
) {
  await query(
    `
    INSERT INTO borrow (item_type_code, item_id, borrower_type, borrower_id, checkout_date, due_date)
    VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))
    `,
    [itemTypeCode, itemId, borrowerType, borrowerId]
  )
}

async function createHold(itemId, userType, userId, queuePosition = 1) {
  await query(
    `
    INSERT INTO hold_item (item_id, user_type, user_id, hold_status, queue_position)
    VALUES (?, ?, ?, 'active', ?)
    `,
    [itemId, userType, userId, queuePosition]
  )
}

module.exports = {
  createBorrowTransaction,
  createHold,
}
