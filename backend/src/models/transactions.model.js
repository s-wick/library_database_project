const { pool, query } = require("../database")

class OutOfStockError extends Error {}
class ItemNotFoundError extends Error {}
class ActiveBorrowNotFoundError extends Error {}
class HoldPickupNotReadyError extends Error {}
class HoldPickupExpiredError extends Error {}
class OutstandingFinesError extends Error {}
class BorrowLimitReachedError extends Error {}

const NOTIFICATION_TYPES = {
  holdAssigned: "Checked out item",
  holdReady: "Hold ready for pickup",
  holdRemoved: "Removed hold",
  holdGraceStarted: "Hold grace started",
}

const HOLD_CLOSE_REASONS = {
  fulfilled: "Fulfilled",
  canceled: "Canceled",
  canceledByFineGraceExpired: "Canceled by fine (grace expired)",
  canceledByPickupExpiry: "Canceled - pickup window expired",
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

async function getNotificationTypeIdWithConnection(connection, typeText) {
  const [rows] = await connection.execute(
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

async function getHoldCloseReasonIdWithConnection(connection, reasonText) {
  const [rows] = await connection.execute(
    `SELECT reason_id
     FROM hold_item_closing_reasons
     WHERE reason_text = ?
     LIMIT 1`,
    [reasonText]
  )

  return rows[0]?.reason_id || null
}

function normalizeMysqlDateTime(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid pickup date")
  }

  return date.toISOString().slice(0, 19).replace("T", " ")
}

function formatDateForNotification(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return "N/A"
  return date.toISOString().slice(0, 10)
}

async function assignNextPickupReadyHold(itemId) {
  const holdRows = await query(
    `SELECT h.item_id,
            h.user_id,
            h.request_datetime,
            h.grace_expires_at,
            h.pickup_expires_at,
            i.title
     FROM hold_item h
     INNER JOIN item i ON i.item_id = h.item_id
     WHERE h.item_id = ?
       AND h.close_datetime IS NULL
     ORDER BY h.request_datetime ASC`,
    [itemId]
  )

  if (!holdRows.length) return false

  const holdReadyTypeId = await getNotificationTypeId(
    NOTIFICATION_TYPES.holdReady
  )
  const holdRemovedTypeId = await getNotificationTypeId(
    NOTIFICATION_TYPES.holdRemoved
  )
  const holdGraceStartedTypeId = await getNotificationTypeId(
    NOTIFICATION_TYPES.holdGraceStarted
  )
  const fineExpiredReasonId =
    (await getHoldCloseReasonId(
      HOLD_CLOSE_REASONS.canceledByFineGraceExpired
    )) || (await getHoldCloseReasonId(HOLD_CLOSE_REASONS.canceled))
  const pickupExpiredReasonId =
    (await getHoldCloseReasonId(HOLD_CLOSE_REASONS.canceledByPickupExpiry)) ||
    (await getHoldCloseReasonId(HOLD_CLOSE_REASONS.canceled))

  for (const hold of holdRows) {
    const pickupExpiresAt = hold.pickup_expires_at
      ? new Date(hold.pickup_expires_at)
      : null

    if (pickupExpiresAt && !Number.isNaN(pickupExpiresAt.getTime())) {
      if (pickupExpiresAt > new Date()) {
        return false
      }

      await query(
        `UPDATE hold_item
         SET close_datetime = NOW(),
             close_reason_id = ?,
             grace_started_at = NULL,
             grace_expires_at = NULL,
             pickup_ready_at = NULL,
             pickup_expires_at = NULL
         WHERE item_id = ?
           AND user_id = ?
           AND request_datetime = ?
           AND close_datetime IS NULL`,
        [
          pickupExpiredReasonId,
          hold.item_id,
          hold.user_id,
          hold.request_datetime,
        ]
      )

      await query(
        `INSERT INTO user_notification (user_id, item_id, notification_type, message)
         VALUES (?, ?, ?, ?)`,
        [
          hold.user_id,
          hold.item_id,
          holdRemovedTypeId,
          `Your hold for "${hold.title}" was canceled because the 72-hour pickup window expired.`,
        ]
      )

      continue
    }

    const hasFine = await hasOutstandingFines(hold.user_id)
    if (hasFine) {
      if (!hold.grace_expires_at) {
        await query(
          `UPDATE hold_item
           SET grace_started_at = NOW(),
               grace_expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR),
               pickup_ready_at = NULL,
               pickup_expires_at = NULL
           WHERE item_id = ?
             AND user_id = ?
             AND request_datetime = ?
             AND close_datetime IS NULL
             AND grace_expires_at IS NULL`,
          [hold.item_id, hold.user_id, hold.request_datetime]
        )

        await query(
          `INSERT INTO user_notification (user_id, item_id, notification_type, message)
           VALUES (?, ?, ?, ?)`,
          [
            hold.user_id,
            hold.item_id,
            holdGraceStartedTypeId,
            `Your hold for "${hold.title}" entered a 24-hour grace period because your account has unpaid fines. Pay within 24 hours to keep this hold active.`,
          ]
        )
        return false
      }

      const graceExpiresAt = new Date(hold.grace_expires_at)
      if (
        !Number.isNaN(graceExpiresAt.getTime()) &&
        graceExpiresAt > new Date()
      ) {
        return false
      }

      await query(
        `UPDATE hold_item
         SET close_datetime = NOW(),
             close_reason_id = ?,
             grace_started_at = NULL,
             grace_expires_at = NULL,
             pickup_ready_at = NULL,
             pickup_expires_at = NULL
         WHERE item_id = ?
           AND user_id = ?
           AND request_datetime = ?
           AND close_datetime IS NULL`,
        [fineExpiredReasonId, hold.item_id, hold.user_id, hold.request_datetime]
      )

      await query(
        `INSERT INTO user_notification (user_id, item_id, notification_type, message)
         VALUES (?, ?, ?, ?)`,
        [
          hold.user_id,
          hold.item_id,
          holdRemovedTypeId,
          `Your hold for "${hold.title}" was removed because your 24-hour fine grace period expired.`,
        ]
      )
      continue
    }

    const user = await getUserAccountById(hold.user_id)
    if (!user) {
      await query(
        `UPDATE hold_item
         SET close_datetime = NOW(),
             close_reason_id = ?
         WHERE item_id = ?
           AND user_id = ?
           AND request_datetime = ?
           AND close_datetime IS NULL`,
        [
          (await getHoldCloseReasonId(HOLD_CLOSE_REASONS.canceled)) || null,
          hold.item_id,
          hold.user_id,
          hold.request_datetime,
        ]
      )
      continue
    }

    const activeCount = await getActiveBorrowCount(hold.user_id)
    const borrowLimit = user.is_faculty ? 6 : 3

    if (activeCount >= borrowLimit) {
      continue
    }

    await query(
      `UPDATE hold_item
       SET pickup_ready_at = NOW(),
           pickup_expires_at = DATE_ADD(NOW(), INTERVAL 72 HOUR),
           grace_started_at = NULL,
           grace_expires_at = NULL
       WHERE item_id = ?
         AND user_id = ?
         AND request_datetime = ?
         AND close_datetime IS NULL
         AND pickup_expires_at IS NULL`,
      [hold.item_id, hold.user_id, hold.request_datetime]
    )

    await query(
      `INSERT INTO user_notification (user_id, item_id, notification_type, message)
       VALUES (?, ?, ?, ?)`,
      [
        hold.user_id,
        hold.item_id,
        holdReadyTypeId,
        `Your hold for "${hold.title}" is ready for pickup. Please collect it within 72 hours.`,
      ]
    )
    return true
  }

  return false
}

async function processExpiredPickupHoldsForUser(userId) {
  const rows = await query(
    `SELECT h.item_id, h.user_id, h.request_datetime, i.title
     FROM hold_item h
     INNER JOIN item i ON i.item_id = h.item_id
     WHERE h.user_id = ?
       AND h.close_datetime IS NULL
       AND h.pickup_expires_at IS NOT NULL
       AND h.pickup_expires_at <= NOW()
     ORDER BY h.request_datetime ASC`,
    [userId]
  )

  if (!rows.length) return 0

  const closeReasonId =
    (await getHoldCloseReasonId(HOLD_CLOSE_REASONS.canceledByPickupExpiry)) ||
    (await getHoldCloseReasonId(HOLD_CLOSE_REASONS.canceled))
  const removedTypeId = await getNotificationTypeId(
    NOTIFICATION_TYPES.holdRemoved
  )
  const touchedItems = new Set()
  let processed = 0

  for (const hold of rows) {
    const result = await query(
      `UPDATE hold_item
       SET close_datetime = NOW(),
           close_reason_id = ?,
           grace_started_at = NULL,
           grace_expires_at = NULL,
           pickup_ready_at = NULL,
           pickup_expires_at = NULL
       WHERE item_id = ?
         AND user_id = ?
         AND request_datetime = ?
         AND close_datetime IS NULL`,
      [closeReasonId, hold.item_id, hold.user_id, hold.request_datetime]
    )

    if (Number(result.affectedRows || 0) < 1) {
      continue
    }

    await query(
      `INSERT INTO user_notification (user_id, item_id, notification_type, message)
       VALUES (?, ?, ?, ?)`,
      [
        hold.user_id,
        hold.item_id,
        removedTypeId,
        `Your hold for "${hold.title}" was canceled because the 72-hour pickup window expired.`,
      ]
    )

    touchedItems.add(Number(hold.item_id))
    processed += 1
  }

  for (const itemId of touchedItems) {
    await assignNextPickupReadyHold(itemId)
  }

  return processed
}

async function processUserHoldsOnLogin(userId) {
  const user = await getUserAccountById(userId)
  if (!user) return

  await processExpiredPickupHoldsForUser(userId)
}

async function getPickupReadyCatalog(searchTerm = "") {
  const normalizedSearch = String(searchTerm || "")
    .trim()
    .toLowerCase()
  const filters = [
    "h.close_datetime IS NULL",
    "h.pickup_expires_at IS NOT NULL",
    "h.pickup_expires_at > NOW()",
  ]
  const params = []

  if (normalizedSearch) {
    const likeTerm = `%${normalizedSearch}%`
    filters.push(`(
      LOWER(i.title) LIKE ?
      OR LOWER(CONCAT_WS(' ', ua.first_name, ua.middle_name, ua.last_name)) LIKE ?
      OR LOWER(ua.email) LIKE ?
      OR CAST(h.item_id AS CHAR) LIKE ?
      OR CAST(h.user_id AS CHAR) LIKE ?
    )`)
    params.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm)
  }

  const rows = await query(
    `SELECT h.item_id AS itemId,
            h.user_id AS userId,
            DATE_FORMAT(h.request_datetime, '%Y-%m-%d %H:%i:%s') AS requestDate,
            h.pickup_ready_at AS pickupReadyAt,
            h.pickup_expires_at AS pickupExpiresAt,
            i.title AS itemTitle,
            CONCAT_WS(' ', ua.first_name, ua.middle_name, ua.last_name) AS userName,
            ua.email AS userEmail,
            CASE WHEN ua.is_faculty = 1 THEN 'FACULTY' ELSE 'STUDENT' END AS userType
     FROM hold_item h
     INNER JOIN item i ON i.item_id = h.item_id
     INNER JOIN user_account ua ON ua.user_id = h.user_id
     WHERE ${filters.join(" AND ")}
     ORDER BY h.pickup_expires_at ASC`,
    params
  )

  return rows.map((row) => ({
    ...row,
    itemId: Number(row.itemId),
    userId: Number(row.userId),
  }))
}

async function completeHoldPickupTransaction(
  itemId,
  userId,
  requestDate,
  pickupDate
) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const mysqlPickupDate = normalizeMysqlDateTime(pickupDate)
    const holdLookupQuery = requestDate
      ? `SELECT h.item_id,
                h.user_id,
                h.request_datetime,
                h.pickup_expires_at,
                i.title,
                COALESCE(ua.is_faculty, 0) AS is_faculty
         FROM hold_item h
         INNER JOIN item i ON i.item_id = h.item_id
         INNER JOIN user_account ua ON ua.user_id = h.user_id
         WHERE h.item_id = ?
           AND h.user_id = ?
           AND h.request_datetime = ?
           AND h.close_datetime IS NULL
           AND h.pickup_expires_at IS NOT NULL
         LIMIT 1
         FOR UPDATE`
      : `SELECT h.item_id,
                h.user_id,
                h.request_datetime,
                h.pickup_expires_at,
                i.title,
                COALESCE(ua.is_faculty, 0) AS is_faculty
         FROM hold_item h
         INNER JOIN item i ON i.item_id = h.item_id
         INNER JOIN user_account ua ON ua.user_id = h.user_id
         WHERE h.item_id = ?
           AND h.user_id = ?
           AND h.close_datetime IS NULL
           AND h.pickup_expires_at IS NOT NULL
         ORDER BY h.request_datetime ASC
         LIMIT 1
         FOR UPDATE`

    const holdLookupParams = requestDate
      ? [itemId, userId, requestDate]
      : [itemId, userId]
    const [holdRows] = await connection.execute(
      holdLookupQuery,
      holdLookupParams
    )

    if (!holdRows.length) {
      throw new HoldPickupNotReadyError("No pickup-ready hold record found")
    }

    const hold = holdRows[0]
    const pickupExpiry = new Date(hold.pickup_expires_at)
    if (!Number.isNaN(pickupExpiry.getTime()) && pickupExpiry <= new Date()) {
      throw new HoldPickupExpiredError("Pickup window has already expired")
    }

    const [fineRows] = await connection.execute(
      `SELECT COUNT(*) AS cnt
       FROM fined_for
       WHERE user_id = ?
         AND COALESCE(amount_paid, 0) < amount`,
      [userId]
    )
    if (Number(fineRows[0]?.cnt || 0) > 0) {
      throw new OutstandingFinesError(
        "Checkout is blocked until all outstanding fines are paid"
      )
    }

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
      throw new OutOfStockError("Item is currently not available")
    }

    const [userBorrowRows] = await connection.execute(
      `SELECT COUNT(*) AS cnt
       FROM borrow
       WHERE user_id = ?
         AND return_date IS NULL`,
      [userId]
    )
    const borrowLimit = Number(hold.is_faculty || 0) === 1 ? 6 : 3
    const activeForUser = Number(userBorrowRows[0]?.cnt || 0)
    if (activeForUser >= borrowLimit) {
      throw new BorrowLimitReachedError("Borrow limit reached for this user")
    }

    const dueDays = Number(hold.is_faculty || 0) === 1 ? 14 : 7
    await connection.execute(
      `INSERT INTO borrow (item_id, user_id, checkout_date, due_date)
       VALUES (?, ?, ?, DATE_ADD(?, INTERVAL ? DAY))`,
      [itemId, userId, mysqlPickupDate, mysqlPickupDate, dueDays]
    )

    const checkedOutTypeId = await getNotificationTypeIdWithConnection(
      connection,
      NOTIFICATION_TYPES.holdAssigned
    )
    const fulfilledReasonId = await getHoldCloseReasonIdWithConnection(
      connection,
      HOLD_CLOSE_REASONS.fulfilled
    )

    const [borrowRows] = await connection.execute(
      `SELECT due_date
       FROM borrow
       WHERE item_id = ?
         AND user_id = ?
         AND checkout_date = ?
       LIMIT 1`,
      [itemId, userId, mysqlPickupDate]
    )

    const dueDateText = formatDateForNotification(borrowRows[0]?.due_date)

    await connection.execute(
      `UPDATE hold_item
       SET close_datetime = ?,
           close_reason_id = ?,
           grace_started_at = NULL,
           grace_expires_at = NULL,
           pickup_ready_at = NULL,
           pickup_expires_at = NULL
       WHERE item_id = ?
         AND user_id = ?
         AND request_datetime = ?
         AND close_datetime IS NULL`,
      [
        mysqlPickupDate,
        fulfilledReasonId,
        itemId,
        userId,
        hold.request_datetime,
      ]
    )

    await connection.execute(
      `INSERT INTO user_notification (user_id, item_id, notification_type, message)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        itemId,
        checkedOutTypeId,
        `Your hold for "${hold.title}" has been checked out to your account. It is due on ${dueDateText}.`,
      ]
    )

    await connection.commit()

    return {
      itemId: Number(itemId),
      userId: Number(userId),
      requestDate: hold.request_datetime,
      checkoutDate: mysqlPickupDate,
      dueDate: borrowRows[0]?.due_date || null,
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
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
  getPickupReadyCatalog,
  completeHoldPickupTransaction,
  getUserAccountById,
  getActiveBorrowCount,
  hasOutstandingFines,
  processExpiredPickupHoldsForUser,
  processUserHoldsOnLogin,
  OutOfStockError,
  ItemNotFoundError,
  ActiveBorrowNotFoundError,
  HoldPickupNotReadyError,
  HoldPickupExpiredError,
  OutstandingFinesError,
  BorrowLimitReachedError,
}
