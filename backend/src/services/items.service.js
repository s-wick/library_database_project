const { sendJson } = require("../utils")
const {
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
} = require("../models/items.model")

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
    availability: item.in_stock > 0 ? "Available" : "Not Available",
  }
}

async function handleGetItemsAll(_req, res) {
  try {
    const [books, audios, videos, equipment] = await Promise.all([
      getAllBooks(),
      getAllAudios(),
      getAllVideos(),
      getAllEquipment(),
    ])

    const items = [...books, ...audios, ...videos, ...equipment]
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

function normalizeItemForDetail(type, row) {
  if (!row) return null

  if (type === "book") {
    return {
      ...row,
      item_id: row.book_id,
      standard_type: "Book",
      in_stock: row.books_in_stock,
      thumbnail_image: formatThumbnail(row.thumbnail_image),
    }
  }

  if (type === "audiobook" || type === "audio") {
    return {
      ...row,
      item_id: row.audio_id,
      title: row.audio_name,
      standard_type: "Audiobook",
      duration: row.audio_length_seconds / 60,
      in_stock: row.audios_in_stock,
      thumbnail_image: formatThumbnail(row.thumbnail_image),
    }
  }

  if (type === "video") {
    return {
      ...row,
      item_id: row.video_id,
      title: row.video_name,
      standard_type: "Video",
      duration: row.video_length_seconds / 60,
      in_stock: row.videos_in_stock,
      thumbnail_image: formatThumbnail(row.thumbnail_image),
    }
  }

  if (type === "equipment") {
    return {
      ...row,
      item_id: row.equipment_id,
      title: row.rental_name,
      standard_type: "Equipment",
      in_stock: row.equipment_in_stock,
      thumbnail_image: formatThumbnail(row.thumbnail_image),
    }
  }

  return null
}

async function handleGetItemById(_req, res, type, id) {
  try {
    const normalizedType = String(type || "").toLowerCase()

    let rawItem = null
    if (normalizedType === "book") rawItem = await getBookById(id)
    else if (normalizedType === "audiobook" || normalizedType === "audio") {
      rawItem = await getAudioById(id)
    } else if (normalizedType === "video") {
      rawItem = await getVideoById(id)
    } else if (normalizedType === "equipment") {
      rawItem = await getEquipmentById(id)
    }

    const item = normalizeItemForDetail(normalizedType, rawItem)

    if (!item) {
      sendJson(res, 404, { ok: false, message: "Item not found" })
      return
    }

    let activeHoldsCount = 0
    try {
      activeHoldsCount = await getActiveHoldCountByItemId(id)
    } catch {
      activeHoldsCount = 0
    }

    sendJson(res, 200, {
      ok: true,
      item,
      availability: item.in_stock > 0 ? "Available" : "Not Available",
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
    const likeQuery = `%${q}%`
    const shouldSearchAll = type === "All"
    const limit = 50

    let items = []

    if (shouldSearchAll || type === "Book") {
      const books = await searchBooks(likeQuery)
      items.push(...books)
    }

    if (shouldSearchAll || type === "Audiobook") {
      const audios = await searchAudios(likeQuery)
      items.push(...audios)
    }

    if (shouldSearchAll || type === "Video") {
      const videos = await searchVideos(likeQuery)
      items.push(...videos)
    }

    if (shouldSearchAll || type === "Equipment") {
      const equipment = await searchEquipment(likeQuery)
      items.push(...equipment)
    }

    items = items.slice(0, limit)

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

module.exports = {
  handleGetItemsAll,
  handleGetItemById,
  handleSearchItems,
}
