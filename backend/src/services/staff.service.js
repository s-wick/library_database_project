const { sendJson, parseJsonBody } = require("../utils")
const {
  findStaffAccountByEmail,
  findStaffAccountById,
  listLibrarianAccounts,
  findLibrarianAccountById,
  updateLibrarianAccount,
  listUserAccountsPaginated,
  findUserAccountById,
  updateUserFacultyStatusWithAudit,
  bulkUpdateUserFacultyStatusWithAudit,
} = require("../models/auth.model")

const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 25

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value
  if (value === "1" || value === 1 || value === "true") return true
  if (value === "0" || value === 0 || value === "false") return false
  return fallback
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

async function requireStaffAuthorization(req, res, { adminOnly = false } = {}) {
  const actorIdRaw = String(req.headers["x-actor-id"] || "").trim()
  const actorRole = String(req.headers["x-actor-role"] || "")
    .trim()
    .toLowerCase()

  const actorId = Number(actorIdRaw)
  if (!Number.isInteger(actorId) || actorId <= 0) {
    sendJson(res, 401, {
      ok: false,
      message: "Missing or invalid actor identity.",
    })
    return null
  }

  const staff = await findStaffAccountById(actorId)
  if (!staff) {
    sendJson(res, 403, { ok: false, message: "Staff authorization required." })
    return null
  }

  const isAdmin = Boolean(staff.is_admin)
  if (actorRole === "admin" && !isAdmin) {
    sendJson(res, 403, {
      ok: false,
      message: "Invalid role assertion for this staff account.",
    })
    return null
  }

  if (adminOnly && !isAdmin) {
    sendJson(res, 403, {
      ok: false,
      message: "Only administrators can perform this action.",
    })
    return null
  }

  return {
    staffId: Number(staff.staff_id),
    isAdmin,
  }
}

function normalizeDateTime(value) {
  const raw = String(value || "").trim()
  if (!raw) return null
  return `${raw} 00:00:00`
}

function isPastDate(value) {
  if (!value) return false
  const today = new Date()
  const todayDay = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  )
    .toISOString()
    .slice(0, 10)
  return String(value).slice(0, 10) < todayDay
}

async function handleGetLibrarians(req, res) {
  try {
    const actor = await requireStaffAuthorization(req, res)
    if (!actor) return

    const rows = await listLibrarianAccounts()
    sendJson(res, 200, {
      ok: true,
      librarians: rows,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to load librarians.",
      error: error.message,
    })
  }
}

async function handleUpdateLibrarian(req, res, staffId) {
  try {
    const actor = await requireStaffAuthorization(req, res, { adminOnly: true })
    if (!actor) return

    const id = Number(staffId)
    if (!Number.isInteger(id) || id <= 0) {
      sendJson(res, 400, { ok: false, message: "Invalid staff id." })
      return
    }

    const existing = await findLibrarianAccountById(id)
    if (!existing) {
      sendJson(res, 404, { ok: false, message: "Librarian not found." })
      return
    }

    const body = await parseJsonBody(req)
    const email = String(body.email || "")
      .trim()
      .toLowerCase()
    const password = String(body.password || "")
    const firstName = String(body.firstName || "").trim()
    const middleName = String(body.middleName || "").trim() || null
    const lastName = String(body.lastName || "").trim()
    const phoneNumber = String(body.phoneNumber || "").trim()
    const isRetired = normalizeDateTime(body.isRetired)

    if (!email || !firstName || !lastName || !phoneNumber) {
      sendJson(res, 400, {
        ok: false,
        message: "First name, last name, email and phone number are required.",
      })
      return
    }

    if (isPastDate(body.isRetired)) {
      sendJson(res, 400, {
        ok: false,
        message: "Retired date must be today or a future date.",
      })
      return
    }

    const sameEmailAccount = await findStaffAccountByEmail(email)
    if (sameEmailAccount && Number(sameEmailAccount.staff_id) !== id) {
      sendJson(res, 409, { ok: false, message: "Email already exists." })
      return
    }

    await updateLibrarianAccount(id, {
      email,
      password,
      firstName,
      middleName,
      lastName,
      phoneNumber,
      isRetired,
    })

    const updated = await findLibrarianAccountById(id)

    sendJson(res, 200, {
      ok: true,
      message: "Librarian updated.",
      librarian: updated,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to update librarian.",
      error: error.message,
    })
  }
}

async function handleGetUsers(_req, res, url) {
  try {
    const actor = await requireStaffAuthorization(_req, res)
    if (!actor) return

    const search = url.searchParams.get("q") || ""
    const page = parsePositiveInteger(url.searchParams.get("page"), 1)
    const requestedPageSize = parsePositiveInteger(
      url.searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE
    )
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
    const offset = (page - 1) * pageSize

    const { rows, total } = await listUserAccountsPaginated({
      search,
      limit: pageSize,
      offset,
    })

    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize)

    sendJson(res, 200, {
      ok: true,
      users: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to load users.",
      error: error.message,
    })
  }
}

async function handleSetUserFacultyStatus(req, res, userId) {
  try {
    const actor = await requireStaffAuthorization(req, res, { adminOnly: true })
    if (!actor) return

    const id = Number(userId)
    if (!Number.isInteger(id) || id <= 0) {
      sendJson(res, 400, { ok: false, message: "Invalid user id." })
      return
    }

    const body = await parseJsonBody(req)
    const isFaculty = parseBoolean(body.isFaculty, true)
    const reason = String(body.reason || "").trim() || null

    const existing = await findUserAccountById(id)
    if (!existing) {
      sendJson(res, 404, { ok: false, message: "User not found." })
      return
    }

    if (Boolean(existing.is_faculty) === isFaculty) {
      sendJson(res, 409, {
        ok: false,
        message: isFaculty
          ? "User is already marked as faculty."
          : "User is already not faculty.",
      })
      return
    }

    const updateResult = await updateUserFacultyStatusWithAudit({
      userId: id,
      isFaculty,
      changedByStaffId: actor.staffId,
      reason,
      action: isFaculty ? "mark" : "undo",
    })

    if (!updateResult.ok) {
      sendJson(res, 409, {
        ok: false,
        message: isFaculty
          ? "User is already marked as faculty."
          : "User is already not faculty.",
      })
      return
    }

    sendJson(res, 200, {
      ok: true,
      message: isFaculty
        ? "User marked as faculty."
        : "Faculty mark has been undone.",
      user: updateResult.user,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to update user.",
      error: error.message,
    })
  }
}

async function handleBulkSetUserFacultyStatus(req, res) {
  try {
    const actor = await requireStaffAuthorization(req, res, { adminOnly: true })
    if (!actor) return

    const body = await parseJsonBody(req)
    const userIds = Array.isArray(body.userIds) ? body.userIds : []
    const isFaculty = parseBoolean(body.isFaculty, true)
    const reason = String(body.reason || "").trim() || null

    if (!userIds.length) {
      sendJson(res, 400, {
        ok: false,
        message: "At least one user id is required.",
      })
      return
    }

    if (userIds.length > 200) {
      sendJson(res, 400, {
        ok: false,
        message: "Maximum 200 users per bulk request.",
      })
      return
    }

    const result = await bulkUpdateUserFacultyStatusWithAudit({
      userIds,
      isFaculty,
      changedByStaffId: actor.staffId,
      reason,
      action: isFaculty ? "bulk_mark" : "bulk_undo",
    })

    sendJson(res, 200, {
      ok: true,
      message: isFaculty
        ? "Bulk faculty update completed."
        : "Bulk faculty undo completed.",
      ...result,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to update users.",
      error: error.message,
    })
  }
}

module.exports = {
  handleGetLibrarians,
  handleUpdateLibrarian,
  handleGetUsers,
  handleSetUserFacultyStatus,
  handleBulkSetUserFacultyStatus,
}
