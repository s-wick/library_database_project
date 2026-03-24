function createAddLibrarianHandler({
  parseJsonBody,
  parseNullableString,
  query,
  getNextNumericId,
  sendJson,
}) {
  return async function handleAddLibrarian(req, res) {
    try {
      const body = await parseJsonBody(req)
      const firstName = parseNullableString(body.firstName)
      const middleName = parseNullableString(body.middleName)
      const lastName = parseNullableString(body.lastName)
      const email = String(body.email || "").trim().toLowerCase()
      const password = String(body.password || "")
      const phoneNumber = parseNullableString(body.phoneNumber)

      if (!email || !password) {
        sendJson(res, 400, { ok: false, message: "Email and password are required." })
        return
      }

      const existing = await query(
        "SELECT librarian_id FROM librarian WHERE email = ? LIMIT 1",
        [email]
      )
      if (existing.length) {
        sendJson(res, 409, { ok: false, message: "Email already exists for staff." })
        return
      }

      const librarianId = await getNextNumericId("librarian", "librarian_id")
      await query(
        "INSERT INTO librarian (librarian_id, first_name, middle_name, last_name, email, password, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [librarianId, firstName, middleName, lastName, email, password, phoneNumber]
      )

      sendJson(res, 201, {
        ok: true,
        message: "Librarian added successfully.",
        librarian: { librarianId, firstName, middleName, lastName, email, phoneNumber },
      })
    } catch (error) {
      sendJson(res, 500, { ok: false, message: "Failed to add librarian.", error: error.message })
    }
  }
}

module.exports = {
  createAddLibrarianHandler,
}
