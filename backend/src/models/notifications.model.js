const { query } = require("../database")

async function getNotificationsByUserId(userId) {
  return query(
    `SELECT notification_id,
            notification_type,
            message,
            item_id,
            checkout_date,
            notify_on,
            created_at
     FROM user_notification
     WHERE user_id = ?
     ORDER BY created_at DESC, notification_id DESC
     LIMIT 100`,
    [userId]
  )
}

module.exports = {
  getNotificationsByUserId,
}
