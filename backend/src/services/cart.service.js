const { sendJson, parseJsonBody } = require("../utils")
const {
  getCartRowsByUserId,
  getStandardItemForCart,
  findCartItem,
  insertCartItem,
  clearCartByUserId,
  deleteCartItem,
} = require("../models/cart.model")

function getItemTypeCode(itemType) {
  if (typeof itemType === "number") return itemType

  const normalized = String(itemType || "")
    .trim()
    .toLowerCase()
  if (normalized === "video") return 2
  if (normalized === "audiobook" || normalized === "audio") return 3
  if (normalized === "equipment") return 4
  return 1
}

function formatThumbnail(thumbnail) {
  if (thumbnail && thumbnail instanceof Buffer) {
    return `data:image/jpeg;base64,${thumbnail.toString("base64")}`
  }
  return thumbnail
}

async function handleGetCart(_req, res, url) {
  try {
    const userId = url.searchParams.get("userId")
    if (!userId) {
      sendJson(res, 400, { ok: false, message: "userId is required" })
      return
    }

    const rows = await getCartRowsByUserId(userId)
    const cartItems = []

    for (const row of rows) {
      const item = await getStandardItemForCart(row.item_type, row.item_id)
      if (!item) continue

      cartItems.push({
        ...item,
        cart_id: row.cart_id,
        thumbnail_image: formatThumbnail(item.thumbnail_image),
        tag: "Library Item",
        availability: item.in_stock > 0 ? "Available" : "Not Available",
      })
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
      sendJson(res, 400, {
        ok: false,
        message: "Missing required fields",
      })
      return
    }

    const typeCode = getItemTypeCode(itemType)
    const existing = await findCartItem(userId, typeCode, itemId)

    if (existing.length > 0) {
      sendJson(res, 200, { ok: true, message: "Already in cart" })
      return
    }

    await insertCartItem(userId, typeCode, itemId)
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
      sendJson(res, 400, { ok: false, message: "Missing userId" })
      return
    }

    if (clearAll) {
      await clearCartByUserId(userId)
      sendJson(res, 200, { ok: true, message: "Cart cleared" })
      return
    }

    if (!itemType || !itemId) {
      sendJson(res, 400, {
        ok: false,
        message: "Missing required fields",
      })
      return
    }

    const typeCode = getItemTypeCode(itemType)
    await deleteCartItem(userId, typeCode, itemId)

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
  getItemTypeCode,
}
