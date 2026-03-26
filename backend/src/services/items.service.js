const { sendJson, parseJsonBody } = require("../utils")
const { query } = require("../database")
const {
  searchItems,
  getItemById,
  getItemGenres,
  getActiveHoldCountByItemId,
  normalizeItemTypeCode,
} = require("../models/items.model")

function parseNullableNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseNullableBlob(value) {
  const raw = String(value || "").trim()
  if (!raw) return null

  const parts = raw.split(",")
  if (parts.length === 2 && parts[0].includes("base64")) {
    try {
      return Buffer.from(parts[1], "base64")
    } catch {
      return null
    }
  }

  try {
    return Buffer.from(raw)
  } catch {
    return null
  }
}

async function getDefaultStaffId() {
  const rows = await query(
    `SELECT staff_id
     FROM staff_account
     ORDER BY staff_id ASC
     LIMIT 1`
  )

  return rows[0]?.staff_id || null
}

function formatThumbnail(thumbnail) {
  if (thumbnail && thumbnail instanceof Buffer) {
    return `data:image/jpeg;base64,${thumbnail.toString("base64")}`
  }
  return thumbnail
}

function formatListItem(item) {
  return {
    ...item,
    thumbnail_image: formatThumbnail(item.thumbnail_image),
    tag: "Library Item",
    availability: Number(item.in_stock) > 0 ? "Available" : "Not Available",
  }
}

async function handleGetItemsAll(_req, res) {
  try {
    const items = await searchItems({
      queryText: "",
      itemType: "All",
      limit: 100,
    })
    const formattedItems = items.map(formatListItem)

    sendJson(res, 200, { ok: true, items: formattedItems })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to fetch items",
      error: error.message,
    })
  }
}

async function handleGetItemById(_req, res, id) {
  try {
    const item = await getItemById(id)

    if (!item) {
      sendJson(res, 404, { ok: false, message: "Item not found" })
      return
    }

    const genres = await getItemGenres(id)

    let activeHoldsCount = 0
    try {
      activeHoldsCount = await getActiveHoldCountByItemId(id)
    } catch {
      activeHoldsCount = 0
    }

    sendJson(res, 200, {
      ok: true,
      item: {
        ...item,
        genres,
        thumbnail_image: formatThumbnail(item.thumbnail_image),
      },
      availability: Number(item.in_stock) > 0 ? "Available" : "Not Available",
      activeHoldsCount,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to fetch item",
      error: error.message,
    })
  }
}

async function handleSearchItems(_req, res, url) {
  try {
    const q = url.searchParams.get("q") || ""
    const type = url.searchParams.get("type") || "All"
    const limit = 50
    const items = await searchItems({ queryText: q, itemType: type, limit })

    sendJson(res, 200, {
      ok: true,
      items: items.map(formatListItem),
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to search items",
      error: error.message,
    })
  }
}

async function handleCreateItem(req, res) {
  try {
    const body = await parseJsonBody(req)
    const itemTypeCode = normalizeItemTypeCode(body.itemType)

    if (!itemTypeCode) {
      sendJson(res, 400, { ok: false, message: "Invalid itemType." })
      return
    }

    const createdBy = await getDefaultStaffId()
    if (!createdBy) {
      sendJson(res, 400, {
        ok: false,
        message: "No staff account found to own created item.",
      })
      return
    }

    const isBook = itemTypeCode === 1
    const isVideo = itemTypeCode === 2
    const isAudio = itemTypeCode === 3
    const isEquipment = itemTypeCode === 4

    const title = isBook
      ? String(body.title || "").trim()
      : isVideo
        ? String(body.videoName || "").trim()
        : isAudio
          ? String(body.audioName || "").trim()
          : String(body.rentalName || "").trim()

    if (!title) {
      sendJson(res, 400, { ok: false, message: "Item title is required." })
      return
    }

    const monetaryValue = parseNullableNumber(body.monetaryValue, 0)
    const itemsInStock = isBook
      ? parseNullableNumber(body.booksInStock, 0)
      : isVideo
        ? parseNullableNumber(body.videosInStock, 0)
        : isAudio
          ? parseNullableNumber(body.audiosInStock, 0)
          : parseNullableNumber(body.equipmentInStock, 0)

    const thumbnailImage = parseNullableBlob(body.thumbnailImage)

    const insertItemResult = await query(
      `INSERT INTO item (item_type_code, title, thumbnail_image, monetary_value, items_in_stock, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        itemTypeCode,
        title,
        thumbnailImage,
        monetaryValue,
        itemsInStock,
        createdBy,
      ]
    )

    const itemId = insertItemResult.insertId

    if (isBook) {
      await query(
        `INSERT INTO book (item_id, author, edition, publication, publication_date)
         VALUES (?, ?, ?, ?, ?)`,
        [
          itemId,
          String(body.author || "").trim() || "Unknown",
          String(body.edition || "").trim() || null,
          String(body.publication || "").trim() || "Unknown",
          String(body.publicationDate || "").trim() ||
            new Date().toISOString().slice(0, 10),
        ]
      )
    }

    if (isVideo) {
      await query(
        `INSERT INTO video (item_id, video_length_seconds, video_file)
         VALUES (?, ?, ?)`,
        [
          itemId,
          parseNullableNumber(body.videoLengthSeconds, 0),
          parseNullableBlob(body.videoFile) || Buffer.alloc(0),
        ]
      )
    }

    if (isAudio) {
      await query(
        `INSERT INTO audio (item_id, audio_length_seconds, audio_file)
         VALUES (?, ?, ?)`,
        [
          itemId,
          parseNullableNumber(body.audioLengthSeconds, 0),
          parseNullableBlob(body.audioFile) || Buffer.alloc(0),
        ]
      )
    }

    if (isEquipment) {
      await query(`INSERT INTO rental_equipment (item_id) VALUES (?)`, [itemId])
    }

    sendJson(res, 201, {
      ok: true,
      message: "Item created successfully.",
      itemId,
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to create item",
      error: error.message,
    })
  }
}

module.exports = {
  handleGetItemsAll,
  handleGetItemById,
  handleSearchItems,
  handleCreateItem,
}
