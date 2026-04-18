const { query } = require("../database")

function toLookupKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

async function getItemTypeLookups() {
  const rows = await query(
    `SELECT item_type
     FROM item_type
     ORDER BY item_code ASC`
  )

  return rows
    .map((row) => String(row.item_type || "").trim())
    .filter(Boolean)
    .map((label) => ({ key: toLookupKey(label), label }))
}

async function getReportTypeLookups() {
  const rows = await query(
    `SELECT report_type
     FROM report_types
     ORDER BY report_type_id ASC`
  )

  return rows
    .map((row) => String(row.report_type || "").trim())
    .filter(Boolean)
    .map((value) => ({ key: toLookupKey(value), value }))
}

async function getHoldCloseReasonLookups() {
  const rows = await query(
    `SELECT reason_text
     FROM hold_item_closing_reasons
     ORDER BY reason_id ASC`
  )

  return rows.map((row) => String(row.reason_text || "").trim()).filter(Boolean)
}

async function getNotificationTypeLookups() {
  const rows = await query(
    `SELECT notification_type_text
     FROM user_notification_type
     ORDER BY notification_type_id ASC`
  )

  return rows
    .map((row) => String(row.notification_type_text || "").trim())
    .filter(Boolean)
}

async function getFacultyAuditActionLookups() {
  const rows = await query(
    `SELECT action_text
     FROM user_account_faculty_audit_action_type
     ORDER BY action_type_id ASC`
  )

  return rows.map((row) => String(row.action_text || "").trim()).filter(Boolean)
}

module.exports = {
  getItemTypeLookups,
  getReportTypeLookups,
  getHoldCloseReasonLookups,
  getNotificationTypeLookups,
  getFacultyAuditActionLookups,
}
