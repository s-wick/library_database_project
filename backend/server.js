const http = require("node:http")
require("dotenv").config()
const { query, testConnection } = require("./db")
const { sendJson, parseJsonBody } = require("./utils")

const {
  handleGetItemsAll,
  handleGetItemById,
  handleSearchItems,
} = require("./api/items")
const { handleGetDashboard } = require("./api/dashboard")
const {
  handleBorrow,
  handleHold,
  handleCheckout,
} = require("./api/transactions")
const {
  handleGetCart,
  handleAddToCart,
  handleRemoveFromCart,
} = require("./api/cart")

const port = Number(process.env.PORT || 4000)
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://127.0.0.1:5173"]

const allowedOrigins = new Set(envOrigins)

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
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
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

const server = http.createServer(async (req, res) => {
  writeCorsHeaders(req, res)

  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`)
  const { pathname } = url

  if (req.method === "GET" && pathname === "/api/health") {
    await handleHealth(req, res)
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

  if (req.method === "GET" && pathname === "/api/dashboard") {
    await handleGetDashboard(req, res)
    return
  }

  if (req.method === "GET" && pathname === "/api/items/search") {
    await handleSearchItems(req, res)
    return
  }

  if (req.method === "GET" && pathname === "/api/items/all") {
    await handleGetItemsAll(req, res)
    return
  }

  if (req.method === "GET" && pathname.startsWith("/api/items/")) {
    const parts = pathname.split("/")
    // /api/items/:type/:id
    if (parts.length === 5) {
      const type = parts[3]
      const id = parts[4]
      await handleGetItemById(req, res, type, id)
      return
    }
  }

  if (req.method === "POST" && pathname === "/api/borrow") {
    await handleBorrow(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/hold") {
    await handleHold(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/checkout") {
    await handleCheckout(req, res)
    return
  }

  if (req.method === "GET" && pathname === "/api/cart") {
    await handleGetCart(req, res, url)
    return
  }

  if (req.method === "POST" && pathname === "/api/cart") {
    await handleAddToCart(req, res)
    return
  }

  if (req.method === "DELETE" && pathname === "/api/cart") {
    await handleRemoveFromCart(req, res)
    return
  }

  sendJson(res, 404, { ok: false, message: "Route not found." })
})

server.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`)
})
