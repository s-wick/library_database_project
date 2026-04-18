const { sendJson } = require("../utils")
const {
  getItemTypeLookups,
  getReportTypeLookups,
  getHoldCloseReasonLookups,
  getNotificationTypeLookups,
  getFacultyAuditActionLookups,
} = require("../models/lookups.model")

async function handleGetLookups(_req, res) {
  try {
    const [
      itemTypes,
      reportTypes,
      holdCloseReasons,
      notificationTypes,
      facultyAuditActionTypes,
    ] = await Promise.all([
      getItemTypeLookups(),
      getReportTypeLookups(),
      getHoldCloseReasonLookups(),
      getNotificationTypeLookups(),
      getFacultyAuditActionLookups(),
    ])

    sendJson(res, 200, {
      ok: true,
      lookups: {
        itemTypes,
        reportTypes,
        holdCloseReasons,
        notificationTypes,
        facultyAuditActionTypes,
      },
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to load lookup values",
      error: error.message,
    })
  }
}

module.exports = {
  handleGetLookups,
}
