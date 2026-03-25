const { query } = require("../db")
const { sendJson } = require("../utils")

async function handleGetItemsAll(req, res) {
  try {
    const books = await query(
      `SELECT book_id as item_id, title, author as creator, 'Book' as standard_type, thumbnail_image, books_in_stock as in_stock FROM book`
    )
    const audios = await query(
      `SELECT audio_id as item_id, audio_name as title, '' as creator, 'Audiobook' as standard_type, thumbnail_image, audios_in_stock as in_stock FROM audio`
    )
    const videos = await query(
      `SELECT video_id as item_id, video_name as title, '' as creator, 'Video' as standard_type, thumbnail_image, videos_in_stock as in_stock FROM video`
    )
    const equipment = await query(
      `SELECT equipment_id as item_id, rental_name as title, '' as creator, 'Equipment' as standard_type, thumbnail_image, equipment_in_stock as in_stock FROM rental_equipment`
    )

    // Combine all
    const items = [...books, ...audios, ...videos, ...equipment]

    // Convert Buffer/blob to base64 or keep as is if it's string URL.
    // Assuming thumbnail_image is URL/String for now. If Blob, we might need to convert.
    // Actually the schema says `blob` but in dummy data it was string.
    // We will just pass it, maybe converting to base64 if it's an object.
    const formattedItems = items.map((item) => {
      let thumb = item.thumbnail_image
      if (thumb && thumb instanceof Buffer) {
        thumb = `data:image/jpeg;base64,${thumb.toString("base64")}`
      }
      return {
        ...item,
        thumbnail_image: thumb,
        tag: "Library Item", // default tag
        availability: item.in_stock > 0 ? "Available" : "Not Available",
      }
    })

    sendJson(res, 200, { ok: true, items: formattedItems })
  } catch (error) {
    console.error(error)
    sendJson(res, 500, {
      ok: false,
      message: "Failed to fetch items",
      error: error.message,
    })
  }
}

async function handleGetItemById(req, res, type, id) {
  try {
    let item = null

    if (type === "book") {
      const rows = await query(`SELECT * FROM book WHERE book_id = ?`, [id])
      if (rows.length) {
        item = rows[0]
        item.item_id = item.book_id
        item.standard_type = "Book"
        item.in_stock = item.books_in_stock
      }
    } else if (type === "audiobook" || type === "audio") {
      const rows = await query(`SELECT * FROM audio WHERE audio_id = ?`, [id])
      if (rows.length) {
        item = rows[0]
        item.item_id = item.audio_id
        item.title = item.audio_name
        item.standard_type = "Audiobook"
        item.duration = item.audio_length_seconds / 60
        item.in_stock = item.audios_in_stock
      }
    } else if (type === "video") {
      const rows = await query(`SELECT * FROM video WHERE video_id = ?`, [id])
      if (rows.length) {
        item = rows[0]
        item.item_id = item.video_id
        item.title = item.video_name
        item.standard_type = "Video"
        item.duration = item.video_length_seconds / 60
        item.in_stock = item.videos_in_stock
      }
    } else if (type === "equipment") {
      const rows = await query(
        `SELECT * FROM rental_equipment WHERE equipment_id = ?`,
        [id]
      )
      if (rows.length) {
        item = rows[0]
        item.item_id = item.equipment_id
        item.title = item.rental_name
        item.standard_type = "Equipment"
        item.in_stock = item.equipment_in_stock
      }
    }

    if (!item) {
      return sendJson(res, 404, { ok: false, message: "Item not found" })
    }

    if (item.thumbnail_image && item.thumbnail_image instanceof Buffer) {
      item.thumbnail_image = `data:image/jpeg;base64,${item.thumbnail_image.toString("base64")}`
    }

    // Availability mocking for now
    let activeHoldsCount = 0
    try {
      const holds = await query(
        `SELECT count(*) as count FROM hold_item WHERE item_id = ? AND hold_status = 'active'`,
        [id]
      )
      if (holds.length) activeHoldsCount = holds[0].count
    } catch (err) {
      console.error("Failed to fetch holds count", err)
    }

    sendJson(res, 200, {
      ok: true,
      item,
      availability: item.in_stock > 0 ? "Available" : "Not Available",
      activeHoldsCount,
    })
  } catch (error) {
    console.error(error)
    sendJson(res, 500, {
      ok: false,
      message: "Failed to fetch item",
      error: error.message,
    })
  }
}

async function handleSearchItems(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`)
    const q = url.searchParams.get("q") || ""
    const type = url.searchParams.get("type") || "All"

    let items = []

    const likeQuery = `%${q}%`
    const shouldSearchAll = type === "All"
    const limit = 50

    if (shouldSearchAll || type === "Book") {
      const books = await query(
        `SELECT book_id as item_id, title, author as creator, 'Book' as standard_type, thumbnail_image, books_in_stock as in_stock, description FROM book WHERE title LIKE ? OR author LIKE ? OR description LIKE ? LIMIT ?`,
        [likeQuery, likeQuery, likeQuery, limit]
      )
      items.push(...books)
    }

    if (shouldSearchAll || type === "Audiobook") {
      const audios = await query(
        `SELECT audio_id as item_id, audio_name as title, '' as creator, 'Audiobook' as standard_type, thumbnail_image, audios_in_stock as in_stock, description FROM audio WHERE audio_name LIKE ? OR description LIKE ? LIMIT ?`,
        [likeQuery, likeQuery, limit]
      )
      items.push(...audios)
    }

    if (shouldSearchAll || type === "Video") {
      const videos = await query(
        `SELECT video_id as item_id, video_name as title, '' as creator, 'Video' as standard_type, thumbnail_image, videos_in_stock as in_stock, description FROM video WHERE video_name LIKE ? OR description LIKE ? LIMIT ?`,
        [likeQuery, likeQuery, limit]
      )
      items.push(...videos)
    }

    if (shouldSearchAll || type === "Equipment") {
      const equipment = await query(
        `SELECT equipment_id as item_id, rental_name as title, '' as creator, 'Equipment' as standard_type, thumbnail_image, equipment_in_stock as in_stock, description FROM rental_equipment WHERE rental_name LIKE ? OR description LIKE ? LIMIT ?`,
        [likeQuery, likeQuery, limit]
      )
      items.push(...equipment)
    }

    items = items.slice(0, limit)

    const formattedItems = items.map((item) => {
      let thumb = item.thumbnail_image
      if (thumb && thumb instanceof Buffer) {
        thumb = `data:image/jpeg;base64,${thumb.toString("base64")}`
      }
      return {
        ...item,
        thumbnail_image: thumb,
        tag: "Library Item",
        availability: item.in_stock > 0 ? "Available" : "Not Available",
      }
    })

    sendJson(res, 200, { ok: true, items: formattedItems })
  } catch (error) {
    console.error(error)
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
