const { sendJson, parseJsonBody } = require("../utils")
const {
  getMeetingRooms,
  getMeetingRoomByNumber,
  createMeetingRoom,
  countUpcomingRoomBookings,
  updateMeetingRoom,
  deleteMeetingRoom,
  getUserActiveBooking,
  getUserBookings,
  getRoomBookingsInWindow,
  hasRoomOverlap,
  createRoomBooking,
} = require("../models/rooms.model")

const MAX_BOOKING_HOURS = 3
const WEEKDAY_OPEN_HOUR = 9
const WEEKDAY_CLOSE_HOUR = 19
const WEEKEND_OPEN_HOUR = 9
const WEEKEND_CLOSE_HOUR = 17

function formatDateTimeLocalIso(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  const second = String(date.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
}

function parseDateTimeInput(value) {
  if (value instanceof Date) return value

  if (typeof value === "string") {
    const match = value
      .trim()
      .match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/)

    if (match) {
      const year = Number(match[1])
      const month = Number(match[2])
      const day = Number(match[3])
      const hour = Number(match[4])
      const minute = Number(match[5])
      const second = Number(match[6] || 0)

      return new Date(year, month - 1, day, hour, minute, second)
    }
  }

  return new Date(value)
}

function normalizeDateTimeString(value) {
  if (typeof value === "string") {
    const match = value
      .trim()
      .match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/)

    if (match) {
      const year = match[1]
      const month = match[2]
      const day = match[3]
      const hour = match[4]
      const minute = match[5]
      const second = match[6] || "00"

      return `${year}-${month}-${day}T${hour}:${minute}:${second}`
    }
  }

  return formatDateTimeLocalIso(value)
}

function getDaySchedule(date) {
  const day = date.getDay()
  const isWeekend = day === 0 || day === 6
  return {
    openHour: isWeekend ? WEEKEND_OPEN_HOUR : WEEKDAY_OPEN_HOUR,
    closeHour: isWeekend ? WEEKEND_CLOSE_HOUR : WEEKDAY_CLOSE_HOUR,
  }
}

function getBookingWindowEnd(fromDate = new Date()) {
  const end = new Date(fromDate)
  end.setDate(end.getDate() + 1)
  end.setHours(23, 59, 59, 999)
  return end
}

function formatBooking(row) {
  if (!row) return null
  const durationHours = Number(row.duration_hours || 0)
  const formattedStartTime = normalizeDateTimeString(row.start_time)
  let formattedEndTime = normalizeDateTimeString(row.end_time)

  if (!formattedEndTime && formattedStartTime) {
    const startTime = parseDateTimeInput(formattedStartTime)
    const endTime = new Date(
      startTime.getTime() + durationHours * 60 * 60 * 1000
    )
    formattedEndTime = formatDateTimeLocalIso(endTime)
  }

  if (!formattedStartTime || !formattedEndTime) return null

  return {
    roomNumber: row.room_number,
    startTime: formattedStartTime,
    endTime: formattedEndTime,
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
    const allParam = url.searchParams.get("all") === "true"
    if (!Number.isFinite(userId) || userId <= 0) {
      sendJson(res, 400, { ok: false, message: "userId is required" })
      return
    }

    let bookings
    if (allParam) {
      bookings = await getUserBookings(userId)
      sendJson(res, 200, {
        ok: true,
        bookings: bookings.map(formatBooking).filter(Boolean),
      })
    } else {
      const booking = await getUserActiveBooking(userId)
      sendJson(res, 200, { ok: true, booking: formatBooking(booking) })
    }
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
    const windowEnd = getBookingWindowEnd(windowStart)

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
    const startTime = parseDateTimeInput(body.startTime)
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
    const maxAdvance = getBookingWindowEnd(now)

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
        message: "Room booking can only be made through the end of tomorrow.",
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

    const { openHour, closeHour } = getDaySchedule(startTime)
    const startHour = startTime.getHours()

    if (startHour < openHour || startHour >= closeHour) {
      sendJson(res, 400, {
        ok: false,
        message: "Room booking must start during open hours.",
      })
      return
    }

    const endTime = new Date(
      startTime.getTime() + durationHours * 60 * 60 * 1000
    )

    if (
      endTime.getHours() > closeHour ||
      endTime.getDate() !== startTime.getDate()
    ) {
      sendJson(res, 400, {
        ok: false,
        message: "Room booking must end by closing time.",
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
