const { query } = require("../database")

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

module.exports = {
  findUserAccountByEmail,
  findStaffAccountByEmail,
  findUserAccountByCredentials,
  findStaffAccountByCredentials,
  createUserAccount,
  createStaffAccount,
  listLibrarianAccounts,
  findLibrarianAccountById,
  updateLibrarianAccount,
  updateUserLastLogin,
}
