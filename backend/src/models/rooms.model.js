const { query } = require("../database")

const DEFAULT_ROOMS = [
  { room_number: "101", capacity: 4, has_projector: 1, has_whiteboard: 1 },
  { room_number: "102", capacity: 6, has_projector: 0, has_whiteboard: 1 },
  { room_number: "201", capacity: 8, has_projector: 1, has_whiteboard: 1 },
  { room_number: "202", capacity: 10, has_projector: 1, has_whiteboard: 0 },
]

function mapRoomRow(row) {
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

async function getMeetingRooms() {
  const rows = await query(
    `SELECT room_number, capacity, has_projector, has_whiteboard
     FROM meeting_room
     ORDER BY room_number ASC`
  )

  const source = rows.length ? rows : DEFAULT_ROOMS
  return source.map(mapRoomRow)
}

async function getUserActiveBooking(userId) {
  const rows = await query(
    `SELECT room_number, start_time, end_time
     FROM book_room
     WHERE user_id = ?
       AND end_time > NOW()
     ORDER BY start_time ASC
     LIMIT 1`,
    [userId]
  )

  return rows[0] || null
}

async function hasRoomOverlap(roomNumber, startTime, endTime) {
  const rows = await query(
    `SELECT 1
     FROM book_room
     WHERE room_number = ?
       AND start_time < ?
       AND end_time > ?
     LIMIT 1`,
    [roomNumber, endTime, startTime]
  )

  return rows.length > 0
}

async function createRoomBooking(userId, roomNumber, startTime, endTime) {
  await query(
    `INSERT INTO book_room (room_number, user_id, start_time, end_time)
     VALUES (?, ?, ?, ?)`,
    [roomNumber, userId, startTime, endTime]
  )
}

module.exports = {
  getMeetingRooms,
  getUserActiveBooking,
  hasRoomOverlap,
  createRoomBooking,
}
