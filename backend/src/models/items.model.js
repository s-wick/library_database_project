const { query } = require("../database")

async function getAllBooks() {
  return query(
    `SELECT book_id as item_id, title, author as creator, 'Book' as standard_type, thumbnail_image, books_in_stock as in_stock FROM book`
  )
}

async function getAllAudios() {
  return query(
    `SELECT audio_id as item_id, audio_name as title, '' as creator, 'Audiobook' as standard_type, thumbnail_image, audios_in_stock as in_stock FROM audio`
  )
}

async function getAllVideos() {
  return query(
    `SELECT video_id as item_id, video_name as title, '' as creator, 'Video' as standard_type, thumbnail_image, videos_in_stock as in_stock FROM video`
  )
}

async function getAllEquipment() {
  return query(
    `SELECT equipment_id as item_id, rental_name as title, '' as creator, 'Equipment' as standard_type, thumbnail_image, equipment_in_stock as in_stock FROM rental_equipment`
  )
}

async function searchBooks(likeQuery) {
  return query(
    `SELECT book_id as item_id, title, author as creator, 'Book' as standard_type, thumbnail_image, books_in_stock as in_stock FROM book WHERE title LIKE ? OR author LIKE ? LIMIT 50`,
    [likeQuery, likeQuery]
  )
}

async function searchAudios(likeQuery) {
  return query(
    `SELECT audio_id as item_id, audio_name as title, '' as creator, 'Audiobook' as standard_type, thumbnail_image, audios_in_stock as in_stock FROM audio WHERE audio_name LIKE ? LIMIT 50`,
    [likeQuery]
  )
}

async function searchVideos(likeQuery) {
  return query(
    `SELECT video_id as item_id, video_name as title, '' as creator, 'Video' as standard_type, thumbnail_image, videos_in_stock as in_stock FROM video WHERE video_name LIKE ? LIMIT 50`,
    [likeQuery]
  )
}

async function searchEquipment(likeQuery) {
  return query(
    `SELECT equipment_id as item_id, rental_name as title, '' as creator, 'Equipment' as standard_type, thumbnail_image, equipment_in_stock as in_stock FROM rental_equipment WHERE rental_name LIKE ? LIMIT 50`,
    [likeQuery]
  )
}

async function getBookById(id) {
  const rows = await query(`SELECT * FROM book WHERE book_id = ? LIMIT 1`, [id])
  return rows[0] || null
}

async function getAudioById(id) {
  const rows = await query(`SELECT * FROM audio WHERE audio_id = ? LIMIT 1`, [
    id,
  ])
  return rows[0] || null
}

async function getVideoById(id) {
  const rows = await query(`SELECT * FROM video WHERE video_id = ? LIMIT 1`, [
    id,
  ])
  return rows[0] || null
}

async function getEquipmentById(id) {
  const rows = await query(
    `SELECT * FROM rental_equipment WHERE equipment_id = ? LIMIT 1`,
    [id]
  )
  return rows[0] || null
}

async function getActiveHoldCountByItemId(id) {
  const rows = await query(
    `SELECT count(*) as count FROM hold_item WHERE item_id = ? AND hold_status = 'active'`,
    [id]
  )
  return rows[0]?.count || 0
}

module.exports = {
  getAllBooks,
  getAllAudios,
  getAllVideos,
  getAllEquipment,
  searchBooks,
  searchAudios,
  searchVideos,
  searchEquipment,
  getBookById,
  getAudioById,
  getVideoById,
  getEquipmentById,
  getActiveHoldCountByItemId,
}
