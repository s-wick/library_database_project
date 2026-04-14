const { pool, query } = require("../database")

async function findUserAccountByEmail(email) {
  const rows = await query(
    `SELECT user_id, email, first_name, middle_name, last_name, is_faculty
     FROM user_account
     WHERE email = ?
     LIMIT 1`,
    [email]
  )

  return rows[0] || null
}

async function findUserAccountById(userId) {
  const rows = await query(
    `SELECT user_id, email, first_name, middle_name, last_name, is_faculty
     FROM user_account
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  )

  return rows[0] || null
}

async function findStaffAccountByEmail(email) {
  const rows = await query(
    `SELECT staff_id, email, first_name, middle_name, last_name, phone_number, is_admin, is_retired
     FROM staff_account
     WHERE email = ?
     LIMIT 1`,
    [email]
  )

  return rows[0] || null
}

async function findStaffAccountById(staffId) {
  const rows = await query(
    `SELECT staff_id, email, first_name, middle_name, last_name, is_admin, is_retired
     FROM staff_account
     WHERE staff_id = ?
     LIMIT 1`,
    [staffId]
  )

  return rows[0] || null
}

async function findUserAccountByCredentials(email, password) {
  const rows = await query(
    `SELECT user_id, email, first_name, middle_name, last_name, is_faculty
     FROM user_account
     WHERE email = ? AND password = ?
     LIMIT 1`,
    [email, password]
  )

  return rows[0] || null
}

async function findStaffAccountByCredentials(email, password) {
  const rows = await query(
    `SELECT staff_id, email, first_name, middle_name, last_name, phone_number, is_admin, is_retired
     FROM staff_account
     WHERE email = ? AND password = ?
     LIMIT 1`,
    [email, password]
  )

  return rows[0] || null
}

async function createUserAccount(user) {
  await query(
    `INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      user.email,
      user.password,
      user.firstName,
      user.middleName,
      user.lastName,
      user.isFaculty,
    ]
  )
}

async function createStaffAccount(user) {
  await query(
    `INSERT INTO staff_account (email, password, first_name, middle_name, last_name, phone_number, is_admin)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      user.email,
      user.password,
      user.firstName,
      user.middleName,
      user.lastName,
      user.phoneNumber,
      user.isAdmin,
    ]
  )
}

// ...existing code...
async function listLibrarianAccounts() {
  return query(
    `SELECT
       staff_id,
       email,
       first_name,
       middle_name,
       last_name,
       phone_number,
       is_admin,
       created_at,
       is_retired
     FROM staff_account
     WHERE is_admin = 0
     ORDER BY last_name ASC, first_name ASC, email ASC`
  )
}

async function findLibrarianAccountById(staffId) {
  const rows = await query(
    `SELECT
       staff_id,
       email,
       password,
       first_name,
       middle_name,
       last_name,
       phone_number,
       is_admin,
       created_at,
       is_retired
     FROM staff_account
     WHERE staff_id = ? AND is_admin = 0
     LIMIT 1`,
    [staffId]
  )

  return rows[0] || null
}

async function updateLibrarianAccount(staffId, user) {
  if (user.password) {
    await query(
      `UPDATE staff_account
       SET email = ?,
           password = ?,
           first_name = ?,
           middle_name = ?,
           last_name = ?,
           phone_number = ?,
           is_retired = ?
       WHERE staff_id = ? AND is_admin = 0`,
      [
        user.email,
        user.password,
        user.firstName,
        user.middleName,
        user.lastName,
        user.phoneNumber,
        user.isRetired,
        staffId,
      ]
    )
    return
  }

  await query(
    `UPDATE staff_account
     SET email = ?,
         first_name = ?,
         middle_name = ?,
         last_name = ?,
         phone_number = ?,
         is_retired = ?
     WHERE staff_id = ? AND is_admin = 0`,

    [
      user.email,
      user.firstName,
      user.middleName,
      user.lastName,
      user.phoneNumber,
      user.isRetired,
      staffId,
    ]
  )
}

async function updateUserLastLogin(userId) {
  await query(
    `UPDATE user_account
     SET last_login = NOW()
     WHERE user_id = ?`,
    [userId]
  )
}

function buildUserSearchWhere(search = "") {
  const normalizedSearch = String(search || "")
    .trim()
    .toLowerCase()
  if (!normalizedSearch) {
    return {
      whereSql: "",
      params: [],
    }
  }

  if (normalizedSearch.includes("@")) {
    return {
      whereSql: "WHERE email LIKE ?",
      params: [`${normalizedSearch}%`],
    }
  }

  const parts = normalizedSearch.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const first = `${parts[0]}%`
    const second = `${parts[1]}%`
    return {
      whereSql: `WHERE (first_name LIKE ? AND last_name LIKE ?)
         OR (first_name LIKE ? AND middle_name LIKE ?)
         OR (last_name LIKE ? AND first_name LIKE ?)
         OR email LIKE ?`,
      params: [first, second, first, second, first, second, `${parts[0]}%`],
    }
  }

  return {
    whereSql: `WHERE email LIKE ?
       OR first_name LIKE ?
       OR middle_name LIKE ?
       OR last_name LIKE ?`,
    params: Array(4).fill(`${normalizedSearch}%`),
  }
}

async function listUserAccountsPaginated({
  search = "",
  limit = 25,
  offset = 0,
}) {
  const { whereSql, params } = buildUserSearchWhere(search)

  const countRows = await query(
    `SELECT COUNT(*) AS total
     FROM user_account
     ${whereSql}`,
    params
  )

  const rows = await query(
    `SELECT
       user_id,
       email,
       first_name,
       middle_name,
       last_name,
       is_faculty,
       created_at,
       updated_at
     FROM user_account
     ${whereSql}
     ORDER BY last_name ASC, first_name ASC, user_id ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  return {
    rows,
    total: Number(countRows[0]?.total || 0),
  }
}

async function updateUserFacultyStatusWithAudit({
  userId,
  isFaculty,
  changedByStaffId,
  reason = null,
  action = null,
}) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [userRows] = await connection.execute(
      `SELECT user_id, email, first_name, middle_name, last_name, is_faculty
       FROM user_account
       WHERE user_id = ?
       LIMIT 1
       FOR UPDATE`,
      [userId]
    )

    if (!userRows.length) {
      await connection.rollback()
      return { ok: false, code: "not_found" }
    }

    const currentIsFaculty = Boolean(userRows[0].is_faculty)
    const nextIsFaculty = Boolean(isFaculty)

    if (currentIsFaculty === nextIsFaculty) {
      await connection.rollback()
      return {
        ok: false,
        code: "no_change",
        user: userRows[0],
      }
    }

    await connection.execute(
      `UPDATE user_account
       SET is_faculty = ?,
           updated_at = NOW()
       WHERE user_id = ?`,
      [nextIsFaculty ? 1 : 0, userId]
    )

    await connection.execute(
      `INSERT INTO user_account_faculty_audit (
         user_id,
         changed_by_staff_id,
         from_is_faculty,
         to_is_faculty,
         action,
         reason
       )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        changedByStaffId,
        currentIsFaculty ? 1 : 0,
        nextIsFaculty ? 1 : 0,
        action || (nextIsFaculty ? "mark" : "undo"),
        reason,
      ]
    )

    const [updatedRows] = await connection.execute(
      `SELECT user_id, email, first_name, middle_name, last_name, is_faculty
       FROM user_account
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    )

    await connection.commit()
    return {
      ok: true,
      user: updatedRows[0],
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function bulkUpdateUserFacultyStatusWithAudit({
  userIds,
  isFaculty,
  changedByStaffId,
  reason = null,
  action = null,
}) {
  const normalizedIds = [...new Set((userIds || []).map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0
  )

  if (!normalizedIds.length) {
    return {
      totalRequested: 0,
      updatedCount: 0,
      skippedCount: 0,
      missingIds: [],
      updatedUsers: [],
    }
  }

  const placeholders = normalizedIds.map(() => "?").join(",")
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [users] = await connection.execute(
      `SELECT user_id, email, first_name, middle_name, last_name, is_faculty
       FROM user_account
       WHERE user_id IN (${placeholders})
       FOR UPDATE`,
      normalizedIds
    )

    const usersById = new Map(users.map((user) => [Number(user.user_id), user]))
    const nextIsFaculty = Boolean(isFaculty)
    const updatedUsers = []
    let skippedCount = 0

    for (const id of normalizedIds) {
      const existing = usersById.get(id)
      if (!existing) continue

      const currentIsFaculty = Boolean(existing.is_faculty)
      if (currentIsFaculty === nextIsFaculty) {
        skippedCount += 1
        continue
      }

      await connection.execute(
        `UPDATE user_account
         SET is_faculty = ?,
             updated_at = NOW()
         WHERE user_id = ?`,
        [nextIsFaculty ? 1 : 0, id]
      )

      await connection.execute(
        `INSERT INTO user_account_faculty_audit (
           user_id,
           changed_by_staff_id,
           from_is_faculty,
           to_is_faculty,
           action,
           reason
         )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          changedByStaffId,
          currentIsFaculty ? 1 : 0,
          nextIsFaculty ? 1 : 0,
          action || (nextIsFaculty ? "bulk_mark" : "bulk_undo"),
          reason,
        ]
      )

      updatedUsers.push({
        ...existing,
        is_faculty: nextIsFaculty ? 1 : 0,
      })
    }

    const missingIds = normalizedIds.filter((id) => !usersById.has(id))

    await connection.commit()
    return {
      totalRequested: normalizedIds.length,
      updatedCount: updatedUsers.length,
      skippedCount,
      missingIds,
      updatedUsers,
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

module.exports = {
  findUserAccountByEmail,
  findUserAccountById,
  findStaffAccountByEmail,
  findStaffAccountById,
  findUserAccountByCredentials,
  findStaffAccountByCredentials,
  createUserAccount,
  createStaffAccount,
  listLibrarianAccounts,
  listUserAccountsPaginated,
  findLibrarianAccountById,
  updateLibrarianAccount,
  updateUserFacultyStatusWithAudit,
  bulkUpdateUserFacultyStatusWithAudit,
  updateUserLastLogin,
}
