function createSigninHandler({
  parseJsonBody,
  normalizeRoleGroup,
  resolveRoleContext,
  query,
  findAdminStaffUser,
  createSessionToken,
  sendJson,
}) {
  return async function handleSignin(req, res) {
    try {
      const body = await parseJsonBody(req)
      const normalizedRoleGroup = normalizeRoleGroup(body.roleGroup)
      const roleContext = resolveRoleContext(body.roleGroup, body.role)
      const email = String(body.email || "").trim().toLowerCase()
      const password = String(body.password || "")

      if (!email || !password) {
        sendJson(res, 400, { ok: false, message: "Email and password are required." })
        return
      }

      if (normalizedRoleGroup === "adminStaff") {
        const user = await findAdminStaffUser(query, email, password)
        if (user) {
          const token = createSessionToken(user)
          sendJson(res, 200, {
            ok: true,
            message: "Sign in successful.",
            user,
            token,
          })
          return
        }

        sendJson(res, 401, { ok: false, message: "Invalid admin/staff credentials." })
        return
      }

      if (!roleContext) {
        sendJson(res, 400, { ok: false, message: "Invalid roleGroup/role combination." })
        return
      }

      const { roleGroup, roleConfig } = roleContext
      const rows = await query(
        `SELECT ${roleConfig.idColumn} AS id, email FROM ${roleConfig.table} WHERE email = ? AND password = ? LIMIT 1`,
        [email, password]
      )
      if (!rows.length) {
        sendJson(res, 401, { ok: false, message: roleConfig.invalidCredentialsMessage })
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
        token: createSessionToken({
          roleGroup,
          role: roleConfig.responseRole,
          hierarchy: roleConfig.hierarchy,
          id: rows[0].id,
          email: rows[0].email,
        }),
      })
    } catch (error) {
      sendJson(res, 500, { ok: false, message: "Signin failed.", error: error.message })
    }
  }
}

module.exports = {
  createSigninHandler,
}
