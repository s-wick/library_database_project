const { sendJson, parseJsonBody } = require("../utils")
const {
  findUserAccountByEmail,
  findStaffAccountByEmail,
  findUserAccountByCredentials,
  findStaffAccountByCredentials,
  createUserAccount,
  createStaffAccount,
  updateUserLastLogin,
} = require("../models/auth.model")
const { processUserHoldsOnLogin } = require("../models/transactions.model")

function normalizeAccountType(accountType = "") {
  const normalized = String(accountType || "")
    .trim()
    .toLowerCase()

  if (normalized === "staff" || normalized === "admin") return "staff"
  if (
    normalized === "user" ||
    normalized === "student" ||
    normalized === "faculty"
  ) {
    return "user"
  }

  return ""
}

function inferAccountTypeFromLegacyPayload(payload) {
  const roleGroup = String(payload.roleGroup || "")
    .trim()
    .toLowerCase()
  const role = String(payload.role || "")
    .trim()
    .toLowerCase()

  if (roleGroup === "adminstaff" || role === "admin" || role === "staff") {
    return "staff"
  }

  return "user"
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value
  if (value === "1" || value === 1 || value === "true") return true
  if (value === "0" || value === 0 || value === "false") return false
  return fallback
}

async function handleSignup(req, res) {
  try {
    const body = await parseJsonBody(req)
    const accountType =
      normalizeAccountType(body.accountType) ||
      inferAccountTypeFromLegacyPayload(body)
    const email = String(body.email || "")
      .trim()
      .toLowerCase()
    const password = String(body.password || "")
    const firstName = String(body.firstName || "").trim() || null
    const middleName = String(body.middleName || "").trim() || null
    const lastName = String(body.lastName || "").trim() || null
    const isFaculty = parseBoolean(body.isFaculty, false)
    const isAdmin = parseBoolean(body.isAdmin, false)
    const phoneNumber = String(body.phoneNumber || "").trim() || null

    if (!email || !password) {
      sendJson(res, 400, {
        ok: false,
        message: "Email and password are required.",
      })
      return
    }

    const existingUser = await findUserAccountByEmail(email)
    if (existingUser) {
      sendJson(res, 409, { ok: false, message: "Email already exists." })
      return
    }

    const existingStaff = await findStaffAccountByEmail(email)
    if (existingStaff) {
      sendJson(res, 409, { ok: false, message: "Email already exists." })
      return
    }

    if (accountType === "staff") {
      if (!phoneNumber) {
        sendJson(res, 400, {
          ok: false,
          message: "Phone number is required for staff accounts.",
        })
        return
      }

      await createStaffAccount({
        email,
        password,
        firstName,
        middleName,
        lastName,
        phoneNumber,
        isAdmin,
      })

      const createdStaff = await findStaffAccountByEmail(email)

      sendJson(res, 201, {
        ok: true,
        message: "Staff account created.",
        user: {
          id: createdStaff.staff_id,
          accountType: "staff",
          role: createdStaff.is_admin ? "admin" : "staff",
          email: createdStaff.email,
          firstName: createdStaff.first_name,
          middleName: createdStaff.middle_name,
          lastName: createdStaff.last_name,
          isAdmin: Boolean(createdStaff.is_admin),
        },
      })
      return
    }

    await createUserAccount({
      email,
      password,
      firstName,
      middleName,
      lastName,
      isFaculty,
    })

    const createdUser = await findUserAccountByEmail(email)

    sendJson(res, 201, {
      ok: true,
      message: "Account created.",
      user: {
        id: createdUser.user_id,
        accountType: "user",
        role: createdUser.is_faculty ? "faculty" : "student",
        email: createdUser.email,
        firstName: createdUser.first_name,
        middleName: createdUser.middle_name,
        lastName: createdUser.last_name,
        isFaculty: Boolean(createdUser.is_faculty),
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
    const email = String(body.email || "")
      .trim()
      .toLowerCase()
    const password = String(body.password || "")
    const accountType =
      normalizeAccountType(body.accountType) ||
      inferAccountTypeFromLegacyPayload(body)

    if (!email || !password) {
      sendJson(res, 400, {
        ok: false,
        message: "Email and password are required.",
      })
      return
    }

    let account = null

    if (accountType === "staff") {
      account = await findStaffAccountByCredentials(email, password)
    } else {
      account = await findUserAccountByCredentials(email, password)
    }

    if (!account) {
      sendJson(res, 401, {
        ok: false,
        message: "Invalid credentials.",
      })
      return
    }

    if (accountType === "staff") {
      sendJson(res, 200, {
        ok: true,
        message: "Sign in successful.",
        user: {
          id: account.staff_id,
          accountType: "staff",
          role: account.is_admin ? "admin" : "staff",
          email: account.email,
          firstName: account.first_name,
          middleName: account.middle_name,
          lastName: account.last_name,
          isAdmin: Boolean(account.is_admin),
        },
      })
      return
    }

    try {
      await updateUserLastLogin(account.user_id)
      await processUserHoldsOnLogin(account.user_id)
    } catch (error) {
      console.error("Post-login hold processing failed:", error.message)
    }

    sendJson(res, 200, {
      ok: true,
      message: "Sign in successful.",
      user: {
        id: account.user_id,
        accountType: "user",
        role: account.is_faculty ? "faculty" : "student",
        email: account.email,
        firstName: account.first_name,
        middleName: account.middle_name,
        lastName: account.last_name,
        isFaculty: Boolean(account.is_faculty),
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

module.exports = {
  handleSignup,
  handleSignin,
}
