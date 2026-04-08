const { pool, query } = require("../database")

class OutOfStockError extends Error {}
class ItemNotFoundError extends Error {}
class ActiveBorrowNotFoundError extends Error {}

async function createBorrowTransaction(userId, itemId, borrowDays = 7) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [stockRows] = await connection.execute(
      `SELECT items_in_stock FROM item WHERE item_id = ? LIMIT 1`,
      [itemId]
    )

    if (!stockRows.length) {
      throw new Error("Item not found")
    }

    if (Number(stockRows[0].items_in_stock) <= 0) {
      throw new OutOfStockError("Item is not available")
    }

    await connection.execute(
      `INSERT INTO borrow (item_id, user_id, checkout_date, due_date)
       VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [itemId, userId, Number(borrowDays) || 7]
    )

    await connection.execute(
      `UPDATE item
       SET items_in_stock = items_in_stock - 1
       WHERE item_id = ?`,
      [itemId]
    )

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function createCheckinTransaction(userId, itemId, returnDate) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [itemRows] = await connection.execute(
      `SELECT item_id
       FROM item
       WHERE item_id = ?
       LIMIT 1`,
      [itemId]
    )

    if (!itemRows.length) {
      throw new ItemNotFoundError("Item not found")
    }

    const [borrowRows] = await connection.execute(
      `SELECT checkout_date
       FROM borrow
       WHERE item_id = ?
         AND user_id = ?
         AND return_date IS NULL
       ORDER BY checkout_date DESC
       LIMIT 1
       FOR UPDATE`,
      [itemId, userId]
    )

    if (!borrowRows.length) {
      throw new ActiveBorrowNotFoundError("No active borrow record found")
    }

    const normalizedReturnDate = returnDate ? new Date(returnDate) : new Date()
    if (Number.isNaN(normalizedReturnDate.getTime())) {
      throw new Error("Invalid return date")
    }

    const mysqlReturnDate = normalizedReturnDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ")

    await connection.execute(
      `UPDATE borrow
       SET return_date = ?
       WHERE item_id = ?
         AND user_id = ?
         AND checkout_date = ?`,
      [mysqlReturnDate, itemId, userId, borrowRows[0].checkout_date]
    )

    await connection.execute(
      `UPDATE item
       SET items_in_stock = items_in_stock + 1
       WHERE item_id = ?`,
      [itemId]
    )

    await connection.commit()

    return {
      itemId: Number(itemId),
      userId: Number(userId),
      returnDate: mysqlReturnDate,
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function createHold(itemId, userId) {
  const existing = await query(
    `SELECT item_id
     FROM hold_item
     WHERE item_id = ? AND user_id = ?
     LIMIT 1`,
    [itemId, userId]
  )

  if (existing.length) return false

  await query(
    `INSERT INTO hold_item (item_id, user_id, request_date)
     VALUES (?, ?, NOW())`,
    [itemId, userId]
  )

  return true
}

async function cancelHold(itemId, userId) {
  const result = await query(
    `
    DELETE FROM hold_item
    WHERE item_id = ? AND user_id = ?
  `,
    [itemId, userId]
  )
  return Number(result.affectedRows || 0) > 0
}

async function getUserAccountById(userId) {
  const rows = await query(
    `SELECT user_id, is_faculty
     FROM user_account
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  )

  return rows[0] || null
}

async function getActiveBorrowCount(userId) {
  const rows = await query(
    `SELECT COUNT(*) AS cnt
     FROM borrow
     WHERE user_id = ? AND return_date IS NULL`,
    [userId]
  )
  return Number(rows[0]?.cnt || 0)
}

module.exports = {
  createBorrowTransaction,
  createCheckinTransaction,
  createHold,
  cancelHold,
  getUserAccountById,
  getActiveBorrowCount,
  OutOfStockError,
  ItemNotFoundError,
  ActiveBorrowNotFoundError,
}
