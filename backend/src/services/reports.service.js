const { sendJson } = require("../utils")
const { query } = require("../database")

function normalizeUserType(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
  if (normalized === "STUDENT" || normalized === "FACULTY") {
    return normalized
  }
  return ""
}

function parseGenresFilter(value) {
  const raw = String(value || "").trim()
  if (!raw || raw === "NOT_APPLICABLE") return []

  const items = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part !== "NOT_APPLICABLE")

  return Array.from(new Set(items))
}

function buildWhereFilters(url) {
  const params = []
  const clauses = []

  const startDate = String(url.searchParams.get("startDate") || "").trim()
  if (startDate) {
    clauses.push("b.checkout_date >= ?")
    params.push(`${startDate} 00:00:00`)
  }

  const endDate = String(url.searchParams.get("endDate") || "").trim()
  if (endDate) {
    clauses.push("b.checkout_date < DATE_ADD(?, INTERVAL 1 DAY)")
    params.push(endDate)
  }

  const userType = normalizeUserType(url.searchParams.get("userType"))
  if (userType) {
    clauses.push("ua.is_faculty = ?")
    params.push(userType === "FACULTY" ? 1 : 0)
  }

  const itemType = String(url.searchParams.get("itemType") || "").trim()
  if (itemType) {
    clauses.push("it.item_type = ?")
    params.push(itemType)
  }

  const genres = parseGenresFilter(url.searchParams.get("genre"))
  if (genres.length) {
    const placeholders = genres.map(() => "?").join(",")
    clauses.push(`EXISTS (
      SELECT 1
      FROM assigned_genres agf
      INNER JOIN genre gf ON gf.genre_id = agf.genre_id
      WHERE agf.item_id = i.item_id AND gf.genre_text IN (${placeholders})
    )`)
    params.push(...genres)
  }

  const overdue = String(url.searchParams.get("overdue") || "all").trim()
  const overdueExpr = `(
    CASE
      WHEN b.return_date IS NULL THEN (b.due_date < NOW())
      ELSE (b.return_date > b.due_date)
    END
  )`

  if (overdue === "overdue") {
    clauses.push(`${overdueExpr} = 1`)
  }

  if (overdue === "notOverdue") {
    clauses.push(`${overdueExpr} = 0`)
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  }
}

function buildHoldsWhereFilters(url) {
  const params = []
  const clauses = []

  const startDate = String(url.searchParams.get("startDate") || "").trim()
  if (startDate) {
    clauses.push("hi.request_datetime >= ?")
    params.push(`${startDate} 00:00:00`)
  }

  const endDate = String(url.searchParams.get("endDate") || "").trim()
  if (endDate) {
    clauses.push("hi.request_datetime < DATE_ADD(?, INTERVAL 1 DAY)")
    params.push(endDate)
  }

  const userType = normalizeUserType(url.searchParams.get("userType"))
  if (userType) {
    clauses.push("ua.is_faculty = ?")
    params.push(userType === "FACULTY" ? 1 : 0)
  }

  const itemType = String(url.searchParams.get("itemType") || "").trim()
  if (itemType) {
    clauses.push("it.item_type = ?")
    params.push(itemType)
  }

  const genres = parseGenresFilter(url.searchParams.get("genre"))
  if (genres.length) {
    const placeholders = genres.map(() => "?").join(",")
    clauses.push(`EXISTS (
      SELECT 1
      FROM assigned_genres agf
      INNER JOIN genre gf ON gf.genre_id = agf.genre_id
      WHERE agf.item_id = i.item_id AND gf.genre_text IN (${placeholders})
    )`)
    params.push(...genres)
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  }
}

function getPagination(url) {
  const pageValue = Number(url.searchParams.get("page") || 1)
  const pageSizeValue = Number(url.searchParams.get("pageSize") || 100)

  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1
  const pageSize = Number.isFinite(pageSizeValue)
    ? Math.min(Math.max(pageSizeValue, 1), 200)
    : 100

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  }
}

async function getCheckedOutRows(url) {
  const { whereClause, params } = buildWhereFilters(url)
  const { page, pageSize, offset } = getPagination(url)
  const limit = pageSize + 1
  const safeOffset = Math.max(0, Math.trunc(offset))
  const safeLimit = Math.max(1, Math.trunc(limit))

  const rows = await query(
    `SELECT
       CONCAT(b.item_id, '-', b.user_id, '-', DATE_FORMAT(b.checkout_date, '%Y-%m-%d %H:%i:%s')) AS borrowTransactionId,
       b.item_id AS itemId,
       b.user_id AS borrowerId,
       i.title AS itemName,
       it.item_type AS itemType,
       CASE WHEN ua.is_faculty = 1 THEN 'FACULTY' ELSE 'STUDENT' END AS userType,
       CONCAT(ua.first_name, ' ', ua.last_name) AS borrowerName,
       ua.email AS borrowerEmail,
       b.checkout_date AS checkoutDate,
       b.due_date AS dueDate,
       b.return_date AS returnDate,
       CASE
         WHEN b.return_date IS NULL THEN CASE WHEN b.due_date < NOW() THEN 1 ELSE 0 END
         ELSE CASE WHEN b.return_date > b.due_date THEN 1 ELSE 0 END
       END AS isOverdue,
       COALESCE(ig.genres, '') AS genres
     FROM borrow b
     INNER JOIN item i ON i.item_id = b.item_id
     LEFT JOIN item_type it ON it.item_code = i.item_type_code
     INNER JOIN user_account ua ON ua.user_id = b.user_id
     LEFT JOIN (
       SELECT
         ag.item_id,
         GROUP_CONCAT(DISTINCT g.genre_text ORDER BY g.genre_text SEPARATOR ', ') AS genres
       FROM assigned_genres ag
       INNER JOIN genre g ON g.genre_id = ag.genre_id
       GROUP BY ag.item_id
     ) ig ON ig.item_id = i.item_id
     ${whereClause}
    ORDER BY b.checkout_date DESC
    LIMIT ${safeOffset}, ${safeLimit}`,
    params
  )

  const hasMore = rows.length > pageSize

  return {
    rows: hasMore ? rows.slice(0, pageSize) : rows,
    page,
    pageSize,
    hasMore,
  }
}

async function getRevenueRows(url) {
  const { whereClause, params } = buildWhereFilters(url)
  const { page, pageSize, offset } = getPagination(url)
  const limit = pageSize + 1
  const safeOffset = Math.max(0, Math.trunc(offset))
  const safeLimit = Math.max(1, Math.trunc(limit))

  const rows = await query(
    `SELECT
       CONCAT(b.item_id, '-', b.user_id, '-', DATE_FORMAT(b.checkout_date, '%Y-%m-%d %H:%i:%s')) AS fineId,
       b.item_id AS itemId,
       b.user_id AS borrowerId,
       i.title AS itemName,
       i.monetary_value AS itemValue,
       it.item_type AS itemType,
       CASE WHEN ua.is_faculty = 1 THEN 'FACULTY' ELSE 'STUDENT' END AS userType,
       CONCAT(ua.first_name, ' ', ua.last_name) AS borrowerName,
       ua.email AS borrowerEmail,
       ff.amount AS fineAmount,
       ff.amount_paid AS amountPaid,
       GREATEST(COALESCE(ff.amount, 0) - COALESCE(ff.amount_paid, 0), 0) AS fineOwed,
       GREATEST(COALESCE(ff.amount, 0) - COALESCE(ff.amount_paid, 0), 0) + COALESCE(i.monetary_value, 0) AS revenueAmount,
       CASE
         WHEN ff.item_id IS NULL THEN 1
         WHEN COALESCE(ff.amount_paid, 0) >= COALESCE(ff.amount, 0) THEN 1
         ELSE 0
       END AS isPaidOff,
       CASE
         WHEN ff.item_id IS NULL THEN 'Item value'
         ELSE 'Fine + item value'
       END AS revenueSource,
       b.checkout_date AS dateAssigned,
       b.checkout_date AS checkoutDate,
       b.due_date AS dueDate,
       b.return_date AS returnDate,
       CASE
         WHEN b.return_date IS NULL THEN CASE WHEN b.due_date < NOW() THEN 1 ELSE 0 END
         ELSE CASE WHEN b.return_date > b.due_date THEN 1 ELSE 0 END
       END AS isOverdue,
       COALESCE(ig.genres, '') AS genres
     FROM borrow b
     LEFT JOIN fined_for ff
       ON ff.item_id = b.item_id
      AND ff.user_id = b.user_id
      AND ff.checkout_date = b.checkout_date
     INNER JOIN item i ON i.item_id = b.item_id
     LEFT JOIN item_type it ON it.item_code = i.item_type_code
     INNER JOIN user_account ua ON ua.user_id = b.user_id
     LEFT JOIN (
       SELECT
         ag.item_id,
         GROUP_CONCAT(DISTINCT g.genre_text ORDER BY g.genre_text SEPARATOR ', ') AS genres
       FROM assigned_genres ag
       INNER JOIN genre g ON g.genre_id = ag.genre_id
       GROUP BY ag.item_id
     ) ig ON ig.item_id = i.item_id
     ${whereClause}
    ORDER BY b.checkout_date DESC
    LIMIT ${safeOffset}, ${safeLimit}`,
    params
  )

  const hasMore = rows.length > pageSize

  return {
    rows: hasMore ? rows.slice(0, pageSize) : rows,
    page,
    pageSize,
    hasMore,
  }
}

async function getHoldsRows(url) {
  const { whereClause, params } = buildHoldsWhereFilters(url)
  const { page, pageSize, offset } = getPagination(url)
  const limit = pageSize + 1
  const safeOffset = Math.max(0, Math.trunc(offset))
  const safeLimit = Math.max(1, Math.trunc(limit))

  const rows = await query(
    `SELECT
       CONCAT(hi.item_id, '-', hi.user_id, '-', DATE_FORMAT(hi.request_datetime, '%Y-%m-%d %H:%i:%s')) AS holdId,
       hi.item_id AS itemId,
       hi.user_id AS userId,
       i.title AS itemName,
       it.item_type AS itemType,
       CASE WHEN ua.is_faculty = 1 THEN 'FACULTY' ELSE 'STUDENT' END AS userType,
       CONCAT(ua.first_name, ' ', ua.last_name) AS userName,
       ua.email AS userEmail,
       hi.request_datetime AS requestDateTime,
       hi.grace_expires_at AS graceExpiresAt,
       hi.close_datetime AS closeDateTime,
       COALESCE(hcr.reason_text, 'ACTIVE') AS closeReason,
       CASE
         WHEN hi.close_datetime IS NULL AND hi.grace_expires_at IS NOT NULL THEN 'GRACE'
         WHEN hi.close_datetime IS NULL THEN 'ACTIVE'
         WHEN hcr.reason_text = 'Fulfilled' THEN 'FULFILLED'
         ELSE 'CANCELED'
       END AS holdStatus,
       TIMESTAMPDIFF(
         HOUR,
         hi.request_datetime,
         COALESCE(hi.close_datetime, NOW())
       ) AS waitHours,
       COALESCE(ig.genres, '') AS genres
     FROM hold_item hi
     INNER JOIN item i ON i.item_id = hi.item_id
     LEFT JOIN item_type it ON it.item_code = i.item_type_code
     INNER JOIN user_account ua ON ua.user_id = hi.user_id
     LEFT JOIN hold_item_closing_reasons hcr ON hcr.reason_id = hi.close_reason_id
     LEFT JOIN (
       SELECT
         ag.item_id,
         GROUP_CONCAT(DISTINCT g.genre_text ORDER BY g.genre_text SEPARATOR ', ') AS genres
       FROM assigned_genres ag
       INNER JOIN genre g ON g.genre_id = ag.genre_id
       GROUP BY ag.item_id
     ) ig ON ig.item_id = i.item_id
     ${whereClause}
    ORDER BY hi.request_datetime DESC
    LIMIT ${safeOffset}, ${safeLimit}`,
    params
  )

  const hasMore = rows.length > pageSize

  return {
    rows: hasMore ? rows.slice(0, pageSize) : rows,
    page,
    pageSize,
    hasMore,
  }
}

async function getInventoryRows(url) {
  const itemFilters = buildItemOnlyFilters(url, {
    itemAlias: "i",
    itemTypeAlias: "it",
  })
  const borrowFilters = buildBorrowOnlyFilters(url, {
    borrowAlias: "b2",
    itemAlias: "i2",
    userAlias: "ua2",
  })
  const { page, pageSize, offset } = getPagination(url)
  const limit = pageSize + 1
  const safeOffset = Math.max(0, Math.trunc(offset))
  const safeLimit = Math.max(1, Math.trunc(limit))

  const rows = await query(
    `SELECT
       i.item_id AS itemId,
       i.title AS itemName,
       i.created_at AS createdAt,
       it.item_type AS itemType,
       i.is_withdrawn AS isWithdrawn,
       CASE WHEN i.is_withdrawn = 1 THEN 'INACTIVE' ELSE 'ACTIVE' END AS itemStatus,
       i.inventory AS inventory,
       i.monetary_value AS itemValue,
       COALESCE(i.inventory, 0) * COALESCE(i.monetary_value, 0) AS catalogValue,
       COALESCE(bs.totalBorrows, 0) AS totalBorrows,
       COALESCE(bs.activeBorrows, 0) AS activeBorrows,
       COALESCE(bs.overdueActiveBorrows, 0) AS overdueActiveBorrows
     FROM item i
     LEFT JOIN item_type it ON it.item_code = i.item_type_code
     LEFT JOIN (
       SELECT
         b2.item_id,
         COUNT(*) AS totalBorrows,
         SUM(CASE WHEN b2.return_date IS NULL THEN 1 ELSE 0 END) AS activeBorrows,
         SUM(
           CASE
             WHEN b2.return_date IS NULL AND b2.due_date < NOW() THEN 1
             ELSE 0
           END
         ) AS overdueActiveBorrows
       FROM borrow b2
       INNER JOIN item i2 ON i2.item_id = b2.item_id
       LEFT JOIN item_type it2 ON it2.item_code = i2.item_type_code
       INNER JOIN user_account ua2 ON ua2.user_id = b2.user_id
       ${borrowFilters.whereClause}
       GROUP BY b2.item_id
     ) bs ON bs.item_id = i.item_id
     ${itemFilters.whereClause}
     ORDER BY it.item_type ASC, i.title ASC
     LIMIT ${safeOffset}, ${safeLimit}`,
    [...borrowFilters.params, ...itemFilters.params]
  )

  const hasMore = rows.length > pageSize

  return {
    rows: hasMore ? rows.slice(0, pageSize) : rows,
    page,
    pageSize,
    hasMore,
  }
}

function buildBorrowOnlyFilters(url, options = {}) {
  const params = []
  const clauses = []
  const borrowAlias = options.borrowAlias || "b"
  const itemAlias = options.itemAlias || "i"
  const userAlias = options.userAlias || "ua"

  const startDate = String(url.searchParams.get("startDate") || "").trim()
  if (startDate) {
    clauses.push(`${borrowAlias}.checkout_date >= ?`)
    params.push(`${startDate} 00:00:00`)
  }

  const endDate = String(url.searchParams.get("endDate") || "").trim()
  if (endDate) {
    clauses.push(`${borrowAlias}.checkout_date < DATE_ADD(?, INTERVAL 1 DAY)`)
    params.push(endDate)
  }

  const userType = normalizeUserType(url.searchParams.get("userType"))
  if (userType) {
    clauses.push(`${userAlias}.is_faculty = ?`)
    params.push(userType === "FACULTY" ? 1 : 0)
  }

  const itemType = String(url.searchParams.get("itemType") || "").trim()
  if (itemType) {
    clauses.push(`${itemAlias}.item_type_code = (
      SELECT item_code
      FROM item_type
      WHERE item_type = ?
      LIMIT 1
    )`)
    params.push(itemType)
  }

  const genres = parseGenresFilter(url.searchParams.get("genre"))
  if (genres.length) {
    const placeholders = genres.map(() => "?").join(",")
    clauses.push(`EXISTS (
      SELECT 1
      FROM assigned_genres agf
      INNER JOIN genre gf ON gf.genre_id = agf.genre_id
      WHERE agf.item_id = ${itemAlias}.item_id AND gf.genre_text IN (${placeholders})
    )`)
    params.push(...genres)
  }

  const overdue = String(url.searchParams.get("overdue") || "all").trim()
  const overdueExpr = `(
    CASE
      WHEN ${borrowAlias}.return_date IS NULL THEN (${borrowAlias}.due_date < NOW())
      ELSE (${borrowAlias}.return_date > ${borrowAlias}.due_date)
    END
  )`

  if (overdue === "overdue") {
    clauses.push(`${overdueExpr} = 1`)
  }

  if (overdue === "notOverdue") {
    clauses.push(`${overdueExpr} = 0`)
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  }
}

function buildItemOnlyFilters(url, options = {}) {
  const params = []
  const clauses = []
  const itemAlias = options.itemAlias || "i"
  const itemTypeAlias = options.itemTypeAlias || "it"

  const startDate = String(url.searchParams.get("startDate") || "").trim()
  if (startDate) {
    clauses.push(`${itemAlias}.created_at >= ?`)
    params.push(`${startDate} 00:00:00`)
  }

  const endDate = String(url.searchParams.get("endDate") || "").trim()
  if (endDate) {
    clauses.push(`${itemAlias}.created_at < DATE_ADD(?, INTERVAL 1 DAY)`)
    params.push(endDate)
  }

  const itemType = String(url.searchParams.get("itemType") || "").trim()
  if (itemType) {
    clauses.push(`${itemTypeAlias}.item_type = ?`)
    params.push(itemType)
  }

  const itemStatus = String(url.searchParams.get("itemStatus") || "all")
    .trim()
    .toLowerCase()
  if (itemStatus === "active") {
    clauses.push(`${itemAlias}.is_withdrawn = 0`)
  }
  if (itemStatus === "inactive") {
    clauses.push(`${itemAlias}.is_withdrawn = 1`)
  }

  const genres = parseGenresFilter(url.searchParams.get("genre"))
  if (genres.length) {
    const placeholders = genres.map(() => "?").join(",")
    clauses.push(`EXISTS (
      SELECT 1
      FROM assigned_genres agf
      INNER JOIN genre gf ON gf.genre_id = agf.genre_id
      WHERE agf.item_id = ${itemAlias}.item_id AND gf.genre_text IN (${placeholders})
    )`)
    params.push(...genres)
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  }
}

async function getItemAvailabilityStats(url) {
  const itemFilters = buildItemOnlyFilters(url, {
    itemAlias: "i",
    itemTypeAlias: "it",
  })

  const itemsInLibraryRows = await query(
    `SELECT COALESCE(SUM(i.inventory), 0) AS itemsInLibrary
     FROM item i
     LEFT JOIN item_type it ON it.item_code = i.item_type_code
     ${itemFilters.whereClause}`,
    itemFilters.params
  )

  const borrowFilters = buildBorrowOnlyFilters(url, {
    borrowAlias: "b",
    itemAlias: "i",
    userAlias: "ua",
  })
  const activeClause = borrowFilters.whereClause
    ? `${borrowFilters.whereClause} AND b.return_date IS NULL`
    : "WHERE b.return_date IS NULL"

  const itemsCheckedOutRows = await query(
    `SELECT COUNT(*) AS itemsCheckedOut
     FROM borrow b
     INNER JOIN item i ON i.item_id = b.item_id
     LEFT JOIN item_type it ON it.item_code = i.item_type_code
     INNER JOIN user_account ua ON ua.user_id = b.user_id
     ${activeClause}`,
    borrowFilters.params
  )

  return {
    itemsInLibrary: Number(itemsInLibraryRows[0]?.itemsInLibrary || 0),
    itemsCheckedOut: Number(itemsCheckedOutRows[0]?.itemsCheckedOut || 0),
  }
}

function getCheckoutBucketLabel(count) {
  if (count <= 0) return "0 items checked out"
  if (count < 10) return "1-9 items checked out"
  if (count < 50) return "10-49 items checked out"
  return "50+ items checked out"
}

function getBorrowDurationBucketLabel(days) {
  if (days <= 1) return "1 day"
  if (days <= 2) return "2 days"
  if (days <= 5) return "3-5 days"
  if (days <= 10) return "6-10 days"
  return "10+ days"
}

async function getUserDemographicsRows(url) {
  const checkoutFilters = buildBorrowOnlyFilters(url, {
    borrowAlias: "b",
    itemAlias: "i",
    userAlias: "ua",
  })

  const rows = await query(
    `SELECT
       CONCAT(b.item_id, '-', b.user_id, '-', DATE_FORMAT(b.checkout_date, '%Y-%m-%d %H:%i:%s')) AS userBorrowId,
       ua.user_id AS userId,
       CONCAT(ua.first_name, ' ', ua.last_name) AS userName,
       ua.email AS userEmail,
       CASE WHEN ua.is_faculty = 1 THEN 'FACULTY' ELSE 'STUDENT' END AS userType,
       b.item_id AS itemId,
       i.title AS itemName,
       it.item_type AS itemType,
       COALESCE((
         SELECT GROUP_CONCAT(DISTINCT g.genre_text ORDER BY g.genre_text SEPARATOR ', ')
         FROM assigned_genres ag
         INNER JOIN genre g ON g.genre_id = ag.genre_id
         WHERE ag.item_id = i.item_id
       ), '') AS genres,
       b.checkout_date AS checkoutDate,
       b.due_date AS dueDate,
       b.return_date AS returnDate,
       CASE
         WHEN b.return_date IS NULL THEN CASE WHEN b.due_date < NOW() THEN 1 ELSE 0 END
         ELSE CASE WHEN b.return_date > b.due_date THEN 1 ELSE 0 END
       END AS isOverdue,
       GREATEST(
         1,
         TIMESTAMPDIFF(
           DAY,
           b.checkout_date,
           COALESCE(b.return_date, NOW())
         )
       ) AS borrowDays
     FROM borrow b
     INNER JOIN user_account ua ON ua.user_id = b.user_id
     INNER JOIN item i ON i.item_id = b.item_id
     LEFT JOIN item_type it ON it.item_code = i.item_type_code
     ${checkoutFilters.whereClause}
     ORDER BY b.checkout_date DESC, ua.email ASC`,
    checkoutFilters.params
  )

  const checkoutBuckets = {
    "0 items checked out": 0,
    "1-9 items checked out": 0,
    "10-49 items checked out": 0,
    "50+ items checked out": 0,
  }

  const durationBuckets = {
    "1 day": 0,
    "2 days": 0,
    "3-5 days": 0,
    "6-10 days": 0,
    "10+ days": 0,
  }

  const usersById = new Map()

  for (const row of rows) {
    if (!usersById.has(row.userId)) {
      usersById.set(row.userId, 0)
    }

    if (!row.returnDate) {
      usersById.set(row.userId, usersById.get(row.userId) + 1)
    }

    const bucket = getBorrowDurationBucketLabel(Number(row.borrowDays || 1))
    durationBuckets[bucket] += 1
  }

  for (const checkedOutCount of usersById.values()) {
    const bucket = getCheckoutBucketLabel(Number(checkedOutCount || 0))
    checkoutBuckets[bucket] += 1
  }

  const checkoutBucketRows = Object.entries(checkoutBuckets).map(
    ([bucket, count]) => ({
      category: "checkedOutItems",
      bucket,
      count,
    })
  )

  const durationBucketRows = Object.entries(durationBuckets).map(
    ([bucket, count]) => ({
      category: "borrowingTime",
      bucket,
      count,
    })
  )

  return {
    rows: rows.map((row) => ({
      userBorrowId: row.userBorrowId,
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      userType: row.userType,
      itemId: row.itemId,
      itemName: row.itemName,
      itemType: row.itemType,
      genres: row.genres || "",
      checkoutDate: row.checkoutDate,
      dueDate: row.dueDate,
      returnDate: row.returnDate,
      isOverdue: Number(row.isOverdue || 0),
      borrowDays: Number(row.borrowDays || 1),
    })),
    checkoutBuckets: checkoutBucketRows,
    durationBuckets: durationBucketRows,
    totalUsers: usersById.size,
    totalBorrows: rows.length,
  }
}

async function handleGetReports(_req, res, url) {
  try {
    const reportType = String(
      url.searchParams.get("reportType") || "itemsCheckedOut"
    )

    const staffIdValue = Number(url.searchParams.get("staffId"))
    const staffId =
      Number.isFinite(staffIdValue) && staffIdValue > 0 ? staffIdValue : null

    if (staffId) {
      await query(
        `INSERT INTO report_generated (staff_id, report_type)
         SELECT ?, rt.report_type_id
         FROM report_types rt
         WHERE rt.report_type = ?
         LIMIT 1`,
        [staffId, reportType]
      )
    }

    if (reportType === "itemsCheckedOut") {
      const availability = await getItemAvailabilityStats(url)
      const { rows, page, pageSize, hasMore } = await getCheckedOutRows(url)
      const overdueCount = rows.filter(
        (row) => Number(row.isOverdue) === 1
      ).length

      sendJson(res, 200, {
        ok: true,
        reportType,
        rows,
        summary: {
          totalRecords: rows.length,
          overdueCount,
          itemsInLibrary: availability.itemsInLibrary,
          itemsCheckedOut: availability.itemsCheckedOut,
          page,
          pageSize,
          hasMore,
        },
      })
      return
    }

    if (reportType === "revenue" || reportType === "finesOwed") {
      const availability = await getItemAvailabilityStats(url)
      const { rows, page, pageSize, hasMore } = await getRevenueRows(url)
      const totalFineOwed = rows.reduce(
        (sum, row) => sum + Number(row.fineOwed || 0),
        0
      )
      const totalItemValue = rows.reduce(
        (sum, row) => sum + Number(row.itemValue || 0),
        0
      )
      const totalRevenue = rows.reduce(
        (sum, row) => sum + Number(row.revenueAmount || 0),
        0
      )

      sendJson(res, 200, {
        ok: true,
        reportType: "revenue",
        rows,
        summary: {
          totalRecords: rows.length,
          totalFineOwed,
          totalItemValue,
          totalRevenue,
          itemsInLibrary: availability.itemsInLibrary,
          itemsCheckedOut: availability.itemsCheckedOut,
          page,
          pageSize,
          hasMore,
        },
      })
      return
    }

    if (reportType === "userDemographics") {
      const availability = await getItemAvailabilityStats(url)
      const {
        rows,
        checkoutBuckets,
        durationBuckets,
        totalUsers,
        totalBorrows,
      } = await getUserDemographicsRows(url)

      sendJson(res, 200, {
        ok: true,
        reportType,
        rows,
        summary: {
          totalRecords: rows.length,
          totalUsers,
          totalBorrows,
          checkoutBuckets,
          durationBuckets,
          itemsInLibrary: availability.itemsInLibrary,
          itemsCheckedOut: availability.itemsCheckedOut,
          page: 1,
          pageSize: rows.length,
          hasMore: false,
        },
      })
      return
    }

    if (reportType === "holds") {
      const availability = await getItemAvailabilityStats(url)
      const { rows, page, pageSize, hasMore } = await getHoldsRows(url)
      const totalActiveHolds = rows.filter(
        (row) => String(row.holdStatus) === "ACTIVE"
      ).length
      const totalGraceHolds = rows.filter(
        (row) => String(row.holdStatus) === "GRACE"
      ).length
      const totalFulfilledHolds = rows.filter(
        (row) => String(row.holdStatus) === "FULFILLED"
      ).length
      const totalCanceledHolds = rows.filter(
        (row) => String(row.holdStatus) === "CANCELED"
      ).length
      const averageWaitHours = rows.length
        ? rows.reduce((sum, row) => sum + Number(row.waitHours || 0), 0) /
          rows.length
        : 0
      const fulfillmentRate = rows.length
        ? (totalFulfilledHolds / rows.length) * 100
        : 0

      sendJson(res, 200, {
        ok: true,
        reportType,
        rows,
        summary: {
          totalRecords: rows.length,
          totalActiveHolds,
          totalGraceHolds,
          totalFulfilledHolds,
          totalCanceledHolds,
          averageWaitHours,
          fulfillmentRate,
          itemsInLibrary: availability.itemsInLibrary,
          itemsCheckedOut: availability.itemsCheckedOut,
          page,
          pageSize,
          hasMore,
        },
      })
      return
    }

    if (reportType === "inventory") {
      const { rows, page, pageSize, hasMore } = await getInventoryRows(url)
      const totalCatalogValue = rows.reduce(
        (sum, row) => sum + Number(row.catalogValue || 0),
        0
      )
      const totalInventoryUnits = rows.reduce(
        (sum, row) => sum + Number(row.inventory || 0),
        0
      )
      const totalActiveBorrows = rows.reduce(
        (sum, row) => sum + Number(row.activeBorrows || 0),
        0
      )
      const totalOverdueActiveBorrows = rows.reduce(
        (sum, row) => sum + Number(row.overdueActiveBorrows || 0),
        0
      )
      const totalActiveItems = rows.filter(
        (row) => Number(row.isWithdrawn || 0) === 0
      ).length
      const totalInactiveItems = rows.filter(
        (row) => Number(row.isWithdrawn || 0) === 1
      ).length
      const totalActiveUnits = rows.reduce(
        (sum, row) =>
          sum +
          (Number(row.isWithdrawn || 0) === 0 ? Number(row.inventory || 0) : 0),
        0
      )
      const totalInactiveUnits = rows.reduce(
        (sum, row) =>
          sum +
          (Number(row.isWithdrawn || 0) === 1 ? Number(row.inventory || 0) : 0),
        0
      )

      sendJson(res, 200, {
        ok: true,
        reportType,
        rows,
        summary: {
          totalRecords: rows.length,
          totalCatalogValue,
          totalInventoryUnits,
          totalActiveBorrows,
          totalOverdueActiveBorrows,
          totalActiveItems,
          totalInactiveItems,
          totalActiveUnits,
          totalInactiveUnits,
          page,
          pageSize,
          hasMore,
        },
      })
      return
    }

    sendJson(res, 400, { ok: false, message: "Invalid reportType." })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to generate report.",
      error: error.message,
    })
  }
}

module.exports = {
  handleGetReports,
}
