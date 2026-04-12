const { sendJson, parseJsonBody } = require("../utils")
const {
  getNotificationsByUserId,
  acknowledgeNotification,
} = require("../models/notifications.model")

function toIsoString(value) {
  if (!value) return null
  return new Date(value).toISOString()
}

async function handleGetNotifications(_req, res, url) {
  try {
    const userId = url.searchParams.get("userId")

    if (!userId) {
      sendJson(res, 400, { ok: false, message: "userId is required" })
      return
    }

    const notifications = await getNotificationsByUserId(userId)

    sendJson(res, 200, {
      ok: true,
      notifications: notifications.map((notification) => ({
        notificationId: Number(notification.notification_id),
        type: notification.notification_type,
        message: notification.message,
        itemId: Number(notification.item_id),
        createdAt: toIsoString(notification.created_at),
        acknowledgedAt: toIsoString(notification.acknowledged_at),
      })),
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to fetch notifications",
      error: error.message,
    })
  }
}

async function handleAcknowledgeNotification(req, res) {
  try {
    const body = await parseJsonBody(req)
    const userId = Number(body.userId)
    const notificationId = Number(body.notificationId)

    if (!userId || !notificationId) {
      sendJson(res, 400, {
        ok: false,
        message: "userId and notificationId are required",
      })
      return
    }

    const updated = await acknowledgeNotification(userId, notificationId)

    if (!updated) {
      sendJson(res, 404, {
        ok: false,
        message: "Notification not found or already acknowledged",
      })
      return
    }

    sendJson(res, 200, { ok: true })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to acknowledge notification",
      error: error.message,
    })
  }
}

module.exports = {
  handleGetNotifications,
  handleAcknowledgeNotification,
}
