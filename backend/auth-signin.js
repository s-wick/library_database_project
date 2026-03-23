async function findAdminStaffUser(query, email, password) {
  const adminRows = await query(
    "SELECT administrator_id AS id, email FROM system_administrator WHERE email = ? AND password = ? LIMIT 1",
    [email, password]
  )
  if (adminRows.length) {
    return {
      roleGroup: "adminStaff",
      role: "admin",
      hierarchy: 2,
      id: adminRows[0].id,
      email: adminRows[0].email,
    }
  }

  const staffRows = await query(
    "SELECT librarian_id AS id, email FROM librarian WHERE email = ? AND password = ? LIMIT 1",
    [email, password]
  )
  if (staffRows.length) {
    return {
      roleGroup: "adminStaff",
      role: "staff",
      hierarchy: 1,
      id: staffRows[0].id,
      email: staffRows[0].email,
    }
  }

  return null
}

module.exports = {
  findAdminStaffUser,
}
