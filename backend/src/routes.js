const { sendJson } = require("./utils")
const { handleHealth } = require("./services/health.service")
const { handleSignup, handleSignin } = require("./services/auth.service")
const { handleGetDashboard } = require("./services/dashboard.service")
const {
  handleGetItemsAll,
  handleGetItemById,
  handleSearchItems,
  handleCreateItem,
  handleUpdateItem,
  handleDeleteItem,
} = require("./services/items.service")
const {
  handleBorrow,
  handleHold,
  handleCheckout,
} = require("./services/transactions.service")
const {
  handleGetCart,
  handleAddToCart,
  handleRemoveFromCart,
} = require("./services/cart.service")

async function handleApiRoute(req, res, url) {
  const { pathname } = url

  if (req.method === "GET" && pathname === "/api/health") {
    await handleHealth(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/auth/signup") {
    await handleSignup(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/auth/signin") {
    await handleSignin(req, res)
    return
  }

  if (req.method === "GET" && pathname === "/api/dashboard") {
    await handleGetDashboard(req, res, url)
    return
  }

  if (req.method === "GET" && pathname === "/api/items/search") {
    await handleSearchItems(req, res, url)
    return
  }

  if (req.method === "GET" && pathname === "/api/items/all") {
    await handleGetItemsAll(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/items") {
    await handleCreateItem(req, res)
    return
  }

  if (
    (req.method === "PUT" || req.method === "DELETE") &&
    pathname.startsWith("/api/items/")
  ) {
    const parts = pathname.split("/").filter(Boolean)
    if (parts.length === 3) {
      const id = parts[2]
      if (req.method === "PUT") {
        await handleUpdateItem(req, res, id)
        return
      }

      await handleDeleteItem(req, res, id)
      return
    }
  }

  if (req.method === "GET" && pathname.startsWith("/api/items/")) {
    const parts = pathname.split("/").filter(Boolean)

    // New route shape: /api/items/:id
    if (parts.length === 3) {
      const id = parts[2]
      await handleGetItemById(req, res, id)
      return
    }

    // Backward compatibility for old route shape: /api/items/:type/:id
    if (parts.length === 4) {
      const id = parts[3]
      await handleGetItemById(req, res, id)
      return
    }
  }

  if (req.method === "POST" && pathname === "/api/borrow") {
    await handleBorrow(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/hold") {
    await handleHold(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/checkout") {
    await handleCheckout(req, res)
    return
  }

  if (req.method === "GET" && pathname === "/api/cart") {
    await handleGetCart(req, res, url)
    return
  }

  if (req.method === "POST" && pathname === "/api/cart") {
    await handleAddToCart(req, res)
    return
  }

  if (req.method === "DELETE" && pathname === "/api/cart") {
    await handleRemoveFromCart(req, res)
    return
  }

  sendJson(res, 404, { ok: false, message: "Route not found." })
}

module.exports = {
  handleApiRoute,
}
