const { pool, query } = require("../database")

class OutOfStockError extends Error {}
class ItemNotFoundError extends Error {}
class ActiveBorrowNotFoundError extends Error {}

const NOTIFICATION_TYPES = {
  holdAssigned: "Checked out item",
}

const HOLD_CLOSE_REASONS = {
  fulfilled: "Fulfilled",
  canceled: "Canceled",
}

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

async function createBorrowTransaction(userId, itemId) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [itemRows] = await connection.execute(
      `SELECT inventory
       FROM item
       WHERE item_id = ?
       LIMIT 1
       FOR UPDATE`,
      [itemId]
    )

    if (!itemRows.length) {
      throw new ItemNotFoundError("Item not found")
    }

    const [activeBorrowRows] = await connection.execute(
      `SELECT COUNT(*) AS active_borrow_count
       FROM borrow
       WHERE item_id = ?
         AND return_date IS NULL`,
      [itemId]
    )

    const inventory = Number(itemRows[0].inventory || 0)
    const activeBorrowCount = Number(
      activeBorrowRows[0]?.active_borrow_count || 0
    )
    const stock = Math.max(inventory - activeBorrowCount, 0)

    if (stock <= 0) {
      throw new OutOfStockError("Item is not available")
    }

    await connection.execute(
      `INSERT INTO borrow (item_id, user_id, checkout_date)
       VALUES (?, ?, NOW())`,
      [itemId, userId]
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
  await query(
    `INSERT INTO hold_item (item_id, user_id, request_datetime)
     VALUES (?, ?, NOW())`,
    [itemId, userId]
  )

  return true
}

async function cancelHold(itemId, userId, requestDate = null) {
  let sql = `
    UPDATE hold_item
    SET close_datetime = NOW(),
        close_reason_id = (
          SELECT reason_id
          FROM hold_item_closing_reasons
          WHERE reason_text = ?
          LIMIT 1
        )
    WHERE item_id = ? AND user_id = ? AND close_datetime IS NULL
  `
  const params = [HOLD_CLOSE_REASONS.canceled, itemId, userId]

  if (requestDate) {
    sql += ` AND request_datetime = ?`
    params.push(requestDate)
  }

  const result = await query(sql, params)
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

async function hasOutstandingFines(userId) {
  const rows = await query(
    `SELECT COUNT(*) AS cnt
     FROM fined_for
     WHERE user_id = ?
       AND COALESCE(amount_paid, 0) < amount`,
    [userId]
  )

  return Number(rows[0]?.cnt || 0) > 0
}

function formatDateOnly(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

async function getNotificationTypeId(typeText) {
  const rows = await query(
    `SELECT notification_type_id
     FROM user_notification_type
     WHERE notification_type_text = ?
     LIMIT 1`,
    [typeText]
  )

  if (!rows.length) {
    throw new Error(`Missing notification type: ${typeText}`)
  }

  return rows[0].notification_type_id
}

async function getHoldCloseReasonId(reasonText) {
  const rows = await query(
    `SELECT reason_id
     FROM hold_item_closing_reasons
     WHERE reason_text = ?
     LIMIT 1`,
    [reasonText]
  )

  return rows[0]?.reason_id || null
}

async function processUserHoldsOnLogin(userId) {
  const user = await getUserAccountById(userId)
  if (!user) return

  const fineRows = await query(
    `SELECT COUNT(*) AS cnt
     FROM fined_for
     WHERE user_id = ?
       AND COALESCE(amount, 0) > COALESCE(amount_paid, 0)`,
    [userId]
  )

  const hasUnpaidFine = Number(fineRows[0]?.cnt || 0) > 0

  if (hasUnpaidFine) {
    // Grace-period trigger logic owns hold cancellation when fines are unpaid.
    return
  }

  const holds = await query(
    `SELECT h.item_id, h.request_datetime, i.title
     FROM hold_item h
     INNER JOIN item i ON i.item_id = h.item_id
     WHERE h.user_id = ?
       AND h.close_datetime IS NULL
     ORDER BY h.request_datetime ASC`,
    [userId]
  )

  if (!holds.length) return

  const holdAssignedTypeId = await getNotificationTypeId(
    NOTIFICATION_TYPES.holdAssigned
  )
  const closeReasonCanceledId = await getHoldCloseReasonId(
    HOLD_CLOSE_REASONS.canceled
  )
  const closeReasonFulfilledId = await getHoldCloseReasonId(
    HOLD_CLOSE_REASONS.fulfilled
  )
  const borrowLimit = user.is_faculty ? 6 : 3
  let activeCount = await getActiveBorrowCount(userId)

  for (const hold of holds) {
    if (activeCount >= borrowLimit) break

    try {
      await createBorrowTransaction(userId, hold.item_id)
    } catch (error) {
      if (error instanceof OutOfStockError) {
        continue
      }

      if (error instanceof ItemNotFoundError) {
        await query(
          `UPDATE hold_item
           SET close_datetime = NOW(),
               close_reason_id = ?
           WHERE item_id = ? AND user_id = ? AND request_datetime = ?
             AND close_datetime IS NULL`,
          [closeReasonCanceledId, hold.item_id, userId, hold.request_datetime]
        )
        continue
      }

      if (error.sqlState === "45000") {
        break
      }

      throw error
    }

    const borrowRows = await query(
      `SELECT checkout_date, due_date
                 FROM borrow
                 WHERE item_id = ?
                   AND user_id = ?
                   AND return_date IS NULL
                 ORDER BY checkout_date DESC
                 LIMIT 1`,
      [hold.item_id, userId]
    )

    const borrowRow = borrowRows[0]
    const dueDate = borrowRow ? formatDateOnly(borrowRow.due_date) : null
    const dueDateText = dueDate || "N/A"

    await query(
      `INSERT INTO user_notification (
                   user_id,
                   item_id,
                   notification_type,
                   message
                 )
                 VALUES (?, ?, ?, ?)`,
      [
        userId,
        hold.item_id,
        holdAssignedTypeId,
        `Your hold for "${hold.title}" has been checked out to your account. It is due on ${dueDateText}.`,
      ]
    )
    await query(
      `UPDATE hold_item
       SET close_datetime = NOW(),
           close_reason_id = ?
       WHERE item_id = ? AND user_id = ? AND request_datetime = ?
         AND close_datetime IS NULL`,
      [closeReasonFulfilledId, hold.item_id, userId, hold.request_datetime]
    )
    activeCount += 1
  }
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
  hasOutstandingFines,
  processUserHoldsOnLogin,
  OutOfStockError,
  ItemNotFoundError,
  ActiveBorrowNotFoundError,
}
