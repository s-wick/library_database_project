const { query } = require("../database")

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

  return rows.map(mapRoomRow)
}

async function getMeetingRoomByNumber(roomNumber) {
  const rows = await query(
    `SELECT room_number, capacity, has_projector, has_whiteboard
     FROM meeting_room
     WHERE room_number = ?
     LIMIT 1`,
    [roomNumber]
  )

  return rows[0] || null
}

async function createMeetingRoom(
  roomNumber,
  capacity,
  hasProjector,
  hasWhiteboard
) {
  await query(
    `INSERT INTO meeting_room (
      room_number,
      capacity,
      has_projector,
      has_whiteboard
    ) VALUES (?, ?, ?, ?)`,
    [roomNumber, capacity, hasProjector ? 1 : 0, hasWhiteboard ? 1 : 0]
  )

  return getMeetingRoomByNumber(roomNumber)
}

async function countUpcomingRoomBookings(roomNumber) {
  const rows = await query(
    `SELECT COUNT(*) AS booking_count
     FROM book_room
     WHERE room_number = ?
       AND end_time > NOW()`,
    [roomNumber]
  )

  return Number(rows[0]?.booking_count || 0)
}

async function updateMeetingRoom(
  currentRoomNumber,
  nextRoomNumber,
  capacity,
  hasProjector,
  hasWhiteboard
) {
  await query(
    `UPDATE meeting_room
     SET room_number = ?,
         capacity = ?,
         has_projector = ?,
         has_whiteboard = ?
     WHERE room_number = ?`,
    [
      nextRoomNumber,
      capacity,
      hasProjector ? 1 : 0,
      hasWhiteboard ? 1 : 0,
      currentRoomNumber,
    ]
  )

  return getMeetingRoomByNumber(nextRoomNumber)
}

async function deleteMeetingRoom(roomNumber) {
  await query(
    `DELETE FROM meeting_room
     WHERE room_number = ?`,
    [roomNumber]
  )
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
  getMeetingRoomByNumber,
  createMeetingRoom,
  countUpcomingRoomBookings,
  updateMeetingRoom,
  deleteMeetingRoom,
  getUserActiveBooking,
  hasRoomOverlap,
  createRoomBooking,
}
