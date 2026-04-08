const { pool, query } = require("../database")

class OutOfStockError extends Error {}
class ItemNotFoundError extends Error {}
class ActiveBorrowNotFoundError extends Error {}

function normalizeCheckoutDateKey(checkoutDate) {
  const normalized = String(checkoutDate || "").trim()

  if (!normalized) return null

  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
    throw new Error("Invalid checkout date")
  }

  return normalized
}

function normalizeReturnDateValue(returnDate) {
  const normalizedReturnDate = returnDate ? new Date(returnDate) : new Date()
  if (Number.isNaN(normalizedReturnDate.getTime())) {
    throw new Error("Invalid return date")
  }

  return normalizedReturnDate.toISOString().slice(0, 19).replace("T", " ")
}

async function getBorrowRowForCheckin(
  connection,
  itemId,
  userId,
  checkoutDate
) {
  const checkoutDateKey = normalizeCheckoutDateKey(checkoutDate)
  const borrowLookupQuery = checkoutDateKey
    ? `SELECT checkout_date
       FROM borrow
       WHERE item_id = ?
         AND user_id = ?
         AND return_date IS NULL
         AND checkout_date = ?
       LIMIT 1
       FOR UPDATE`
    : `SELECT checkout_date
       FROM borrow
       WHERE item_id = ?
         AND user_id = ?
         AND return_date IS NULL
       ORDER BY checkout_date DESC
       LIMIT 1
       FOR UPDATE`
  const borrowLookupParams = checkoutDateKey
    ? [itemId, userId, checkoutDateKey]
    : [itemId, userId]

  const [borrowRows] = await connection.execute(
    borrowLookupQuery,
    borrowLookupParams
  )

  if (!borrowRows.length) {
    throw new ActiveBorrowNotFoundError("No active borrow record found")
  }

  return {
    checkoutDate: checkoutDateKey || borrowRows[0].checkout_date,
    borrowRow: borrowRows[0],
  }
}

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

async function createCheckinTransaction(
  userId,
  itemId,
  returnDate,
  checkoutDate
) {
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

    const { checkoutDate: checkoutDateKey, borrowRow } =
      await getBorrowRowForCheckin(connection, itemId, userId, checkoutDate)

    const mysqlReturnDate = normalizeReturnDateValue(returnDate)

    await connection.execute(
      `UPDATE borrow
       SET return_date = ?
       WHERE item_id = ?
         AND user_id = ?
         AND checkout_date = ?`,
      [mysqlReturnDate, itemId, userId, borrowRow.checkout_date]
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
      checkoutDate: checkoutDateKey || borrowRow.checkout_date,
      returnDate: mysqlReturnDate,
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function createBatchCheckinTransactions(records, returnDate) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const mysqlReturnDate = normalizeReturnDateValue(returnDate)
    const results = []

    for (const record of records) {
      const itemId = Number(record?.itemId)
      const userId = Number(record?.userId)

      if (!itemId || !userId) {
        throw new Error("Invalid check-in record")
      }

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

      const { checkoutDate: checkoutDateKey, borrowRow } =
        await getBorrowRowForCheckin(
          connection,
          itemId,
          userId,
          record?.checkoutDate
        )

      await connection.execute(
        `UPDATE borrow
         SET return_date = ?
         WHERE item_id = ?
           AND user_id = ?
           AND checkout_date = ?`,
        [mysqlReturnDate, itemId, userId, borrowRow.checkout_date]
      )

      await connection.execute(
        `UPDATE item
         SET items_in_stock = items_in_stock + 1
         WHERE item_id = ?`,
        [itemId]
      )

      results.push({
        itemId,
        userId,
        checkoutDate: checkoutDateKey,
        returnDate: mysqlReturnDate,
      })
    }

    await connection.commit()

    return results
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

async function getActiveBorrowCatalog(searchTerm = "") {
  const normalizedSearch = String(searchTerm || "")
    .trim()
    .toLowerCase()
  const filters = ["b.return_date IS NULL"]
  const params = []

  if (normalizedSearch) {
    const likeTerm = `%${normalizedSearch}%`

    filters.push(`(
      LOWER(i.title) LIKE ?
      OR LOWER(COALESCE(it.item_type, '')) LIKE ?
      OR LOWER(CONCAT_WS(' ', ua.first_name, ua.middle_name, ua.last_name)) LIKE ?
      OR LOWER(ua.email) LIKE ?
      OR CAST(b.item_id AS CHAR) LIKE ?
      OR CAST(ua.user_id AS CHAR) LIKE ?
    )`)

    params.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm)
  }

  const rows = await query(
    `SELECT
       CONCAT(b.item_id, '-', b.user_id, '-', DATE_FORMAT(b.checkout_date, '%Y-%m-%d %H:%i:%s')) AS borrowTransactionId,
       b.item_id AS itemId,
       b.user_id AS borrowerId,
       DATE_FORMAT(b.checkout_date, '%Y-%m-%d %H:%i:%s') AS checkoutDate,
       b.due_date AS dueDate,
       i.title AS itemName,
       COALESCE(it.item_type, 'ITEM') AS itemType,
       CONCAT_WS(' ', ua.first_name, ua.middle_name, ua.last_name) AS borrowerName,
       ua.email AS borrowerEmail,
       CASE WHEN ua.is_faculty = 1 THEN 'FACULTY' ELSE 'STUDENT' END AS borrowerType
     FROM borrow b
     INNER JOIN item i ON i.item_id = b.item_id
     LEFT JOIN item_type it ON it.item_code = i.item_type_code
     INNER JOIN user_account ua ON ua.user_id = b.user_id
     WHERE ${filters.join(" AND ")}
     ORDER BY b.checkout_date DESC`,
    params
  )

  return rows.map((row) => ({
    ...row,
    itemId: Number(row.itemId),
    borrowerId: Number(row.borrowerId),
  }))
}

module.exports = {
  createBorrowTransaction,
  createBatchCheckinTransactions,
  createCheckinTransaction,
  createHold,
  cancelHold,
  getActiveBorrowCatalog,
  getUserAccountById,
  getActiveBorrowCount,
  OutOfStockError,
  ItemNotFoundError,
  ActiveBorrowNotFoundError,
}
