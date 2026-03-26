const { query } = require("../database")

async function findUserByEmail(table, idColumn, email) {
  return query(`SELECT ${idColumn} FROM ${table} WHERE email = ? LIMIT 1`, [email])
}

async function findUserByEmailAndPassword(table, idColumn, email, password) {
  return query(
    `SELECT ${idColumn} AS id, email FROM ${table} WHERE email = ? AND password = ? LIMIT 1`,
    [email, password]
  )
}

async function getNextNumericId(tableName, columnName) {
  const rows = await query(
    `SELECT COALESCE(MAX(${columnName}), 0) + 1 AS nextId FROM ${tableName}`
  )
  return rows[0].nextId
}

async function createUser(table, idColumn, user) {
  await query(
    `INSERT INTO ${table} (${idColumn}, email, password, first_name, middle_name, last_name) VALUES (?, ?, ?, ?, ?, ?)`,
    [user.id, user.email, user.password, user.firstName, user.middleName, user.lastName]
  )
}

async function createUserWithType(table, idColumn, user, userTypeCode) {
  await query(
    `INSERT INTO ${table} (${idColumn}, email, password, user_type_code, first_name, middle_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.email,
      user.password,
      userTypeCode,
      user.firstName,
      user.middleName,
      user.lastName,
    ]
  )
}

module.exports = {
  findUserByEmail,
  findUserByEmailAndPassword,
  getNextNumericId,
  createUser,
  createUserWithType,
}
