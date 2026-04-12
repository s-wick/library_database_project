const { query } = require("../database")

async function getCartRowsByUserId(userId) {
  return query(
    `SELECT c.cart_id, c.user_id, c.item_id, c.added_to_cart
     FROM cart_items c
     WHERE c.user_id = ?`,
    [userId]
  )
}

async function getStandardItemForCart(itemId) {
  const rows = await query(
    `SELECT
       i.item_id,
       i.item_type_code,
       i.title,
       i.thumbnail_image,
       i.inventory,
       GREATEST(i.inventory - COALESCE(ab.active_borrow_count, 0), 0) AS stock,
       b.author
     FROM item i
     LEFT JOIN book b ON b.item_id = i.item_id
     LEFT JOIN (
       SELECT
         item_id,
         COUNT(*) AS active_borrow_count
       FROM borrow
       WHERE return_date IS NULL
       GROUP BY item_id
     ) ab ON ab.item_id = i.item_id
     WHERE i.item_id = ?
     LIMIT 1`,
    [itemId]
  )

  if (!rows.length) return null

  const row = rows[0]
  const standardType =
    row.item_type_code === 1
      ? "Book"
      : row.item_type_code === 2
        ? "Video"
        : row.item_type_code === 3
          ? "Audiobook"
          : "Equipment"

  return {
    item_id: row.item_id,
    title: row.title,
    creator: row.item_type_code === 1 ? row.author || "" : "",
    standard_type: standardType,
    thumbnail_image: row.thumbnail_image,
    inventory: Number(row.inventory || 0),
    stock: Number(row.stock || 0),
  }
}

async function findCartItem(userId, itemId) {
  return query(
    `SELECT cart_id FROM cart_items WHERE user_id = ? AND item_id = ?`,
    [userId, itemId]
  )
}

async function insertCartItem(userId, itemId) {
  await query(
    `INSERT INTO cart_items (user_id, item_id, added_to_cart)
     VALUES (?, ?, NOW())`,
    [userId, itemId]
  )
}

async function clearCartByUserId(userId) {
  await query(`DELETE FROM cart_items WHERE user_id = ?`, [userId])
}

async function deleteCartItem(userId, itemId) {
  await query(`DELETE FROM cart_items WHERE user_id = ? AND item_id = ?`, [
    userId,
    itemId,
  ])
}

module.exports = {
  getCartRowsByUserId,
  getStandardItemForCart,
  findCartItem,
  insertCartItem,
  clearCartByUserId,
  deleteCartItem,
}
