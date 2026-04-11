const { sendJson } = require("../utils")
const { getNotificationsByUserId } = require("../models/notifications.model")

function toIsoString(value) {
  if (!value) return null
  return new Date(value).toISOString()
}

function toDateString(value) {
  if (!value) return null
  return new Date(value).toISOString().split("T")[0]
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
        checkoutDate: toIsoString(notification.checkout_date),
        notifyOn: toDateString(notification.notify_on),
        createdAt: toIsoString(notification.created_at),
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

module.exports = {
  handleGetNotifications,
}
