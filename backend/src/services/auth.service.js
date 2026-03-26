const { sendJson, parseJsonBody } = require("../utils")
const {
  findUserByEmail,
  findUserByEmailAndPassword,
  getNextNumericId,
  createUser,
  createUserWithType,
} = require("../models/auth.model")

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
    roleConfig,
  }
}

function generateStudentId() {
  const randomPart = Math.floor(Math.random() * 1_000_000_000_000)
    .toString()
    .padStart(12, "0")
  return `S${randomPart}`.slice(0, 15)
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

    const existing = await findUserByEmail(roleConfig.table, roleConfig.idColumn, email)
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

    const user = {
      id: createdId,
      email,
      password,
      firstName,
      middleName,
      lastName,
    }

    if (typeof roleConfig.userTypeCode === "number") {
      await createUserWithType(
        roleConfig.table,
        roleConfig.idColumn,
        user,
        roleConfig.userTypeCode
      )
    } else {
      await createUser(roleConfig.table, roleConfig.idColumn, user)
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
    const rows = await findUserByEmailAndPassword(
      roleConfig.table,
      roleConfig.idColumn,
      email,
      password
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

module.exports = {
  handleSignup,
  handleSignin,
}
