const { query } = require("../database")

function normalizeType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
}

function toStandardType(itemTypeText) {
  const normalized = normalizeType(itemTypeText)
  if (normalized === "book") return "Book"
  if (normalized === "audio" || normalized === "audiobook") {
    return "Audiobook"
  }
  if (normalized === "video") return "Video"
  if (normalized === "rental equipment" || normalized === "equipment") {
    return "Equipment"
  }
  return String(itemTypeText || "Item").trim() || "Item"
}

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
       it.item_type,
       i.title,
       i.thumbnail_image,
       i.inventory,
       GREATEST(
         CAST(i.inventory AS SIGNED) - COALESCE(CAST(ab.active_borrow_count AS SIGNED), 0),
         0
       ) AS stock,
       b.author
     FROM item i
    LEFT JOIN item_type it ON it.item_code = i.item_type_code
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
  const normalizedType = normalizeType(row.item_type)
  const standardType = toStandardType(row.item_type)

  return {
    item_id: row.item_id,
    title: row.title,
    creator: normalizedType === "book" ? row.author || "" : "",
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
