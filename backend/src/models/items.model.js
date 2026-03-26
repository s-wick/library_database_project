const { query } = require("../database")

const ITEM_TYPE_CODE_MAP = {
  book: 1,
  video: 2,
  audiobook: 3,
  audio: 3,
  equipment: 4,
  rental_equipment: 4,
}

const STANDARD_TYPE_BY_CODE = {
  1: "Book",
  2: "Video",
  3: "Audiobook",
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
    in_stock: row.in_stock,
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
      OR COALESCE(g.genre_text, '') LIKE ?
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
       i.items_in_stock AS in_stock,
       b.author,
       b.edition,
       b.publication,
       b.publication_date,
       a.audio_length_seconds,
       v.video_length_seconds,
       MAX(g.genre_text) AS genre_text,
       GROUP_CONCAT(DISTINCT g.genre_text ORDER BY g.genre_text SEPARATOR ',') AS genres_csv
     FROM item i
     LEFT JOIN book b ON b.item_id = i.item_id
     LEFT JOIN audio a ON a.item_id = i.item_id
     LEFT JOIN video v ON v.item_id = i.item_id
     LEFT JOIN assigned_genres ag ON ag.item_id = i.item_id
     LEFT JOIN genre g ON g.genre_id = ag.genre_id
     ${whereClause}
     GROUP BY
       i.item_id,
       i.item_type_code,
       i.title,
      i.monetary_value,
       i.thumbnail_image,
       i.items_in_stock,
       b.author,
       b.edition,
       b.publication,
       b.publication_date,
       a.audio_length_seconds,
       v.video_length_seconds
     ORDER BY i.created_at DESC
     LIMIT ${safeLimit}`,
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
       i.items_in_stock AS in_stock,
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
