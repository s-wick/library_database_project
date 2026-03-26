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
    `SELECT staff_id, email, first_name, middle_name, last_name, is_admin
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
    `SELECT staff_id, email, first_name, middle_name, last_name, is_admin
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

module.exports = {
  findUserAccountByEmail,
  findStaffAccountByEmail,
  findUserAccountByCredentials,
  findStaffAccountByCredentials,
  createUserAccount,
  createStaffAccount,
}
