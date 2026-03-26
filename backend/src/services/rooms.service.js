const { sendJson, parseJsonBody } = require("../utils")
const {
  getMeetingRooms,
  getUserActiveBooking,
  hasRoomOverlap,
  createRoomBooking,
} = require("../models/rooms.model")

const MAX_BOOKING_MINUTES = 180
const MAX_ADVANCE_HOURS = 24

function formatBooking(row) {
  if (!row) return null
  return {
    roomNumber: row.room_number,
    startTime: new Date(row.start_time).toISOString(),
    endTime: new Date(row.end_time).toISOString(),
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
    const maxAdvance = new Date(now.getTime() + MAX_ADVANCE_HOURS * 60 * 60 * 1000)

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

    const minutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)
    if (minutes <= 0 || minutes > MAX_BOOKING_MINUTES) {
      sendJson(res, 400, {
        ok: false,
        message: "Room booking duration must be between 1 and 180 minutes.",
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
  handleBookRoom,
}
