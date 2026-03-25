function normalizeReportType(value = "") {
  const reportType = String(value).trim()
  if (reportType === "itemsCheckedOut" || reportType === "finesOwed") return reportType
  return ""
}

function normalizeFilterUserType(value = "") {
  const userType = String(value).trim().toUpperCase()
  if (userType === "STUDENT" || userType === "FACULTY") return userType
  return ""
}

function normalizeFilterGenreId(value = "") {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function normalizeOverdueFilter(value = "") {
  const normalized = String(value).trim()
  if (normalized === "overdue" || normalized === "notOverdue") return normalized
  return "all"
}

function createBuildReportFilters({ parseNullableString, normalizeItemType }) {
  return function buildReportFilters(body, dateColumn, withOverdue = true) {
    const whereClauses = []
    const params = []
    const startDate = parseNullableString(body.startDate)
    const endDate = parseNullableString(body.endDate)
    const userType = normalizeFilterUserType(body.userType)
    const itemType = normalizeItemType(body.itemType)
    const genre = String(body.genre || "").trim()
    const genreId = normalizeFilterGenreId(genre)
    const overdue = normalizeOverdueFilter(body.overdue)

    if (startDate) {
      whereClauses.push(`DATE(${dateColumn}) >= ?`)
      params.push(startDate)
    }
    if (endDate) {
      whereClauses.push(`DATE(${dateColumn}) <= ?`)
      params.push(endDate)
    }
    if (userType) {
      whereClauses.push("ut.user_type = ?")
      params.push(userType)
    }
    if (itemType) {
      whereClauses.push("it.item_type = ?")
      params.push(itemType)
    }
    if (genreId) {
      whereClauses.push("g.genre_id = ?")
      params.push(genreId)
    }
    if (withOverdue && overdue === "overdue") {
      whereClauses.push("b.return_date IS NULL AND b.due_date < NOW()")
    } else if (withOverdue && overdue === "notOverdue") {
      whereClauses.push("NOT (b.return_date IS NULL AND b.due_date < NOW())")
    }

    return { whereClauses, params }
  }
}

function createManagementReportsHandler({
  parseJsonBody,
  parseNullableString,
  normalizeItemType,
  query,
  sendJson,
}) {
  const buildReportFilters = createBuildReportFilters({
    parseNullableString,
    normalizeItemType,
  })

  return async function handleManagementReports(req, res) {
    try {
      const body = await parseJsonBody(req)
      const reportType = normalizeReportType(body.reportType)
      if (!reportType) {
        sendJson(res, 400, { ok: false, message: "Invalid report type." })
        return
      }

      if (reportType === "itemsCheckedOut") {
        const { whereClauses, params } = buildReportFilters(body, "b.checkout_date")
        const whereSql = ["b.return_date IS NULL", ...whereClauses].join(" AND ")
        const rows = await query(
          `SELECT
             b.borrow_transaction_id AS borrowTransactionId,
             it.item_type AS itemType,
             ut.user_type AS userType,
             b.borrower_id AS borrowerId,
             b.checkout_date AS checkoutDate,
             b.due_date AS dueDate,
             COALESCE(book.title, video.video_name, audio.audio_name, rental.rental_name) AS itemName,
             COALESCE(g.genre_name, 'Not applicable') AS genreName,
             COALESCE(
               CONCAT_WS(' ', su.first_name, su.middle_name, su.last_name),
               CONCAT_WS(' ', fu.first_name, fu.middle_name, fu.last_name)
             ) AS borrowerName,
             CASE WHEN b.due_date < NOW() THEN 1 ELSE 0 END AS isOverdue
           FROM borrow b
           JOIN item_type it ON it.item_code = b.item_type_code
           JOIN user_type ut ON ut.user_code = b.borrower_type
           LEFT JOIN book ON b.item_type_code = 1 AND b.item_id = book.book_id
           LEFT JOIN video ON b.item_type_code = 2 AND b.item_id = video.video_id
           LEFT JOIN audio ON b.item_type_code = 3 AND b.item_id = audio.audio_id
           LEFT JOIN rental_equipment rental ON b.item_type_code = 4 AND b.item_id = rental.equipment_id
           LEFT JOIN genre g ON g.genre_id = COALESCE(book.genre_id, video.genre_id, audio.genre_id)
           LEFT JOIN student_user su ON b.borrower_type = 1 AND b.borrower_id = su.student_id
           LEFT JOIN faculty_user fu ON b.borrower_type = 2 AND b.borrower_id = fu.faculty_id
           WHERE ${whereSql}
           ORDER BY b.checkout_date DESC`,
          params
        )

        sendJson(res, 200, {
          ok: true,
          reportType,
          summary: {
            totalRecords: rows.length,
            overdueCount: rows.filter((row) => Number(row.isOverdue) === 1).length,
          },
          rows,
        })
        return
      }

      const { whereClauses, params } = buildReportFilters(body, "f.date_assigned")
      const whereSql = ["f.is_paid = 0", ...whereClauses].join(" AND ")
      const rows = await query(
        `SELECT
           f.fine_id AS fineId,
           f.amount AS amount,
           f.fine_reason AS fineReason,
           f.date_assigned AS dateAssigned,
           b.borrow_transaction_id AS borrowTransactionId,
           it.item_type AS itemType,
           ut.user_type AS userType,
           b.borrower_id AS borrowerId,
           COALESCE(book.title, video.video_name, audio.audio_name, rental.rental_name) AS itemName,
           COALESCE(g.genre_name, 'Not applicable') AS genreName,
           COALESCE(
             CONCAT_WS(' ', su.first_name, su.middle_name, su.last_name),
             CONCAT_WS(' ', fu.first_name, fu.middle_name, fu.last_name)
           ) AS borrowerName,
           CASE WHEN b.return_date IS NULL AND b.due_date < NOW() THEN 1 ELSE 0 END AS isOverdue
         FROM fined_for f
         JOIN borrow b ON b.borrow_transaction_id = f.borrow_transaction_id
         JOIN item_type it ON it.item_code = b.item_type_code
         JOIN user_type ut ON ut.user_code = b.borrower_type
         LEFT JOIN book ON b.item_type_code = 1 AND b.item_id = book.book_id
         LEFT JOIN video ON b.item_type_code = 2 AND b.item_id = video.video_id
         LEFT JOIN audio ON b.item_type_code = 3 AND b.item_id = audio.audio_id
         LEFT JOIN rental_equipment rental ON b.item_type_code = 4 AND b.item_id = rental.equipment_id
         LEFT JOIN genre g ON g.genre_id = COALESCE(book.genre_id, video.genre_id, audio.genre_id)
         LEFT JOIN student_user su ON b.borrower_type = 1 AND b.borrower_id = su.student_id
         LEFT JOIN faculty_user fu ON b.borrower_type = 2 AND b.borrower_id = fu.faculty_id
         WHERE ${whereSql}
         ORDER BY f.date_assigned DESC`,
        params
      )

      sendJson(res, 200, {
        ok: true,
        reportType,
        summary: {
          totalRecords: rows.length,
          totalAmount: rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
        },
        rows,
      })
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        message: "Failed to generate report.",
        error: error.message,
      })
    }
  }
}

module.exports = {
  createManagementReportsHandler,
}
