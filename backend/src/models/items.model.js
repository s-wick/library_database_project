const { query } = require("../database")

const ITEM_TYPE_CODE_MAP = {
  book: 1,
  audio: 2,
  audiobook: 2,
  video: 3,
  equipment: 4,
  rental_equipment: 4,
}

const STANDARD_TYPE_BY_CODE = {
  1: "Book",
  2: "Audiobook",
  3: "Video",
  4: "Equipment",
}

function normalizeItemTypeCode(type) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase()
  return ITEM_TYPE_CODE_MAP[normalized] || null
}

function mapItemRow(row) {
  const standardType = STANDARD_TYPE_BY_CODE[row.item_type_code] || "Item"
  const creator = row.item_type_code === 1 ? row.author || "" : ""
  const genres = String(row.genres_csv || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  return {
    item_id: row.item_id,
    item_type_code: row.item_type_code,
    title: row.title,
    monetary_value: row.monetary_value,
    standard_type: standardType,
    creator,
    thumbnail_image: row.thumbnail_image,
    inventory: Number(row.inventory || 0),
    stock: Number(row.stock || 0),
    author: row.author,
    genres,
    edition: row.edition,
    publication: row.publication,
    publication_date: row.publication_date,
    audio_length_seconds: row.audio_length_seconds,
    video_length_seconds: row.video_length_seconds,
    duration:
      row.item_type_code === 3
        ? row.audio_length_seconds
        : row.item_type_code === 2
          ? row.video_length_seconds
          : null,
  }
}

async function searchItems({ queryText = "", itemType = "All", limit = 50 }) {
  const typeCode = normalizeItemTypeCode(itemType)
  const trimmedQuery = String(queryText || "").trim()
  const likeQuery = `%${trimmedQuery}%`
  const parsedLimit = Number.parseInt(limit, 10)
  const safeLimit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 200)
    : 50

  const filters = []
  const params = []

  if (typeCode) {
    filters.push("i.item_type_code = ?")
    params.push(typeCode)
  }

  if (trimmedQuery) {
    filters.push(`(
      i.title LIKE ?
      OR COALESCE(b.author, '') LIKE ?
      OR COALESCE(b.publication, '') LIKE ?
      OR EXISTS (
        SELECT 1
        FROM assigned_genres ag
        INNER JOIN genre g ON g.genre_id = ag.genre_id
        WHERE ag.item_id = i.item_id
          AND g.genre_text LIKE ?
      )
    )`)
    params.push(likeQuery, likeQuery, likeQuery, likeQuery)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : ""

  const rows = await query(
    `SELECT
       i.item_id,
       i.item_type_code,
       i.title,
       i.monetary_value,
       i.thumbnail_image,
       i.inventory,
       GREATEST(i.inventory - COALESCE(ab.active_borrow_count, 0), 0) AS stock,
       b.author,
       b.edition,
       b.publication,
       b.publication_date,
       a.audio_length_seconds,
       v.video_length_seconds,
       ga.genres_csv
     FROM (
       SELECT
         i.item_id,
         i.created_at
       FROM item i
       LEFT JOIN book b ON b.item_id = i.item_id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT ${safeLimit}
     ) recent
     INNER JOIN item i ON i.item_id = recent.item_id
     LEFT JOIN book b ON b.item_id = i.item_id
     LEFT JOIN audio a ON a.item_id = i.item_id
     LEFT JOIN video v ON v.item_id = i.item_id
     LEFT JOIN (
       SELECT
         item_id,
         COUNT(*) AS active_borrow_count
       FROM borrow
       WHERE return_date IS NULL
       GROUP BY item_id
     ) ab ON ab.item_id = i.item_id
     LEFT JOIN (
       SELECT
         ag.item_id,
         GROUP_CONCAT(DISTINCT g.genre_text SEPARATOR ',') AS genres_csv
       FROM assigned_genres ag
       INNER JOIN genre g ON g.genre_id = ag.genre_id
       GROUP BY ag.item_id
     ) ga ON ga.item_id = i.item_id
     ORDER BY recent.created_at DESC`,
    params
  )

  return rows.map(mapItemRow)
}

async function getItemById(itemId) {
  const rows = await query(
    `SELECT
       i.item_id,
       i.item_type_code,
       i.title,
       i.monetary_value,
       i.thumbnail_image,
       i.inventory,
       GREATEST(i.inventory - COALESCE(ab.active_borrow_count, 0), 0) AS stock,
       b.author,
       b.edition,
       b.publication,
       b.publication_date,
       a.audio_length_seconds,
       v.video_length_seconds
     FROM item i
     LEFT JOIN book b ON b.item_id = i.item_id
     LEFT JOIN audio a ON a.item_id = i.item_id
     LEFT JOIN video v ON v.item_id = i.item_id
    LEFT JOIN (
      SELECT
        item_id,
        COUNT(*) AS active_borrow_count
      FROM borrow
      WHERE return_date IS NULL
      GROUP BY item_id
    ) ab ON ab.item_id = i.item_id
     LEFT JOIN rental_equipment re ON re.item_id = i.item_id
     WHERE i.item_id = ?
     LIMIT 1`,
    [itemId]
  )

  if (!rows.length) return null
  return mapItemRow(rows[0])
}

async function getItemGenres(itemId) {
  const rows = await query(
    `SELECT g.genre_text
     FROM assigned_genres ag
     INNER JOIN genre g ON g.genre_id = ag.genre_id
     WHERE ag.item_id = ?
     ORDER BY g.genre_text ASC`,
    [itemId]
  )

  return rows.map((row) => row.genre_text)
}

async function getActiveHoldCountByItemId(itemId) {
  const rows = await query(
    `SELECT COUNT(*) AS count
     FROM hold_item
     WHERE item_id = ?`,
    [itemId]
  )
  return rows[0]?.count || 0
}

module.exports = {
  searchItems,
  getItemById,
  getItemGenres,
  getActiveHoldCountByItemId,
  normalizeItemTypeCode,
}
