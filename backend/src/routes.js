const { sendJson } = require("./utils")
const { handleHealth } = require("./services/health.service")
const { handleSignup, handleSignin } = require("./services/auth.service")
const { handleGetDashboard } = require("./services/dashboard.service")
const {
  handleGetNotifications,
  handleAcknowledgeNotification,
} = require("./services/notifications.service")
const { handleGetReports } = require("./services/reports.service")
const {
  handleGetItemsAll,
  handleGetItemById,
  handleSearchItems,
  handleSearchGenres,
  handleCreateItem,
  handleUpdateItem,
  handleDeleteItem,
} = require("./services/items.service")
const {
  handleBorrow,
  handleHold,
  handleCheckout,
  handleCheckin,
  handleGetActiveBorrowCatalog,
  handleCancelHold,
  handleBorrowStatus,
} = require("./services/transactions.service")
const {
  handleGetCart,
  handleAddToCart,
  handleRemoveFromCart,
} = require("./services/cart.service")
const {
  handleGetRooms,
  handleGetMyRoomBooking,
  handleGetRoomAvailability,
  handleCreateRoom,
  handleUpdateRoom,
  handleDeleteRoom,
  handleBookRoom,
} = require("./services/rooms.service")
const { handleGetFines, handlePayFines } = require("./services/fines.service")
const {
  handleGetLibrarians,
  handleUpdateLibrarian,
  handleGetUsers,
  handleSetUserFacultyStatus,
  handleBulkSetUserFacultyStatus,
} = require("./services/staff.service")

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

  if (req.method === "GET" && pathname === "/api/notifications") {
    await handleGetNotifications(req, res, url)
    return
  }

  if (req.method === "POST" && pathname === "/api/notifications/ack") {
    await handleAcknowledgeNotification(req, res)
    return
  }

  if (req.method === "GET" && pathname === "/api/reports") {
    await handleGetReports(req, res, url)
    return
  }

  if (req.method === "GET" && pathname === "/api/items/search") {
    await handleSearchItems(req, res, url)
    return
  }

  if (req.method === "GET" && pathname === "/api/genres/search") {
    await handleSearchGenres(req, res, url)
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

  if (req.method === "DELETE" && pathname === "/api/hold") {
    await handleCancelHold(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/checkout") {
    await handleCheckout(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/check-in") {
    await handleCheckin(req, res)
    return
  }

  if (req.method === "GET" && pathname === "/api/check-in/catalog") {
    await handleGetActiveBorrowCatalog(req, res, url)
    return
  }

  if (req.method === "GET" && pathname === "/api/borrow-status") {
    await handleBorrowStatus(req, res, url)
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

  if (req.method === "GET" && pathname === "/api/rooms") {
    await handleGetRooms(req, res)
    return
  }

  if (req.method === "POST" && pathname === "/api/rooms") {
    await handleCreateRoom(req, res)
    return
  }

  if (
    (req.method === "PUT" || req.method === "DELETE") &&
    pathname.startsWith("/api/rooms/")
  ) {
    const parts = pathname.split("/").filter(Boolean)
    if (parts.length === 3) {
      const roomNumber = parts[2]
      if (req.method === "PUT") {
        await handleUpdateRoom(req, res, roomNumber)
        return
      }

      await handleDeleteRoom(req, res, roomNumber)
      return
    }
  }

  if (req.method === "GET" && pathname === "/api/rooms/my-booking") {
    await handleGetMyRoomBooking(req, res, url)
    return
  }

  if (req.method === "GET" && pathname === "/api/rooms/availability") {
    await handleGetRoomAvailability(req, res, url)
    return
  }

  if (req.method === "POST" && pathname === "/api/rooms/book") {
    await handleBookRoom(req, res)
    return
  }

  if (req.method === "GET" && pathname === "/api/fines") {
    await handleGetFines(req, res, url)
    return
  }

  if (req.method === "POST" && pathname === "/api/fines/pay") {
    await handlePayFines(req, res)
    return
  }

  if (req.method === "GET" && pathname === "/api/staff") {
    await handleGetLibrarians(req, res)
    return
  }

  if (req.method === "GET" && pathname === "/api/users") {
    await handleGetUsers(req, res, url)
    return
  }

  if (req.method === "PUT" && pathname.startsWith("/api/staff/")) {
    const parts = pathname.split("/").filter(Boolean)
    if (parts.length === 3) {
      await handleUpdateLibrarian(req, res, parts[2])
      return
    }
  }

  if (req.method === "PUT" && pathname === "/api/users/faculty/bulk") {
    await handleBulkSetUserFacultyStatus(req, res)
    return
  }

  if (req.method === "PUT" && pathname.startsWith("/api/users/")) {
    const parts = pathname.split("/").filter(Boolean)
    if (parts.length === 4 && parts[3] === "faculty") {
      await handleSetUserFacultyStatus(req, res, parts[2])
      return
    }
  }

  sendJson(res, 404, { ok: false, message: "Route not found." })
}

module.exports = {
  handleApiRoute,
}
