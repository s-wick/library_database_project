const { sendJson, parseJsonBody } = require("../utils")
const {
  getMeetingRooms,
  getMeetingRoomByNumber,
  createMeetingRoom,
  countUpcomingRoomBookings,
  updateMeetingRoom,
  deleteMeetingRoom,
  getUserActiveBooking,
  hasRoomOverlap,
  getRoomBookingsInWindow,
  createRoomBooking,
  deleteRoomBooking,
} = require("../models/rooms.model")

const MAX_BOOKING_MINUTES = 180
const MAX_ADVANCE_HOURS = 24
const SLOT_INTERVAL_MINUTES = 30

function isHalfHourBoundary(date) {
  return (
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0 &&
    date.getMinutes() % SLOT_INTERVAL_MINUTES === 0
  )
}

function formatBooking(row) {
  if (!row) return null
  return {
    roomNumber: row.room_number,
    startTime: new Date(row.start_time).toISOString(),
    endTime: new Date(row.end_time).toISOString(),
  }
}

function formatRoom(row) {
  if (!row) return null

  const floor = String(row.room_number || "").charAt(0) || "1"
  const hasProjector = Number(row.has_projector || 0) === 1
  const hasWhiteboard = Number(row.has_whiteboard || 0) === 1

  return {
    roomNumber: row.room_number,
    floor,
    capacity: Number(row.capacity || 0),
    features: {
      hasTv: hasProjector,
      hasProjector,
      hasWhiteboard,
      hasWifi: true,
      hasPowerOutlets: true,
      quietZone: Number(row.capacity || 0) <= 6,
    },
  }
}

async function handleGetRooms(_req, res) {
  try {
    const rooms = await getMeetingRooms()
    sendJson(res, 200, { ok: true, rooms })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to fetch rooms",
      error: error.message,
    })
  }
}

async function handleGetMyRoomBooking(_req, res, url) {
  try {
    const userId = Number(url.searchParams.get("userId"))
    if (!Number.isFinite(userId) || userId <= 0) {
      sendJson(res, 400, { ok: false, message: "userId is required" })
      return
    }

    const booking = await getUserActiveBooking(userId)
    sendJson(res, 200, { ok: true, booking: formatBooking(booking) })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to fetch user booking",
      error: error.message,
    })
  }
}

async function handleGetRoomAvailability(_req, res, url) {
  try {
    const roomNumber = String(url.searchParams.get("roomNumber") || "").trim()
    const startTime = new Date(url.searchParams.get("startTime"))
    const endTime = new Date(url.searchParams.get("endTime"))

    if (!roomNumber) {
      sendJson(res, 400, { ok: false, message: "roomNumber is required" })
      return
    }

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      sendJson(res, 400, { ok: false, message: "Invalid startTime or endTime" })
      return
    }

    if (endTime <= startTime) {
      sendJson(res, 400, {
        ok: false,
        message: "endTime must be after startTime",
      })
      return
    }

    const windowMinutes = (endTime.getTime() - startTime.getTime()) / 60000
    if (windowMinutes > MAX_ADVANCE_HOURS * 60) {
      sendJson(res, 400, {
        ok: false,
        message: "Availability window cannot exceed 1 day.",
      })
      return
    }

    const room = await getMeetingRoomByNumber(roomNumber)
    if (!room) {
      sendJson(res, 404, {
        ok: false,
        message: "Selected room does not exist.",
      })
      return
    }

    const bookings = await getRoomBookingsInWindow(roomNumber, startTime, endTime)
    sendJson(res, 200, {
      ok: true,
      bookings: bookings.map(formatBooking),
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to fetch room availability",
      error: error.message,
    })
  }
}

async function handleCancelMyRoomBooking(_req, res, url) {
  try {
    const userId = Number(url.searchParams.get("userId"))
    if (!Number.isFinite(userId) || userId <= 0) {
      sendJson(res, 400, { ok: false, message: "userId is required" })
      return
    }

    const booking = await getUserActiveBooking(userId)
    if (!booking) {
      sendJson(res, 404, { ok: false, message: "No active room booking found." })
      return
    }

    await deleteRoomBooking(
      userId,
      booking.room_number,
      booking.start_time,
      booking.end_time
    )

    sendJson(res, 200, {
      ok: true,
      message: "Room booking removed successfully.",
      booking: formatBooking(booking),
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to remove room booking",
      error: error.message,
    })
  }
}

async function handleCreateRoom(req, res) {
  try {
    const body = await parseJsonBody(req)
    const roomNumber = String(body.roomNumber || "").trim()
    const capacity = Number(body.capacity)
    const hasProjector = Boolean(body.hasProjector)
    const hasWhiteboard = Boolean(body.hasWhiteboard)

    if (!roomNumber) {
      sendJson(res, 400, { ok: false, message: "roomNumber is required" })
      return
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      sendJson(res, 400, {
        ok: false,
        message: "capacity must be a positive integer",
      })
      return
    }

    const existingRoom = await getMeetingRoomByNumber(roomNumber)
    if (existingRoom) {
      sendJson(res, 409, {
        ok: false,
        message: "A room with this room number already exists.",
      })
      return
    }

    const room = await createMeetingRoom(
      roomNumber,
      capacity,
      hasProjector,
      hasWhiteboard
    )

    sendJson(res, 201, {
      ok: true,
      message: "Room created successfully.",
      room: formatRoom(room),
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to create room",
      error: error.message,
    })
  }
}

async function handleUpdateRoom(req, res, roomNumberParam) {
  try {
    const currentRoomNumber = decodeURIComponent(roomNumberParam || "").trim()
    if (!currentRoomNumber) {
      sendJson(res, 400, { ok: false, message: "roomNumber is required" })
      return
    }

    const existingRoom = await getMeetingRoomByNumber(currentRoomNumber)
    if (!existingRoom) {
      sendJson(res, 404, { ok: false, message: "Room not found." })
      return
    }

    const body = await parseJsonBody(req)
    const nextRoomNumber = String(body.roomNumber || "").trim()
    const capacity = Number(body.capacity)
    const hasProjector = Boolean(body.hasProjector)
    const hasWhiteboard = Boolean(body.hasWhiteboard)

    if (!nextRoomNumber) {
      sendJson(res, 400, { ok: false, message: "roomNumber is required" })
      return
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      sendJson(res, 400, {
        ok: false,
        message: "capacity must be a positive integer",
      })
      return
    }

    if (nextRoomNumber !== currentRoomNumber) {
      const roomWithNextNumber = await getMeetingRoomByNumber(nextRoomNumber)
      if (roomWithNextNumber) {
        sendJson(res, 409, {
          ok: false,
          message: "A room with this room number already exists.",
        })
        return
      }

      const bookingCount = await countUpcomingRoomBookings(currentRoomNumber)
      if (bookingCount > 0) {
        sendJson(res, 409, {
          ok: false,
          message:
            "This room has active or upcoming bookings and cannot be renamed.",
        })
        return
      }
    }

    const room = await updateMeetingRoom(
      currentRoomNumber,
      nextRoomNumber,
      capacity,
      hasProjector,
      hasWhiteboard
    )

    sendJson(res, 200, {
      ok: true,
      message: "Room updated successfully.",
      room: formatRoom(room),
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to update room",
      error: error.message,
    })
  }
}

async function handleDeleteRoom(_req, res, roomNumberParam) {
  try {
    const roomNumber = decodeURIComponent(roomNumberParam || "").trim()
    if (!roomNumber) {
      sendJson(res, 400, { ok: false, message: "roomNumber is required" })
      return
    }

    const room = await getMeetingRoomByNumber(roomNumber)
    if (!room) {
      sendJson(res, 404, { ok: false, message: "Room not found." })
      return
    }

    const bookingCount = await countUpcomingRoomBookings(roomNumber)
    if (bookingCount > 0) {
      sendJson(res, 409, {
        ok: false,
        message:
          "This room has active or upcoming bookings and cannot be deleted.",
      })
      return
    }

    await deleteMeetingRoom(roomNumber)

    sendJson(res, 200, {
      ok: true,
      message: "Room deleted successfully.",
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to delete room",
      error: error.message,
    })
  }
}

async function handleBookRoom(req, res) {
  try {
    const body = await parseJsonBody(req)
    const userId = Number(body.userId)
    const roomNumber = String(body.roomNumber || "").trim()
    const startTime = new Date(body.startTime)
    const endTime = new Date(body.endTime)

    if (!Number.isFinite(userId) || userId <= 0 || !roomNumber) {
      sendJson(res, 400, {
        ok: false,
        message: "userId and roomNumber are required",
      })
      return
    }

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      sendJson(res, 400, { ok: false, message: "Invalid startTime or endTime" })
      return
    }

    const now = new Date()
    const maxAdvance = new Date(
      now.getTime() + MAX_ADVANCE_HOURS * 60 * 60 * 1000
    )

    if (startTime <= now) {
      sendJson(res, 400, {
        ok: false,
        message: "Room booking must be for a future time.",
      })
      return
    }

    if (startTime > maxAdvance) {
      sendJson(res, 400, {
        ok: false,
        message: "Room booking can only be made up to 1 day in advance.",
      })
      return
    }

    const minutes = Math.round(
      (endTime.getTime() - startTime.getTime()) / 60000
    )
    if (minutes <= 0 || minutes > MAX_BOOKING_MINUTES) {
      sendJson(res, 400, {
        ok: false,
        message: "Room booking duration must be between 1 and 180 minutes.",
      })
      return
    }

    if (minutes % SLOT_INTERVAL_MINUTES !== 0) {
      sendJson(res, 400, {
        ok: false,
        message: "Room booking duration must use 30-minute increments.",
      })
      return
    }

    if (!isHalfHourBoundary(startTime) || !isHalfHourBoundary(endTime)) {
      sendJson(res, 400, {
        ok: false,
        message: "Room booking times must align to 30-minute slots.",
      })
      return
    }

    const existingBooking = await getUserActiveBooking(userId)
    if (existingBooking) {
      sendJson(res, 409, {
        ok: false,
        message: "You already have an active room booking.",
      })
      return
    }

    const room = await getMeetingRoomByNumber(roomNumber)
    if (!room) {
      sendJson(res, 404, {
        ok: false,
        message: "Selected room does not exist.",
      })
      return
    }

    const overlap = await hasRoomOverlap(roomNumber, startTime, endTime)
    if (overlap) {
      sendJson(res, 409, {
        ok: false,
        message: "This room is already booked for the selected time.",
      })
      return
    }

    await createRoomBooking(userId, roomNumber, startTime, endTime)

    sendJson(res, 200, {
      ok: true,
      message: "Room booked successfully.",
      booking: {
        roomNumber,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to book room",
      error: error.message,
    })
  }
}

module.exports = {
  handleGetRooms,
  handleGetMyRoomBooking,
  handleGetRoomAvailability,
  handleCancelMyRoomBooking,
  handleCreateRoom,
  handleUpdateRoom,
  handleDeleteRoom,
  handleBookRoom,
}
