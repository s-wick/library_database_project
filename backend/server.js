const http = require("node:http")
const crypto = require("node:crypto")
require("dotenv").config()
const { query, testConnection } = require("./db")
const { loadItemSchemasFromDatabase } = require("./item-schema")
const { findAdminStaffUser } = require("./auth-signin")
const { createAddLibrarianHandler } = require("./server/admin/add-librarian")
const { createAddItemHandler } = require("./server/librarian/add-item")
const { createSignupHandler } = require("./server/auth/signup")
const { createSigninHandler } = require("./server/auth/signin")
const { createGetItemTypesHandler } = require("./server/catalog/item-types")
const { createGetGenresHandler } = require("./server/catalog/genres")
const {
  createManagementReportsHandler,
} = require("./server/management/reports")

const port = Number(process.env.PORT || 4000)
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://127.0.0.1:5173"]

const allowedOrigins = new Set(envOrigins)
let ITEM_SCHEMAS = {}
const authTokenTtlMs = Number(
  process.env.AUTH_TOKEN_TTL_MS || 12 * 60 * 60 * 1000
)
const sessions = new Map()

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

function normalizeItemType(value = "") {
  return String(value).trim().toUpperCase()
}

function parseNullableString(value) {
  const parsed = String(value ?? "").trim()
  return parsed ? parsed : null
}

function parseNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return parsed
}

function parseNullableBlob(value) {
  const parsed = String(value ?? "").trim()
  if (!parsed) return null
  const parts = parsed.split(",")
  if (parts.length === 2 && parts[0].includes("base64")) {
    try {
      return Buffer.from(parts[1], "base64")
    } catch {
      return null
    }
  }
  return Buffer.from(parsed)
}

const handleAddLibrarian = createAddLibrarianHandler({
  parseJsonBody,
  parseNullableString,
  query,
  getNextNumericId,
  sendJson,
})

const handleAddItem = createAddItemHandler({
  parseJsonBody,
  normalizeItemType,
  getItemSchemas: () => ITEM_SCHEMAS,
  parseNullableString,
  parseNullableNumber,
  parseNullableBlob,
  query,
  getNextNumericId,
  sendJson,
})

const handleSignup = createSignupHandler({
  parseJsonBody,
  resolveRoleContext,
  query,
  generateStudentId,
  getNextNumericId,
  sendJson,
})

const handleSignin = createSigninHandler({
  parseJsonBody,
  normalizeRoleGroup,
  resolveRoleContext,
  query,
  findAdminStaffUser,
  createSessionToken,
  sendJson,
})

const handleGetItemTypes = createGetItemTypesHandler({
  query,
  getItemSchemas: () => ITEM_SCHEMAS,
  sendJson,
})

const handleGetGenres = createGetGenresHandler({
  query,
  sendJson,
})

const handleManagementReports = createManagementReportsHandler({
  parseJsonBody,
  parseNullableString,
  normalizeItemType,
  query,
  sendJson,
})

function writeCorsHeaders(req, res) {
  const origin = req.headers.origin
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
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
      if (body.length > 15_000_000) {
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

function createSessionToken(user) {
  const token = crypto.randomBytes(24).toString("hex")
  sessions.set(token, {
    user,
    expiresAt: Date.now() + authTokenTtlMs,
  })
  return token
}

function getBearerToken(req) {
  const authHeader = String(req.headers.authorization || "").trim()
  if (!authHeader.toLowerCase().startsWith("bearer ")) return ""
  return authHeader.slice(7).trim()
}

function getSessionUser(req) {
  const token = getBearerToken(req)
  if (!token) return null
  const session = sessions.get(token)
  if (!session) return null
  if (Date.now() > session.expiresAt) {
    sessions.delete(token)
    return null
  }
  return session.user
}

function requireManagementUser(req, res) {
  const user = getSessionUser(req)
  if (!user || user.roleGroup !== "adminStaff") {
    sendJson(res, 401, { ok: false, message: "Unauthorized." })
    return null
  }
  return user
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

  if (req.method === "GET" && pathname === "/api/item-types") {
    await handleGetItemTypes(req, res)
    return
  }

  if (req.method === "GET" && pathname === "/api/genres") {
    await handleGetGenres(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/management/librarians") {
    if (!requireManagementUser(req, res)) return
    await handleAddLibrarian(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/management/items") {
    if (!requireManagementUser(req, res)) return
    await handleAddItem(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/management/reports") {
    if (!requireManagementUser(req, res)) return
    await handleManagementReports(req, res)
    return
  }

  sendJson(res, 404, { ok: false, message: "Route not found." })
})

async function startServer() {
  ITEM_SCHEMAS = await loadItemSchemasFromDatabase(query, process.env.DB_NAME)
  server.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`)
  })
}

startServer().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
