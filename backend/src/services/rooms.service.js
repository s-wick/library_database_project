const { sendJson, parseJsonBody } = require("../utils")
const {
  getMeetingRooms,
  getMeetingRoomByNumber,
  createMeetingRoom,
  countUpcomingRoomBookings,
  updateMeetingRoom,
  deleteMeetingRoom,
  getUserActiveBooking,
  getRoomBookingsInWindow,
  hasRoomOverlap,
  createRoomBooking,
} = require("../models/rooms.model")

const MAX_BOOKING_HOURS = 3
const MAX_ADVANCE_HOURS = 24

function formatBooking(row) {
  if (!row) return null
  const durationHours = Number(row.duration_hours || 0)
  const startTime = new Date(row.start_time)
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000)
  return {
    roomNumber: row.room_number,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationHours,
  }
}

function formatRoom(row) {
  if (!row) return null

  const floor = String(row.room_number || "").charAt(0) || "1"
  const hasProjector = Number(row.has_projector || 0) === 1
  const hasWhiteboard = Number(row.has_whiteboard || 0) === 1
  const hasTv = Number(row.has_tv || 0) === 1

  return {
    roomNumber: row.room_number,
    floor,
    capacity: Number(row.capacity || 0),
    features: {
      hasTv,
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
    if (!roomNumber) {
      sendJson(res, 400, { ok: false, message: "roomNumber is required" })
      return
    }

    const room = await getMeetingRoomByNumber(roomNumber)
    if (!room) {
      sendJson(res, 404, { ok: false, message: "Room not found." })
      return
    }

    const windowStart = new Date()
    const windowEnd = new Date(
      windowStart.getTime() + MAX_ADVANCE_HOURS * 60 * 60 * 1000
    )

    const bookings = await getRoomBookingsInWindow(
      roomNumber,
      windowStart,
      windowEnd
    )

    sendJson(res, 200, {
      ok: true,
      room: formatRoom(room),
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
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

async function handleCreateRoom(req, res) {
  try {
    const body = await parseJsonBody(req)
    const roomNumber = String(body.roomNumber || "").trim()
    const capacity = Number(body.capacity)
    const hasProjector = Boolean(body.hasProjector)
    const hasWhiteboard = Boolean(body.hasWhiteboard)
    const hasTv = Boolean(body.hasTv)

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
      hasWhiteboard,
      hasTv
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
    const hasTv = Boolean(body.hasTv)

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
      hasWhiteboard,
      hasTv
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
    const durationHours = Number(body.durationHours)

    if (!Number.isFinite(userId) || userId <= 0 || !roomNumber) {
      sendJson(res, 400, {
        ok: false,
        message: "userId and roomNumber are required",
      })
      return
    }

    if (Number.isNaN(startTime.getTime())) {
      sendJson(res, 400, { ok: false, message: "Invalid startTime" })
      return
    }

    if (!Number.isInteger(durationHours)) {
      sendJson(res, 400, {
        ok: false,
        message: "durationHours must be an integer value",
      })
      return
    }

    if (durationHours < 1 || durationHours > MAX_BOOKING_HOURS) {
      sendJson(res, 400, {
        ok: false,
        message: "Room booking duration must be between 1 and 3 hours.",
      })
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

    if (startTime.getMinutes() !== 0 || startTime.getSeconds() !== 0) {
      sendJson(res, 400, {
        ok: false,
        message: "Room booking start time must be on a whole-hour boundary.",
      })
      return
    }

    const endTime = new Date(
      startTime.getTime() + durationHours * 60 * 60 * 1000
    )

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

    const booking = await createRoomBooking(
      userId,
      roomNumber,
      startTime,
      durationHours
    )

    if (!booking) {
      throw new Error("Room booking was not persisted")
    }

    sendJson(res, 200, {
      ok: true,
      message: "Room booked successfully.",
      booking: formatBooking(booking),
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
  handleCreateRoom,
  handleUpdateRoom,
  handleDeleteRoom,
  handleBookRoom,
}
