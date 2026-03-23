const http = require("node:http")
require("dotenv").config()
const { query, testConnection } = require("./db")

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

const ITEM_TABLES = {
  BOOK: {
    table: "book",
    idColumn: "book_id",
    required: ["title", "author"],
    fields: [
      "title",
      "author",
      "edition",
      "publication",
      "publicationDate",
      "monetaryValue",
      "booksInStock",
      "onlinePdfUrl",
      "createdAt",
      "createdBy",
    ],
  },
  VIDEO: {
    table: "video",
    idColumn: "video_id",
    required: ["videoName"],
    fields: [
      "videoName",
      "videoLengthSeconds",
      "monetaryValue",
      "videosInStock",
      "createdAt",
      "createdBy",
    ],
  },
  AUDIO: {
    table: "audio",
    idColumn: "audio_id",
    required: ["audioName"],
    fields: [
      "audioName",
      "audioLengthSeconds",
      "monetaryValue",
      "audiosInStock",
      "createdAt",
      "createdBy",
    ],
  },
  RENTAL_EQUIPMENT: {
    table: "rental_equipment",
    idColumn: "equipment_id",
    required: ["rentalName"],
    fields: [
      "rentalName",
      "monetaryValue",
      "equipmentInStock",
      "createdAt",
      "createdBy",
    ],
  },
  IMAGE: {
    table: "image",
    idColumn: "image_id",
    required: ["imageName"],
    fields: [
      "imageName",
      "monetaryValue",
      "imagesInStock",
      "createdAt",
      "createdBy",
    ],
  },
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

function writeCorsHeaders(req, res) {
  const origin = req.headers.origin
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
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
        `INSERT INTO ${roleConfig.table} (${roleConfig.idColumn}, email, password) VALUES (?, ?, ?)`,
        [createdId, email, password]
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
    const normalizedRoleGroup = normalizeRoleGroup(body.roleGroup)
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

    if (normalizedRoleGroup === "adminStaff") {
      const adminRows = await query(
        "SELECT administrator_id AS id, email FROM system_administrator WHERE email = ? AND password = ? LIMIT 1",
        [email, password]
      )
      if (adminRows.length) {
        sendJson(res, 200, {
          ok: true,
          message: "Sign in successful.",
          user: {
            roleGroup: "adminStaff",
            role: "admin",
            hierarchy: 2,
            id: adminRows[0].id,
            email: adminRows[0].email,
          },
        })
        return
      }

      const staffRows = await query(
        "SELECT librarian_id AS id, email FROM librarian WHERE email = ? AND password = ? LIMIT 1",
        [email, password]
      )
      if (staffRows.length) {
        sendJson(res, 200, {
          ok: true,
          message: "Sign in successful.",
          user: {
            roleGroup: "adminStaff",
            role: "staff",
            hierarchy: 1,
            id: staffRows[0].id,
            email: staffRows[0].email,
          },
        })
        return
      }

      sendJson(res, 401, {
        ok: false,
        message: "Invalid admin/staff credentials.",
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

async function handleGetItemTypes(_req, res) {
  try {
    const rows = await query(
      "SELECT item_code AS itemCode, item_type AS itemType FROM item_type ORDER BY item_code ASC"
    )
    sendJson(res, 200, { ok: true, itemTypes: rows })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to fetch item types.",
      error: error.message,
    })
  }
}

async function handleAddLibrarian(req, res) {
  try {
    const body = await parseJsonBody(req)
    const email = String(body.email || "")
      .trim()
      .toLowerCase()
    const password = String(body.password || "")
    const phoneNumber = parseNullableString(body.phoneNumber)

    if (!email || !password) {
      sendJson(res, 400, {
        ok: false,
        message: "Email and password are required.",
      })
      return
    }

    const existing = await query(
      "SELECT librarian_id FROM librarian WHERE email = ? LIMIT 1",
      [email]
    )
    if (existing.length) {
      sendJson(res, 409, {
        ok: false,
        message: "Email already exists for staff.",
      })
      return
    }

    const librarianId = await getNextNumericId("librarian", "librarian_id")
    await query(
      "INSERT INTO librarian (librarian_id, email, password, phone_number) VALUES (?, ?, ?, ?)",
      [librarianId, email, password, phoneNumber]
    )

    sendJson(res, 201, {
      ok: true,
      message: "Librarian added successfully.",
      librarian: { librarianId, email, phoneNumber },
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to add librarian.",
      error: error.message,
    })
  }
}

async function handleAddItem(req, res) {
  try {
    const body = await parseJsonBody(req)
    const itemType = normalizeItemType(body.itemType)
    const typeConfig = ITEM_TABLES[itemType]
    const createdAt = new Date().toISOString().slice(0, 10)

    if (!typeConfig) {
      sendJson(res, 400, { ok: false, message: "Invalid item type." })
      return
    }

    for (const field of typeConfig.required) {
      if (!parseNullableString(body[field])) {
        sendJson(res, 400, { ok: false, message: `${field} is required.` })
        return
      }
    }

    const itemTypeRow = await query(
      "SELECT item_code AS itemCode FROM item_type WHERE item_type = ? LIMIT 1",
      [itemType]
    )
    if (!itemTypeRow.length) {
      sendJson(res, 400, {
        ok: false,
        message: "Selected item type not found in database.",
      })
      return
    }

    const itemTypeCode = itemTypeRow[0].itemCode
    const createdId = await getNextNumericId(
      typeConfig.table,
      typeConfig.idColumn
    )

    if (itemType === "BOOK") {
      await query(
        "INSERT INTO book (book_id, title, author, edition, publication, publication_date, thumbnail_image, monetary_value, books_in_stock, online_pdf_url, created_at, created_by, item_type_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          createdId,
          parseNullableString(body.title),
          parseNullableString(body.author),
          parseNullableString(body.edition),
          parseNullableString(body.publication),
          parseNullableString(body.publicationDate),
          parseNullableBlob(body.thumbnailImage),
          parseNullableNumber(body.monetaryValue),
          parseNullableNumber(body.booksInStock),
          parseNullableString(body.onlinePdfUrl),
          createdAt,
          parseNullableString(body.createdBy),
          itemTypeCode,
        ]
      )
    } else if (itemType === "VIDEO") {
      await query(
        "INSERT INTO video (video_id, video_name, thumbnail_image, video_length_seconds, video_file, monetary_value, videos_in_stock, created_at, created_by, item_type_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          createdId,
          parseNullableString(body.videoName),
          parseNullableBlob(body.thumbnailImage),
          parseNullableNumber(body.videoLengthSeconds),
          parseNullableBlob(body.videoFile),
          parseNullableNumber(body.monetaryValue),
          parseNullableNumber(body.videosInStock),
          createdAt,
          parseNullableString(body.createdBy),
          itemTypeCode,
        ]
      )
    } else if (itemType === "AUDIO") {
      await query(
        "INSERT INTO audio (audio_id, audio_name, thumbnail_image, audio_length_seconds, audio_file, monetary_value, audios_in_stock, created_at, created_by, item_type_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          createdId,
          parseNullableString(body.audioName),
          parseNullableBlob(body.thumbnailImage),
          parseNullableNumber(body.audioLengthSeconds),
          parseNullableBlob(body.audioFile),
          parseNullableNumber(body.monetaryValue),
          parseNullableNumber(body.audiosInStock),
          createdAt,
          parseNullableString(body.createdBy),
          itemTypeCode,
        ]
      )
    } else if (itemType === "RENTAL_EQUIPMENT") {
      await query(
        "INSERT INTO rental_equipment (equipment_id, rental_name, thumbnail_image, monetary_value, equipment_in_stock, created_at, created_by, item_type_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          createdId,
          parseNullableString(body.rentalName),
          parseNullableBlob(body.thumbnailImage),
          parseNullableNumber(body.monetaryValue),
          parseNullableNumber(body.equipmentInStock),
          createdAt,
          parseNullableString(body.createdBy),
          itemTypeCode,
        ]
      )
    } else if (itemType === "IMAGE") {
      await query(
        "INSERT INTO image (image_id, image_name, thumbnail_image, image_file, monetary_value, images_in_stock, created_at, created_by, item_type_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          createdId,
          parseNullableString(body.imageName),
          parseNullableBlob(body.thumbnailImage),
          parseNullableBlob(body.imageFile),
          parseNullableNumber(body.monetaryValue),
          parseNullableNumber(body.imagesInStock),
          createdAt,
          parseNullableString(body.createdBy),
          itemTypeCode,
        ]
      )
    }

    sendJson(res, 201, {
      ok: true,
      message: "Item added successfully.",
      item: { itemId: createdId, itemType, itemTypeCode },
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to add item.",
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

  if (req.method === "POST" && pathname === "/api/management/librarians") {
    await handleAddLibrarian(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/management/items") {
    await handleAddItem(req, res)
    return
  }

  sendJson(res, 404, { ok: false, message: "Route not found." })
})

server.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`)
})
