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

function buildUserSearchFilters(url) {
  const params = []
  const clauses = []

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

  const availability = String(url.searchParams.get("availability") || "")
    .trim()
    .toLowerCase()
  if (availability === "available") {
    clauses.push("i.items_in_stock > 0")
  }
  if (availability === "notavailable") {
    clauses.push("i.items_in_stock <= 0")
  }

  const name = String(url.searchParams.get("name") || "").trim()
  if (name) {
    clauses.push("i.title LIKE ?")
    params.push(`%${name}%`)
  }

  const author = String(url.searchParams.get("author") || "").trim()
  if (author) {
    clauses.push("COALESCE(bk.author, '') LIKE ?")
    params.push(`%${author}%`)
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  }
}

async function getCheckedOutRows(url) {
  const { whereClause, params } = buildWhereFilters(url)

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
     LIMIT 500`,
    params
  )

  return rows
}

async function getFineRows(url) {
  const { whereClause, params } = buildWhereFilters(url)

  const rows = await query(
    `SELECT
       CONCAT(ff.item_id, '-', ff.user_id, '-', DATE_FORMAT(ff.checkout_date, '%Y-%m-%d %H:%i:%s')) AS fineId,
       ff.item_id AS itemId,
       ff.user_id AS borrowerId,
       i.title AS itemName,
       it.item_type AS itemType,
       CASE WHEN ua.is_faculty = 1 THEN 'FACULTY' ELSE 'STUDENT' END AS userType,
       CONCAT(ua.first_name, ' ', ua.last_name) AS borrowerName,
       ua.email AS borrowerEmail,
       ff.amount AS amount,
       ff.amount_paid AS amountPaid,
       'Overdue item' AS fineReason,
       ff.checkout_date AS dateAssigned,
       b.checkout_date AS checkoutDate,
       b.due_date AS dueDate,
       b.return_date AS returnDate,
       CASE
         WHEN b.return_date IS NULL THEN CASE WHEN b.due_date < NOW() THEN 1 ELSE 0 END
         ELSE CASE WHEN b.return_date > b.due_date THEN 1 ELSE 0 END
       END AS isOverdue,
       COALESCE(ig.genres, '') AS genres
     FROM fined_for ff
     INNER JOIN borrow b
       ON b.item_id = ff.item_id
      AND b.user_id = ff.user_id
      AND b.checkout_date = ff.checkout_date
     INNER JOIN item i ON i.item_id = ff.item_id
     LEFT JOIN item_type it ON it.item_code = i.item_type_code
     INNER JOIN user_account ua ON ua.user_id = ff.user_id
     LEFT JOIN (
       SELECT
         ag.item_id,
         GROUP_CONCAT(DISTINCT g.genre_text ORDER BY g.genre_text SEPARATOR ', ') AS genres
       FROM assigned_genres ag
       INNER JOIN genre g ON g.genre_id = ag.genre_id
       GROUP BY ag.item_id
     ) ig ON ig.item_id = i.item_id
     ${whereClause}
     ORDER BY ff.checkout_date DESC
     LIMIT 500`,
    params
  )

  return rows
}

async function getUserSearchRows(url) {
  const { whereClause, params } = buildUserSearchFilters(url)

  const rows = await query(
    `SELECT
       i.item_id AS itemId,
       i.title AS itemName,
       it.item_type AS itemType,
       bk.author AS author,
       i.items_in_stock AS inStock,
       CASE WHEN i.items_in_stock > 0 THEN 'Available' ELSE 'Not Available' END AS availability,
       COALESCE(ig.genres, '') AS genres
     FROM item i
     LEFT JOIN item_type it ON it.item_code = i.item_type_code
     LEFT JOIN book bk ON bk.item_id = i.item_id
     LEFT JOIN (
       SELECT
         ag.item_id,
         GROUP_CONCAT(DISTINCT g.genre_text ORDER BY g.genre_text SEPARATOR ', ') AS genres
       FROM assigned_genres ag
       INNER JOIN genre g ON g.genre_id = ag.genre_id
       GROUP BY ag.item_id
     ) ig ON ig.item_id = i.item_id
     ${whereClause}
     ORDER BY i.title ASC
     LIMIT 500`,
    params
  )

  return rows
}

async function handleGetReports(_req, res, url) {
  try {
    const reportType = String(
      url.searchParams.get("reportType") || "itemsCheckedOut"
    )

    if (reportType === "itemsCheckedOut") {
      const rows = await getCheckedOutRows(url)
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
        },
      })
      return
    }

    if (reportType === "finesOwed") {
      const rows = await getFineRows(url)
      const totalAmount = rows.reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0
      )

      sendJson(res, 200, {
        ok: true,
        reportType,
        rows,
        summary: {
          totalRecords: rows.length,
          totalAmount,
        },
      })
      return
    }

    if (reportType === "userItemSearch") {
      const rows = await getUserSearchRows(url)

      sendJson(res, 200, {
        ok: true,
        reportType,
        rows,
        summary: {
          totalRecords: rows.length,
          availableCount: rows.filter((row) => Number(row.inStock) > 0).length,
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
