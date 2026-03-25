const { query } = require("../db")
const { sendJson, parseJsonBody } = require("../utils")

async function handleGetCart(req, res, url) {
  try {
    const userId = url.searchParams.get("userId")
    if (!userId) {
      return sendJson(res, 400, { ok: false, message: "userId is required" })
    }

    const rows = await query(
      `SELECT c.cart_id, c.user_id, c.item_type, c.item_id, c.added_to_cart 
       FROM cart_items c 
       WHERE c.user_id = ?`,
      [userId]
    )

    // We need to fetch the full item details since the frontend expects them
    const cartItems = []
    for (const row of rows) {
      let item = null
      if (row.item_type === 1) {
        const res = await query(
          `SELECT book_id as item_id, title, author as creator, 'Book' as standard_type, thumbnail_image, books_in_stock as in_stock FROM book WHERE book_id = ?`,
          [row.item_id]
        )
        if (res.length > 0) item = res[0]
      } else if (row.item_type === 2) {
        const res = await query(
          `SELECT video_id as item_id, video_name as title, '' as creator, 'Video' as standard_type, thumbnail_image, videos_in_stock as in_stock FROM video WHERE video_id = ?`,
          [row.item_id]
        )
        if (res.length > 0) item = res[0]
      } else if (row.item_type === 3) {
        const res = await query(
          `SELECT audio_id as item_id, audio_name as title, '' as creator, 'Audiobook' as standard_type, thumbnail_image, audios_in_stock as in_stock FROM audio WHERE audio_id = ?`,
          [row.item_id]
        )
        if (res.length > 0) item = res[0]
      } else if (row.item_type === 4) {
        const res = await query(
          `SELECT equipment_id as item_id, rental_name as title, '' as creator, 'Equipment' as standard_type, thumbnail_image, equipment_in_stock as in_stock FROM rental_equipment WHERE equipment_id = ?`,
          [row.item_id]
        )
        if (res.length > 0) item = res[0]
      }

      if (item) {
        let thumb = item.thumbnail_image
        if (thumb && thumb instanceof Buffer) {
          thumb = `data:image/jpeg;base64,${thumb.toString("base64")}`
        }
        cartItems.push({
          ...item,
          cart_id: row.cart_id,
          thumbnail_image: thumb,
          tag: "Library Item",
          availability: item.in_stock > 0 ? "Available" : "Not Available",
        })
      }
    }

    sendJson(res, 200, { ok: true, cart: cartItems })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to get cart",
      error: error.message,
    })
  }
}

async function handleAddToCart(req, res) {
  try {
    const body = await parseJsonBody(req)
    const { userId, itemType, itemId } = body

    if (!userId || !itemType || !itemId) {
      return sendJson(res, 400, {
        ok: false,
        message: "Missing required fields",
      })
    }

    let typeCode = 1 // default book
    if (itemType === "video" || itemType === "Video") typeCode = 2
    else if (
      itemType === "audiobook" ||
      itemType === "audio" ||
      itemType === "Audiobook"
    )
      typeCode = 3
    else if (itemType === "equipment" || itemType === "Equipment") typeCode = 4
    else if (typeof itemType === "number") typeCode = itemType // fallback

    // Check if it already exists
    const existing = await query(
      `SELECT cart_id FROM cart_items WHERE user_id = ? AND item_type = ? AND item_id = ?`,
      [userId, typeCode, itemId]
    )

    if (existing.length > 0) {
      return sendJson(res, 200, { ok: true, message: "Already in cart" })
    }

    await query(
      `INSERT INTO cart_items (user_id, item_type, item_id, added_to_cart)
       VALUES (?, ?, ?, NOW())`,
      [userId, typeCode, itemId]
    )

    sendJson(res, 200, { ok: true, message: "Item added to cart" })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to add to cart",
      error: error.message,
    })
  }
}

async function handleRemoveFromCart(req, res) {
  try {
    const body = await parseJsonBody(req)
    const { userId, itemType, itemId, clearAll } = body

    if (!userId) {
      return sendJson(res, 400, { ok: false, message: "Missing userId" })
    }

    if (clearAll) {
      await query(`DELETE FROM cart_items WHERE user_id = ?`, [userId])
      return sendJson(res, 200, { ok: true, message: "Cart cleared" })
    }

    if (!itemType || !itemId) {
      return sendJson(res, 400, {
        ok: false,
        message: "Missing required fields",
      })
    }

    let typeCode = 1
    if (itemType === "video" || itemType === "Video") typeCode = 2
    else if (
      itemType === "audiobook" ||
      itemType === "audio" ||
      itemType === "Audiobook"
    )
      typeCode = 3
    else if (itemType === "equipment" || itemType === "Equipment") typeCode = 4
    else if (typeof itemType === "number") typeCode = itemType

    await query(
      `DELETE FROM cart_items WHERE user_id = ? AND item_type = ? AND item_id = ?`,
      [userId, typeCode, itemId]
    )

    sendJson(res, 200, { ok: true, message: "Item removed from cart" })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to remove from cart",
      error: error.message,
    })
  }
}

module.exports = {
  handleGetCart,
  handleAddToCart,
  handleRemoveFromCart,
}
