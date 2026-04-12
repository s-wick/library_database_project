const { query } = require("../database")

async function getNotificationsByUserId(userId) {
  return query(
    `SELECT notification_id,
            nt.notification_type_text AS notification_type,
            message,
            item_id,
            created_at,
            acknowledged_at
     FROM user_notification
     INNER JOIN user_notification_type nt
       ON nt.notification_type_id = user_notification.notification_type
     WHERE user_id = ?
       AND acknowledged_at IS NULL
     ORDER BY created_at DESC, notification_id DESC
     LIMIT 100`,
    [userId]
  )
}

async function acknowledgeNotification(userId, notificationId) {
  const result = await query(
    `UPDATE user_notification
     SET acknowledged_at = NOW()
     WHERE notification_id = ?
       AND user_id = ?
       AND acknowledged_at IS NULL`,
    [notificationId, userId]
  )

  return Number(result.affectedRows || 0) > 0
}

module.exports = {
  getNotificationsByUserId,
  acknowledgeNotification,
}
