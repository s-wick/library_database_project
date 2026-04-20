const { sendJson, parseJsonBody } = require("../utils")
const {
  getCartRowsByUserId,
  getStandardItemForCart,
  findCartItem,
  insertCartItem,
  clearCartByUserId,
  deleteCartItem,
} = require("../models/cart.model")

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
      const item = await getStandardItemForCart(row.item_id)
      if (!item) continue

      cartItems.push({
        ...item,
        cart_id: row.cart_id,
        thumbnail_image: formatThumbnail(item.thumbnail_image),
        tag: "Library Item",
        availability: item.stock > 0 ? "Available" : "Not Available",
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
    const { userId, itemId } = body

    if (!userId || !itemId) {
      sendJson(res, 400, {
        ok: false,
        message: "Missing required fields",
      })
      return
    }

    const item = await getStandardItemForCart(itemId)
    if (!item) {
      sendJson(res, 404, {
        ok: false,
        message: "Item is not available in catalog.",
      })
      return
    }

    const existing = await findCartItem(userId, itemId)

    if (existing.length > 0) {
      sendJson(res, 200, { ok: true, message: "Already in cart" })
      return
    }

    await insertCartItem(userId, itemId)
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
    const { userId, itemId, clearAll } = body

    if (!userId) {
      sendJson(res, 400, { ok: false, message: "Missing userId" })
      return
    }

    if (clearAll) {
      await clearCartByUserId(userId)
      sendJson(res, 200, { ok: true, message: "Cart cleared" })
      return
    }

    if (!itemId) {
      sendJson(res, 400, {
        ok: false,
        message: "Missing required fields",
      })
      return
    }

    await deleteCartItem(userId, itemId)

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
