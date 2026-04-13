const { query } = require("../database")

let hasMeetingRoomTvColumnPromise
let bookRoomColumnsPromise

async function ensureMeetingRoomTvColumn() {
  if (!hasMeetingRoomTvColumnPromise) {
    hasMeetingRoomTvColumnPromise = query(
      `SELECT 1
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?
       LIMIT 1`,
      ["meeting_room", "has_tv"]
    )
      .then(async (rows) => {
        if (rows.length > 0) {
          return true
        }

        await query(
          "ALTER TABLE meeting_room ADD COLUMN has_tv TINYINT(1) NOT NULL DEFAULT 0 AFTER has_whiteboard"
        )

        return true
      })
      .catch((error) => {
        hasMeetingRoomTvColumnPromise = null
        throw error
      })
  }

  return hasMeetingRoomTvColumnPromise
}

async function getMeetingRoomSelectColumns() {
  const supportsTv = await ensureMeetingRoomTvColumn()
  return supportsTv
    ? "room_number, capacity, has_projector, has_whiteboard, has_tv"
    : "room_number, capacity, has_projector, has_whiteboard"
}

async function getBookRoomColumns() {
  if (!bookRoomColumnsPromise) {
    bookRoomColumnsPromise = query(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME IN (?, ?, ?)
       ORDER BY ORDINAL_POSITION ASC`,
      ["book_room", "duration_hours", "duration_hour", "end_time"]
    )
      .then((rows) => {
        const columnNames = new Set(rows.map((row) => row.COLUMN_NAME))

        return {
          durationColumn: columnNames.has("duration_hours")
            ? "duration_hours"
            : columnNames.has("duration_hour")
              ? "duration_hour"
              : null,
          hasEndTime: columnNames.has("end_time"),
        }
      })
      .catch((error) => {
        bookRoomColumnsPromise = null
        throw error
      })
  }

  return bookRoomColumnsPromise
}

function getBookRoomDurationSelect(bookRoomColumns) {
  if (bookRoomColumns.durationColumn) {
    return `${bookRoomColumns.durationColumn} AS duration_hours`
  }

  if (bookRoomColumns.hasEndTime) {
    return "TIMESTAMPDIFF(HOUR, start_time, end_time) AS duration_hours"
  }

  return "0 AS duration_hours"
}

function getBookRoomEndExpression(bookRoomColumns) {
  if (bookRoomColumns.hasEndTime) {
    return "end_time"
  }

  if (bookRoomColumns.durationColumn) {
    return `DATE_ADD(start_time, INTERVAL ${bookRoomColumns.durationColumn} HOUR)`
  }

  return "start_time"
}

function mapRoomRow(row) {
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

async function getMeetingRooms() {
  const selectColumns = await getMeetingRoomSelectColumns()
  const rows = await query(
    `SELECT ${selectColumns}
     FROM meeting_room
     ORDER BY room_number ASC`
  )

  return rows.map(mapRoomRow)
}

async function getMeetingRoomByNumber(roomNumber) {
  const selectColumns = await getMeetingRoomSelectColumns()
  const rows = await query(
    `SELECT ${selectColumns}
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
  hasWhiteboard,
  hasTv
) {
  const supportsTv = await ensureMeetingRoomTvColumn()

  if (supportsTv) {
    await query(
      `INSERT INTO meeting_room (
        room_number,
        capacity,
        has_projector,
        has_whiteboard,
        has_tv
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        roomNumber,
        capacity,
        hasProjector ? 1 : 0,
        hasWhiteboard ? 1 : 0,
        hasTv ? 1 : 0,
      ]
    )
  } else {
    await query(
      `INSERT INTO meeting_room (
        room_number,
        capacity,
        has_projector,
        has_whiteboard
      ) VALUES (?, ?, ?, ?)`,
      [
        roomNumber,
        capacity,
        hasProjector ? 1 : 0,
        hasWhiteboard ? 1 : 0,
      ]
    )
  }

  return getMeetingRoomByNumber(roomNumber)
}

async function countUpcomingRoomBookings(roomNumber) {
  const bookRoomColumns = await getBookRoomColumns()
  const bookingEndExpression = getBookRoomEndExpression(bookRoomColumns)
  const rows = await query(
    `SELECT COUNT(*) AS booking_count
     FROM book_room
     WHERE room_number = ?
       AND ${bookingEndExpression} > NOW()`,
    [roomNumber]
  )

  return Number(rows[0]?.booking_count || 0)
}

async function updateMeetingRoom(
  currentRoomNumber,
  nextRoomNumber,
  capacity,
  hasProjector,
  hasWhiteboard,
  hasTv
) {
  const supportsTv = await ensureMeetingRoomTvColumn()

  if (supportsTv) {
    await query(
      `UPDATE meeting_room
       SET room_number = ?,
           capacity = ?,
           has_projector = ?,
           has_whiteboard = ?,
           has_tv = ?
       WHERE room_number = ?`,
      [
        nextRoomNumber,
        capacity,
        hasProjector ? 1 : 0,
        hasWhiteboard ? 1 : 0,
        hasTv ? 1 : 0,
        currentRoomNumber,
      ]
    )
  } else {
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
  }

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
  const bookRoomColumns = await getBookRoomColumns()
  const bookingDurationSelect = getBookRoomDurationSelect(bookRoomColumns)
  const bookingEndExpression = getBookRoomEndExpression(bookRoomColumns)
  const rows = await query(
    `SELECT room_number, start_time, ${bookingDurationSelect}
     FROM book_room
     WHERE user_id = ?
       AND ${bookingEndExpression} > NOW()
     ORDER BY start_time ASC
     LIMIT 1`,
    [userId]
  )

  return rows[0] || null
}

async function getRoomBookingsInWindow(roomNumber, windowStart, windowEnd) {
  const bookRoomColumns = await getBookRoomColumns()
  const bookingDurationSelect = getBookRoomDurationSelect(bookRoomColumns)
  const bookingEndExpression = getBookRoomEndExpression(bookRoomColumns)
  const rows = await query(
    `SELECT room_number, start_time, ${bookingDurationSelect}
     FROM book_room
     WHERE room_number = ?
       AND start_time < ?
       AND ${bookingEndExpression} > ?
     ORDER BY start_time ASC`,
    [roomNumber, windowEnd, windowStart]
  )

  return rows
}

async function hasRoomOverlap(roomNumber, startTime, endTime) {
  const bookRoomColumns = await getBookRoomColumns()
  const bookingEndExpression = getBookRoomEndExpression(bookRoomColumns)
  const rows = await query(
    `SELECT 1
     FROM book_room
     WHERE room_number = ?
       AND start_time < ?
       AND ${bookingEndExpression} > ?
     LIMIT 1`,
    [roomNumber, endTime, startTime]
  )

  return rows.length > 0
}

async function createRoomBooking(userId, roomNumber, startTime, durationHours) {
  const bookRoomColumns = await getBookRoomColumns()
  const bookingDurationSelect = getBookRoomDurationSelect(bookRoomColumns)

  if (bookRoomColumns.durationColumn) {
    await query(
      `INSERT INTO book_room (room_number, user_id, start_time, ${bookRoomColumns.durationColumn})
       VALUES (?, ?, ?, ?)`,
      [roomNumber, userId, startTime, durationHours]
    )

    const rows = await query(
      `SELECT room_number, start_time, ${bookingDurationSelect}
       FROM book_room
       WHERE room_number = ?
         AND user_id = ?
         AND start_time = ?
         AND ${bookRoomColumns.durationColumn} = ?
       LIMIT 1`,
      [roomNumber, userId, startTime, durationHours]
    )

    return rows[0] || null
  }

  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000)

  await query(
    `INSERT INTO book_room (room_number, user_id, start_time, end_time)
     VALUES (?, ?, ?, ?)`,
    [roomNumber, userId, startTime, endTime]
  )

  const rows = await query(
    `SELECT room_number, start_time, ${bookingDurationSelect}
     FROM book_room
     WHERE room_number = ?
       AND user_id = ?
       AND start_time = ?
       AND end_time = ?
     LIMIT 1`,
    [roomNumber, userId, startTime, endTime]
  )

  return rows[0] || null
}

module.exports = {
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
}
