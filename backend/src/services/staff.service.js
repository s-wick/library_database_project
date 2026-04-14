const { sendJson, parseJsonBody } = require("../utils")
const {
  findStaffAccountByEmail,
  listLibrarianAccounts,
  findLibrarianAccountById,
  updateLibrarianAccount,
  listUserAccounts,
  findUserAccountById,
  updateUserFacultyStatus,
} = require("../models/auth.model")

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

async function handleGetLibrarians(_req, res) {
  try {
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
    const search = url.searchParams.get("q") || ""
    const rows = await listUserAccounts(search)

    sendJson(res, 200, {
      ok: true,
      users: rows,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to load users.",
      error: error.message,
    })
  }
}

async function handleMarkUserAsFaculty(_req, res, userId) {
  try {
    const id = Number(userId)
    if (!Number.isInteger(id) || id <= 0) {
      sendJson(res, 400, { ok: false, message: "Invalid user id." })
      return
    }

    const existing = await findUserAccountById(id)
    if (!existing) {
      sendJson(res, 404, { ok: false, message: "User not found." })
      return
    }

    if (existing.is_faculty) {
      sendJson(res, 409, {
        ok: false,
        message: "User is already marked as faculty.",
      })
      return
    }

    await updateUserFacultyStatus(id, true)
    const updated = await findUserAccountById(id)

    sendJson(res, 200, {
      ok: true,
      message: "User marked as faculty.",
      user: updated,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to update user.",
      error: error.message,
    })
  }
}

module.exports = {
  handleGetLibrarians,
  handleUpdateLibrarian,
  handleGetUsers,
  handleMarkUserAsFaculty,
}
