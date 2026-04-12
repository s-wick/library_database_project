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
     ORDER BY created_at DESC, notification_id DESC
     LIMIT 100`,
    [userId]
  )
}

module.exports = {
  getNotificationsByUserId,
}
