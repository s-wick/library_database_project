function createSignupHandler({
  parseJsonBody,
  resolveRoleContext,
  query,
  generateStudentId,
  getNextNumericId,
  sendJson,
}) {
  return async function handleSignup(req, res) {
    try {
      const body = await parseJsonBody(req)
      const roleContext = resolveRoleContext(body.roleGroup, body.role)
      const email = String(body.email || "").trim().toLowerCase()
      const password = String(body.password || "")
      const firstName = String(body.firstName || "").trim() || null
      const middleName = String(body.middleName || "").trim() || null
      const lastName = String(body.lastName || "").trim() || null

      if (!email || !password) {
        sendJson(res, 400, { ok: false, message: "Email and password are required." })
        return
      }

      if (!roleContext) {
        sendJson(res, 400, { ok: false, message: "Invalid roleGroup/role combination." })
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
          [createdId, email, password, roleConfig.userTypeCode, firstName, middleName, lastName]
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
      sendJson(res, 500, { ok: false, message: "Signup failed.", error: error.message })
    }
  }
}

module.exports = {
  createSignupHandler,
}
