const { query } = require("../database")

function normalizeLookupValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
}

function toStandardType(itemTypeText) {
  const normalized = normalizeLookupValue(itemTypeText)
  if (normalized === "book") return "Book"
  if (normalized === "audio" || normalized === "audiobook") {
    return "Audiobook"
  }
  if (normalized === "video") return "Video"
  if (normalized === "rental equipment" || normalized === "equipment") {
    return "Equipment"
  }

  return String(itemTypeText || "Item").trim() || "Item"
}

async function normalizeItemTypeCode(type) {
  const normalizedInput = normalizeLookupValue(type)
  if (!normalizedInput || normalizedInput === "all") return null

  const aliasMap = {
    audiobook: "audio",
    equipment: "rental equipment",
    rental_equipment: "rental equipment",
  }
  const targetValue = aliasMap[normalizedInput] || normalizedInput

  const rows = await query(
    `SELECT item_code, item_type
     FROM item_type`
  )

  const match = rows.find((row) => {
    const rowType = normalizeLookupValue(row.item_type)
    return rowType === targetValue
  })

  return match ? Number(match.item_code) : null
}

function mapItemRow(row) {
  const normalizedItemType = normalizeLookupValue(row.item_type)
  const standardType = toStandardType(row.item_type)
  const creator = normalizedItemType === "book" ? row.author || "" : ""
  const genres = String(row.genres_csv || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  return {
    item_id: row.item_id,
    item_type_code: row.item_type_code,
    title: row.title,
    monetary_value: row.monetary_value,
    is_withdrawn: Number(row.is_withdrawn || 0),
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
      normalizedItemType === "audio"
        ? row.audio_length_seconds
        : normalizedItemType === "video"
          ? row.video_length_seconds
          : null,
  }
}

async function searchItems({
  queryText = "",
  itemType = "All",
  limit = 50,
  includeWithdrawn = false,
}) {
  const typeCode = await normalizeItemTypeCode(itemType)
  const trimmedQuery = String(queryText || "").trim()
  const likeQuery = `%${trimmedQuery}%`
  const parsedLimit = Number.parseInt(limit, 10)
  const safeLimit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 200)
    : 50

  const filters = []
  const params = []

  if (!includeWithdrawn) {
    filters.push("i.is_withdrawn = 0")
  }

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
       it.item_type,
       i.title,
       i.monetary_value,
       i.thumbnail_image,
       i.inventory,
       i.is_withdrawn,
       GREATEST(
         CAST(i.inventory AS SIGNED) - COALESCE(CAST(ab.active_borrow_count AS SIGNED), 0),
         0
       ) AS stock,
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
    LEFT JOIN item_type it ON it.item_code = i.item_type_code
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
       it.item_type,
       i.title,
       i.monetary_value,
       i.thumbnail_image,
       i.inventory,
       i.is_withdrawn,
       i.withdrawn_at,
       i.withdrawn_by,
       GREATEST(
         CAST(i.inventory AS SIGNED) - COALESCE(CAST(ab.active_borrow_count AS SIGNED), 0),
         0
       ) AS stock,
       b.author,
       b.edition,
       b.publication,
       b.publication_date,
       a.audio_length_seconds,
       v.video_length_seconds
     FROM item i
    LEFT JOIN item_type it ON it.item_code = i.item_type_code
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
     WHERE item_id = ?
       AND close_datetime IS NULL`,
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
