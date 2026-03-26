const { query } = require("../database")

async function getCartRowsByUserId(userId) {
  return query(
    `SELECT c.cart_id, c.user_id, c.item_type, c.item_id, c.added_to_cart
     FROM cart_items c
     WHERE c.user_id = ?`,
    [userId]
  )
}

async function getStandardItemForCart(itemTypeCode, itemId) {
  if (itemTypeCode === 1) {
    const rows = await query(
      `SELECT book_id as item_id, title, author as creator, 'Book' as standard_type, thumbnail_image, books_in_stock as in_stock FROM book WHERE book_id = ? LIMIT 1`,
      [itemId]
    )
    return rows[0] || null
  }

  if (itemTypeCode === 2) {
    const rows = await query(
      `SELECT video_id as item_id, video_name as title, '' as creator, 'Video' as standard_type, thumbnail_image, videos_in_stock as in_stock FROM video WHERE video_id = ? LIMIT 1`,
      [itemId]
    )
    return rows[0] || null
  }

  if (itemTypeCode === 3) {
    const rows = await query(
      `SELECT audio_id as item_id, audio_name as title, '' as creator, 'Audiobook' as standard_type, thumbnail_image, audios_in_stock as in_stock FROM audio WHERE audio_id = ? LIMIT 1`,
      [itemId]
    )
    return rows[0] || null
  }

  if (itemTypeCode === 4) {
    const rows = await query(
      `SELECT equipment_id as item_id, rental_name as title, '' as creator, 'Equipment' as standard_type, thumbnail_image, equipment_in_stock as in_stock FROM rental_equipment WHERE equipment_id = ? LIMIT 1`,
      [itemId]
    )
    return rows[0] || null
  }

  return null
}

async function findCartItem(userId, itemType, itemId) {
  return query(
    `SELECT cart_id FROM cart_items WHERE user_id = ? AND item_type = ? AND item_id = ?`,
    [userId, itemType, itemId]
  )
}

async function insertCartItem(userId, itemType, itemId) {
  await query(
    `INSERT INTO cart_items (user_id, item_type, item_id, added_to_cart)
     VALUES (?, ?, ?, NOW())`,
    [userId, itemType, itemId]
  )
}

async function clearCartByUserId(userId) {
  await query(`DELETE FROM cart_items WHERE user_id = ?`, [userId])
}

async function deleteCartItem(userId, itemType, itemId) {
  await query(
    `DELETE FROM cart_items WHERE user_id = ? AND item_type = ? AND item_id = ?`,
    [userId, itemType, itemId]
  )
}

module.exports = {
  getCartRowsByUserId,
  getStandardItemForCart,
  findCartItem,
  insertCartItem,
  clearCartByUserId,
  deleteCartItem,
}
