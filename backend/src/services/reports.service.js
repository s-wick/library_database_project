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
       ua.user_id AS userId,
       CONCAT(ua.first_name, ' ', ua.last_name) AS userName,
       ua.email AS userEmail,
       CASE WHEN ua.is_faculty = 1 THEN 'FACULTY' ELSE 'STUDENT' END AS userType,
       COALESCE(SUM(CASE WHEN b.return_date IS NULL THEN 1 ELSE 0 END), 0) AS checkedOutCount,
       COALESCE(COUNT(b.item_id), 0) AS totalBorrowCount,
       ROUND(
         AVG(
           CASE
             WHEN b.item_id IS NULL THEN NULL
             ELSE GREATEST(
               1,
               TIMESTAMPDIFF(
                 DAY,
                 b.checkout_date,
                 COALESCE(b.return_date, NOW())
               )
             )
           END
         ),
         1
       ) AS avgBorrowDays,
       GROUP_CONCAT(DISTINCT NULLIF(it.item_type, '') ORDER BY it.item_type SEPARATOR ', ') AS itemTypesSummary,
       GROUP_CONCAT(DISTINCT NULLIF(g.genre_text, '') ORDER BY g.genre_text SEPARATOR ', ') AS genresSummary,
       MAX(
         CASE
           WHEN b.item_id IS NULL THEN 0
           WHEN b.return_date IS NULL THEN CASE WHEN b.due_date < NOW() THEN 1 ELSE 0 END
           ELSE CASE WHEN b.return_date > b.due_date THEN 1 ELSE 0 END
         END
       ) AS hasOverdueBorrow
     FROM user_account ua
     LEFT JOIN borrow b
       ON b.user_id = ua.user_id
     LEFT JOIN item i ON i.item_id = b.item_id
     LEFT JOIN item_type it ON it.item_code = i.item_type_code
     LEFT JOIN assigned_genres ag ON ag.item_id = i.item_id
     LEFT JOIN genre g ON g.genre_id = ag.genre_id
     ${checkoutFilters.whereClause}
     GROUP BY ua.user_id, ua.first_name, ua.last_name, ua.email, ua.is_faculty
     ORDER BY checkedOutCount DESC, totalBorrowCount DESC, ua.email ASC`,
    checkoutFilters.params
  )

  const checkoutBuckets = {
    "0 items checked out": 0,
    "1-9 items checked out": 0,
    "10-49 items checked out": 0,
    "50+ items checked out": 0,
  }

  for (const row of rows) {
    const bucket = getCheckoutBucketLabel(Number(row.checkedOutCount || 0))
    checkoutBuckets[bucket] += 1
  }

  const borrowFilters = buildBorrowOnlyFilters(url, {
    borrowAlias: "b",
    itemAlias: "i",
    userAlias: "ua",
  })

  const borrowDurations = await query(
    `SELECT
       GREATEST(
         1,
         TIMESTAMPDIFF(
           DAY,
           b.checkout_date,
           COALESCE(b.return_date, NOW())
         )
       ) AS durationDays
     FROM borrow b
     INNER JOIN user_account ua ON ua.user_id = b.user_id
     INNER JOIN item i ON i.item_id = b.item_id
     ${borrowFilters.whereClause}`,
    borrowFilters.params
  )

  const durationBuckets = {
    "1 day": 0,
    "2 days": 0,
    "3-5 days": 0,
    "6-10 days": 0,
    "10+ days": 0,
  }

  for (const row of borrowDurations) {
    const bucket = getBorrowDurationBucketLabel(Number(row.durationDays || 1))
    durationBuckets[bucket] += 1
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
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      userType: row.userType,
      itemTypesSummary: row.itemTypesSummary || "",
      genresSummary: row.genresSummary || "",
      hasOverdueBorrow: Number(row.hasOverdueBorrow || 0),
      checkedOutCount: Number(row.checkedOutCount || 0),
      totalBorrowCount: Number(row.totalBorrowCount || 0),
      borrowDays:
        row.avgBorrowDays === null ? null : Math.round(Number(row.avgBorrowDays)),
    })),
    checkoutBuckets: checkoutBucketRows,
    durationBuckets: durationBucketRows,
    totalUsers: rows.length,
    totalBorrows: borrowDurations.length,
  }
}

async function handleGetReports(_req, res, url) {
  try {
    const reportType = String(
      url.searchParams.get("reportType") || "itemsCheckedOut"
    )

    if (reportType === "itemsCheckedOut") {
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
          page,
          pageSize,
          hasMore,
        },
      })
      return
    }

    if (reportType === "revenue" || reportType === "finesOwed") {
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
          page,
          pageSize,
          hasMore,
        },
      })
      return
    }

    if (reportType === "userDemographics") {
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
          page: 1,
          pageSize: rows.length,
          hasMore: false,
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
