const http = require("node:http")
require("dotenv").config()
const { query, testConnection } = require("./db")

const port = Number(process.env.PORT || 4000)
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://127.0.0.1:5173"]

const allowedOrigins = new Set(envOrigins)


function isAllowedOrigin(origin) {
  if (!origin) return false
  if (allowedOrigins.has(origin)) return true

  // Allow local dev frontends even if Vite picks a different port.
  return (
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
  )
}

function normalizeRoleGroup(roleGroup = "") {
  const value = String(roleGroup).trim()
  if (value === "adminStaff" || value === "studentFaculty") return value
  return ""
}

function normalizeRole(role = "") {
  const value = String(role).trim().toLowerCase()
  if (value === "system_administrator") return "admin"
  return value
}

const ROLE_DEFINITIONS = {
  adminStaff: {
    roles: {
      admin: {
        aliases: ["system_administrator"],
        responseRole: "admin",
        hierarchy: 2,
        table: "system_administrator",
        idColumn: "administrator_id",
        duplicateMessage: "Email already exists for admin.",
        createdMessage: "Admin account created.",
        invalidCredentialsMessage: "Invalid admin credentials.",
      },
      staff: {
        aliases: ["librarian"],
        responseRole: "staff",
        hierarchy: 1,
        table: "librarian",
        idColumn: "librarian_id",
        duplicateMessage: "Email already exists for staff.",
        createdMessage: "Staff account created.",
        invalidCredentialsMessage: "Invalid staff credentials.",
      },
    },
  },
  studentFaculty: {
    roles: {
      student: {
        aliases: [],
        responseRole: "student",
        hierarchy: 1,
        table: "student_user",
        idColumn: "student_id",
        duplicateMessage: "Email already exists for student.",
        createdMessage: "Student account created.",
        invalidCredentialsMessage: "Invalid student credentials.",
        userTypeCode: 1,
        idStrategy: "student",
      },
      faculty: {
        aliases: [],
        responseRole: "faculty",
        hierarchy: 1,
        table: "faculty_user",
        idColumn: "faculty_id",
        duplicateMessage: "Email already exists for faculty.",
        createdMessage: "Faculty account created.",
        invalidCredentialsMessage: "Invalid faculty credentials.",
        userTypeCode: 2,
      },
    },
  },
}

function normalizeUserTypeCode(userTypeInput) {
  const value = String(userTypeInput || "")
    .trim()
    .toLowerCase()

  if (value === "1" || value === "student") return 1
  if (value === "2" || value === "faculty") return 2
  return null
}

function getUserProfileConfig(userTypeCode) {
  if (userTypeCode === 1) {
    return {
      table: "student_user",
      idColumn: "student_id",
      role: "student",
    }
  }

  if (userTypeCode === 2) {
    return {
      table: "faculty_user",
      idColumn: "faculty_id",
      role: "faculty",
    }
  }

  return null
}


function resolveRoleContext(roleGroupInput, roleInput) {
  const roleGroup = normalizeRoleGroup(roleGroupInput)
  const groupConfig = ROLE_DEFINITIONS[roleGroup]
  if (!groupConfig) return null

  const normalizedRole = normalizeRole(roleInput)
  let roleKey = normalizedRole

  if (!groupConfig.roles[roleKey]) {
    const matchedKey = Object.keys(groupConfig.roles).find((key) =>
      groupConfig.roles[key].aliases.includes(normalizedRole)
    )
    if (matchedKey) roleKey = matchedKey
  }

  const roleConfig = groupConfig.roles[roleKey]
  if (!roleConfig) return null

  return {
    roleGroup,
    roleKey,
    roleConfig,
  }
}

async function getNextNumericId(tableName, columnName) {
  const rows = await query(
    `SELECT COALESCE(MAX(${columnName}), 0) + 1 AS nextId FROM ${tableName}`
  )
  return rows[0].nextId
}

function generateStudentId() {
  const randomPart = Math.floor(Math.random() * 1_000_000_000_000)
    .toString()
    .padStart(12, "0")
  return `S${randomPart}`.slice(0, 15)
}

function writeCorsHeaders(req, res) {
  const origin = req.headers.origin

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS")

  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk.toString()
      if (body.length > 1_000_000) {
        reject(new Error("Payload too large"))
        req.destroy()
      }
    })
    req.on("end", () => {
      if (!body) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error("Invalid JSON body"))
      }
    })
    req.on("error", reject)
  })
}

const DAILY_FINE_AMOUNT = Number(process.env.DAILY_FINE_AMOUNT || 1)

async function syncOverdueFinesForBorrower(borrowerId, borrowerType = 1) {
  if (!borrowerId) return

  const overdueBorrows = await query(
    `SELECT
       b.borrow_transaction_id,
       GREATEST(TIMESTAMPDIFF(DAY, b.due_date, NOW()), 0) AS days_overdue
     FROM borrow b
     WHERE b.borrower_type = ?
       AND b.borrower_id = ?
       AND b.return_date IS NULL
       AND b.due_date < NOW()`,
    [borrowerType, borrowerId]
  )

  for (const borrow of overdueBorrows) {
    const daysOverdue = Number(borrow.days_overdue || 0)
    const nextAmount = daysOverdue * DAILY_FINE_AMOUNT

    if (nextAmount <= 0) continue

    const existingRows = await query(
      `SELECT fine_id, amount, is_paid
       FROM fined_for
       WHERE borrow_transaction_id = ?
       ORDER BY fine_id DESC
       LIMIT 1`,
      [borrow.borrow_transaction_id]
    )

    if (!existingRows.length) {
      await query(
        `INSERT INTO fined_for (borrow_transaction_id, amount, fine_reason, date_assigned, is_paid)
         VALUES (?, ?, ?, NOW(), 0)`,
        [
          borrow.borrow_transaction_id,
          nextAmount,
          `Overdue by ${daysOverdue} day(s)`,
        ]
      )
      continue
    }

    const currentFine = existingRows[0]
    const isPaid = Number(currentFine.is_paid) === 1

    if (isPaid) {
      await query(
        `INSERT INTO fined_for (borrow_transaction_id, amount, fine_reason, date_assigned, is_paid)
         VALUES (?, ?, ?, NOW(), 0)`,
        [
          borrow.borrow_transaction_id,
          nextAmount,
          `Overdue by ${daysOverdue} day(s)`,
        ]
      )
      continue
    }

    if (Number(currentFine.amount) !== nextAmount) {
      await query(
        `UPDATE fined_for
         SET amount = ?, fine_reason = ?, date_assigned = NOW()
         WHERE fine_id = ?`,
        [nextAmount, `Overdue by ${daysOverdue} day(s)`, currentFine.fine_id]
      )
    }
  }
}

async function syncOverdueFinesForAllStudents() {
  const overdueStudents = await query(
    `SELECT DISTINCT b.borrower_id, b.borrower_type
     FROM borrow b
     WHERE b.return_date IS NULL
       AND b.due_date < NOW()`
  )

  for (const row of overdueStudents) {
    await syncOverdueFinesForBorrower(row.borrower_id, row.borrower_type)
  }

  return overdueStudents.length
}


async function handleHealth(_req, res) {
  try {
    const isConnected = await testConnection()
    if (!isConnected) {
      sendJson(res, 500, { ok: false, message: "Database not ready." })
      return
    }

    sendJson(res, 200, {
      ok: true,
      message: "Backend and MySQL are connected.",
      database: process.env.DB_NAME,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Database connection failed.",
      error: error.message,
    })
  }
}

async function handleSignup(req, res) {
  try {
    const body = await parseJsonBody(req)
    const roleContext = resolveRoleContext(body.roleGroup, body.role)
    const email = String(body.email || "")
      .trim()
      .toLowerCase()
    const password = String(body.password || "")
    const firstName = String(body.firstName || "").trim() || null
    const middleName = String(body.middleName || "").trim() || null
    const lastName = String(body.lastName || "").trim() || null

    if (!email || !password) {
      sendJson(res, 400, {
        ok: false,
        message: "Email and password are required.",
      })
      return
    }

    if (!roleContext) {
      sendJson(res, 400, {
        ok: false,
        message: "Invalid roleGroup/role combination.",
      })
      return
    }

    if (roleContext.roleGroup === "adminStaff") {
      sendJson(res, 403, {
        ok: false,
        message: "Admin and staff accounts cannot be created from this page.",
      })
      return
    }

    const { roleGroup, roleConfig } = roleContext

    const existing = await query(
      `SELECT ${roleConfig.idColumn} FROM ${roleConfig.table} WHERE email = ? LIMIT 1`,
      [email]
    )
    if (existing.length) {
      sendJson(res, 409, { ok: false, message: roleConfig.duplicateMessage })
      return
    }

    let createdId
    if (roleConfig.idStrategy === "student") {
      createdId = generateStudentId()
    } else {
      createdId = await getNextNumericId(roleConfig.table, roleConfig.idColumn)
    }

    if (typeof roleConfig.userTypeCode === "number") {
      await query(
        `INSERT INTO ${roleConfig.table} (${roleConfig.idColumn}, email, password, user_type_code, first_name, middle_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          createdId,
          email,
          password,
          roleConfig.userTypeCode,
          firstName,
          middleName,
          lastName,
        ]
      )
    } else {
      await query(
        `INSERT INTO ${roleConfig.table} (${roleConfig.idColumn}, email, password, first_name, middle_name, last_name) VALUES (?, ?, ?, ?, ?, ?)`,
        [createdId, email, password, firstName, middleName, lastName]
      )
    }

    sendJson(res, 201, {
      ok: true,
      message: roleConfig.createdMessage,
      user: {
        roleGroup,
        role: roleConfig.responseRole,
        hierarchy: roleConfig.hierarchy,
        id: createdId,
        email,
        firstName,
        middleName,
        lastName,
      },
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Signup failed.",
      error: error.message,
    })
  }
}

async function handleSignin(req, res) {
  try {
    const body = await parseJsonBody(req)
    const roleContext = resolveRoleContext(body.roleGroup, body.role)
    const email = String(body.email || "")
      .trim()
      .toLowerCase()
    const password = String(body.password || "")

    if (!email || !password) {
      sendJson(res, 400, {
        ok: false,
        message: "Email and password are required.",
      })
      return
    }

    if (!roleContext) {
      sendJson(res, 400, {
        ok: false,
        message: "Invalid roleGroup/role combination.",
      })
      return
    }

    const { roleGroup, roleConfig } = roleContext
    const rows = await query(
      `SELECT ${roleConfig.idColumn} AS id, email FROM ${roleConfig.table} WHERE email = ? AND password = ? LIMIT 1`,
      [email, password]
    )
    if (!rows.length) {
      sendJson(res, 401, {
        ok: false,
        message: roleConfig.invalidCredentialsMessage,
      })
      return
    }

    sendJson(res, 200, {
      ok: true,
      message: "Sign in successful.",
      user: {
        roleGroup,
        role: roleConfig.responseRole,
        userTypeCode: roleConfig.userTypeCode || null,
        hierarchy: roleConfig.hierarchy,
        id: rows[0].id,
        email: rows[0].email,
      },
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Signin failed.",
      error: error.message,
    })
  }
}


async function handleGetStudent(res, studentId) {
  try {
    const rows = await query(
      `SELECT student_id, email, created_at, first_name, last_name
       FROM student_user
       WHERE student_id = ?
       LIMIT 1`,
      [studentId]
    )

    if (!rows.length) {
      sendJson(res, 404, { ok: false, message: "Student not found." })
      return
    }

    sendJson(res, 200, rows[0])
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to load student.",
      error: error.message,
    })
  }
}

async function handleGetUserProfile(res, userId, userTypeCode) {
  try {
    const profileConfig = getUserProfileConfig(userTypeCode)

    if (!profileConfig) {
      sendJson(res, 400, {
        ok: false,
        message: "Invalid user_type. Use 1/student or 2/faculty.",
      })
      return
    }

    const rows = await query(
      `SELECT
         ${profileConfig.idColumn} AS user_id,
         email,
         created_at,
         first_name,
         middle_name,
         last_name,
         borrowed_items,
         fines,
         user_type_code
       FROM ${profileConfig.table}
       WHERE ${profileConfig.idColumn} = ?
       LIMIT 1`,
      [userId]
    )

    if (!rows.length) {
      sendJson(res, 404, { ok: false, message: "User not found." })
      return
    }

    sendJson(res, 200, {
      ...rows[0],
      role: profileConfig.role,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to load user profile.",
      error: error.message,
    })
  }
}

async function handleGetBorrows(res, borrowerId, borrowerType) {
  try {
    await syncOverdueFinesForBorrower(borrowerId, borrowerType)

    const rows = await query(
      `SELECT
         b.borrow_transaction_id,
         b.item_type_code,
         b.item_id,
         b.borrower_type,
         b.borrower_id,
         b.checkout_date,
         b.due_date,
         b.return_date,
         COALESCE(book.title, video.video_name, audio.audio_name, rental.rental_name) AS item_title,
         COALESCE(book.author, 'Library Media') AS item_author,
         LOWER(it.item_type) AS item_genre,
         NULL AS cover_color
       FROM borrow b
       LEFT JOIN item_type it ON b.item_type_code = it.item_code
       LEFT JOIN book ON b.item_type_code = 1 AND b.item_id = book.book_id
       LEFT JOIN video ON b.item_type_code = 2 AND b.item_id = video.video_id
       LEFT JOIN audio ON b.item_type_code = 3 AND b.item_id = audio.audio_id
       LEFT JOIN rental_equipment rental ON b.item_type_code = 4 AND b.item_id = rental.equipment_id
       WHERE b.borrower_type = ? AND b.borrower_id = ?
       ORDER BY b.checkout_date DESC`,
      [borrowerType, borrowerId]
    )

    sendJson(res, 200, rows)
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to load borrows.",
      error: error.message,
    })
  }
}

async function handleGetHolds(res, userId, userTypeCode) {
  try {
    const rows = await query(
      `SELECT
         h.hold_id,
         h.item_id,
         h.user_type,
         h.user_id,
         h.request_date,
         h.hold_status,
         h.queue_position,
         COALESCE(book.title, video.video_name, audio.audio_name, rental.rental_name) AS item_title,
         COALESCE(book.author, 'Library Media') AS item_author
       FROM hold_item h
       LEFT JOIN book ON h.item_id = book.book_id
       LEFT JOIN video ON h.item_id = video.video_id
       LEFT JOIN audio ON h.item_id = audio.audio_id
       LEFT JOIN rental_equipment rental ON h.item_id = rental.equipment_id
       WHERE h.user_type = ? AND h.user_id = ?
       ORDER BY h.request_date DESC`,
      [userTypeCode, userId]
    )

    sendJson(res, 200, rows)
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to load holds.",
      error: error.message,
    })
  }
}

async function handlePatchHold(req, res, holdId) {
  try {
    const body = await parseJsonBody(req)
    const allowedStatuses = new Set(["active", "fulfilled", "cancelled"])
    const nextStatus = String(body.hold_status || "")

    if (!allowedStatuses.has(nextStatus)) {
      sendJson(res, 400, {
        ok: false,
        message: "Invalid hold_status. Use active, fulfilled, or cancelled.",
      })
      return
    }

    const result = await query(
      `UPDATE hold_item SET hold_status = ? WHERE hold_id = ?`,
      [nextStatus, holdId]
    )

    if (!result.affectedRows) {
      sendJson(res, 404, { ok: false, message: "Hold not found." })
      return
    }

    sendJson(res, 200, {
      ok: true,
      message: "Hold updated.",
      hold_id: Number(holdId),
      hold_status: nextStatus,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to update hold.",
      error: error.message,
    })
  }
}

async function handleGetFines(res, userId, userTypeCode) {
  try {
    await syncOverdueFinesForBorrower(userId, userTypeCode)

    const rows = await query(
      `SELECT
         f.fine_id,
         f.amount,
         f.is_paid,
         GREATEST(TIMESTAMPDIFF(DAY, b.due_date, COALESCE(b.return_date, NOW())), 0) AS days_overdue,
         COALESCE(book.title, video.video_name, audio.audio_name, rental.rental_name) AS item_title
       FROM fined_for f
       INNER JOIN borrow b ON f.borrow_transaction_id = b.borrow_transaction_id
       LEFT JOIN book ON b.item_type_code = 1 AND b.item_id = book.book_id
       LEFT JOIN video ON b.item_type_code = 2 AND b.item_id = video.video_id
       LEFT JOIN audio ON b.item_type_code = 3 AND b.item_id = audio.audio_id
       LEFT JOIN rental_equipment rental ON b.item_type_code = 4 AND b.item_id = rental.equipment_id
       WHERE b.borrower_type = ? AND b.borrower_id = ?
       ORDER BY f.date_assigned DESC`,
      [userTypeCode, userId]
    )

    sendJson(res, 200, rows)
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to load fines.",
      error: error.message,
    })
  }
}

async function handleSyncFines(req, res) {
  try {
    const body = await parseJsonBody(req)
    const userId = String(body.user_id || "").trim()
    const userTypeCode =
      normalizeUserTypeCode(body.user_type) ||
      normalizeUserTypeCode(body.borrower_type) ||
      1

    if (userId) {
      await syncOverdueFinesForBorrower(userId, userTypeCode)
      sendJson(res, 200, {
        ok: true,
        message: "Overdue fines synced for user.",
        user_id: userId,
        user_type: userTypeCode,
      })
      return
    }

    const syncedStudents = await syncOverdueFinesForAllStudents()
    sendJson(res, 200, {
      ok: true,
      message: "Overdue fines synced for all overdue students.",
      synced_students: syncedStudents,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to sync fines.",
      error: error.message,
    })
  }
}

const server = http.createServer(async (req, res) => {
  writeCorsHeaders(req, res)

  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`)
  const { pathname } = url
  const studentMatch = pathname.match(/^\/api\/students\/(\d+)$/)
  const holdMatch = pathname.match(/^\/api\/holds\/(\d+)$/)


  if (req.method === "GET" && pathname === "/api/health") {
    await handleHealth(req, res)
    return
  }

  if (req.method === "GET" && studentMatch) {
    await handleGetStudent(res, studentMatch[1])
    return
  }

  if (req.method === "GET" && pathname === "/api/users/profile") {
    const userId = url.searchParams.get("user_id")
    const userTypeCode = normalizeUserTypeCode(url.searchParams.get("user_type"))

    if (!userId) {
      sendJson(res, 400, { ok: false, message: "user_id is required." })
      return
    }

    if (!userTypeCode) {
      sendJson(res, 400, {
        ok: false,
        message: "user_type is required. Use 1/student or 2/faculty.",
      })
      return
    }

    await handleGetUserProfile(res, userId, userTypeCode)
    return
  }

  if (req.method === "GET" && pathname === "/api/borrows") {
    const borrowerId = url.searchParams.get("borrower_id")
    const borrowerType =
      normalizeUserTypeCode(url.searchParams.get("borrower_type")) || 1
    if (!borrowerId) {
      sendJson(res, 400, { ok: false, message: "borrower_id is required." })
      return
    }
    await handleGetBorrows(res, borrowerId, borrowerType)
    return
  }

  if (req.method === "GET" && pathname === "/api/holds") {
    const userId = url.searchParams.get("user_id")
    const userTypeCode = normalizeUserTypeCode(url.searchParams.get("user_type")) || 1
    if (!userId) {
      sendJson(res, 400, { ok: false, message: "user_id is required." })
      return
    }
    await handleGetHolds(res, userId, userTypeCode)
    return
  }

  if (req.method === "PATCH" && holdMatch) {
    await handlePatchHold(req, res, holdMatch[1])
    return
  }

  if (req.method === "GET" && pathname === "/api/fines") {
    const userId = url.searchParams.get("user_id")
    const userTypeCode = normalizeUserTypeCode(url.searchParams.get("user_type")) || 1
    if (!userId) {
      sendJson(res, 400, { ok: false, message: "user_id is required." })
      return
    }
    await handleGetFines(res, userId, userTypeCode)
    return
  }

  if (req.method === "POST" && pathname === "/api/fines/sync") {
    await handleSyncFines(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/auth/signup") {
    await handleSignup(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/auth/signin") {
    await handleSignin(req, res)
    return
  }

  sendJson(res, 404, { ok: false, message: "Route not found." })
})

server.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`)
})
