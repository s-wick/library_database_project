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

function parseInventoryForCreate(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return 0
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
    return null
  }

  return parsed
}

function parseInventoryForUpdate(value) {
  const normalized = String(value ?? "").trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
    return null
  }

  return parsed
}

function parseOptionalString(value) {
  if (value === undefined) return undefined
  const normalized = String(value || "").trim()
  return normalized || null
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

function parseGenres(value) {
  if (value === undefined) return undefined

  const rawValues = Array.isArray(value) ? value : String(value).split(",")
  const deduped = new Map()

  for (const entry of rawValues) {
    const normalized = String(entry || "").trim()
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (!deduped.has(key)) {
      deduped.set(key, normalized)
    }
  }

  return Array.from(deduped.values())
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

async function getActiveBorrowCountForItem(itemId) {
  const rows = await query(
    `SELECT COUNT(*) AS active_borrow_count
     FROM borrow
     WHERE item_id = ?
       AND return_date IS NULL`,
    [itemId]
  )

  return Number(rows[0]?.active_borrow_count || 0)
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
    availability: Number(item.stock) > 0 ? "Available" : "Not Available",
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
      availability: Number(item.stock) > 0 ? "Available" : "Not Available",
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

async function handleSearchGenres(_req, res, url) {
  try {
    const q = String(url.searchParams.get("q") || "")
      .trim()
      .toLowerCase()
    const rows = await query(
      `SELECT genre_text
       FROM genre
       ORDER BY genre_text ASC
       LIMIT 100`
    )

    const genres = rows
      .map((row) => String(row.genre_text || "").trim())
      .filter(Boolean)
      .filter((genre) => !q || genre.toLowerCase().includes(q))

    sendJson(res, 200, { ok: true, genres })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to search genres",
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
    const inventory = parseInventoryForCreate(body.inventory)
    if (inventory === null) {
      sendJson(res, 400, {
        ok: false,
        message: "Inventory must be an integer between 0 and 255.",
      })
      return
    }

    const thumbnailImage = parseNullableBlob(body.thumbnailImage)

    const insertItemResult = await query(
      `INSERT INTO item (item_type_code, title, thumbnail_image, monetary_value, inventory, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [itemTypeCode, title, thumbnailImage, monetaryValue, inventory, createdBy]
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

    const nextGenres = parseGenres(body.genres)
    if (nextGenres !== undefined) {
      const invalidGenre = nextGenres.find((genreText) => genreText.length > 15)
      if (invalidGenre) {
        sendJson(res, 400, {
          ok: false,
          message: `Genre "${invalidGenre}" is too long (max 15 characters).`,
        })
        return
      }

      if (nextGenres.length) {
        const loweredGenres = nextGenres.map((genreText) =>
          genreText.toLowerCase()
        )
        const placeholders = loweredGenres.map(() => "?").join(",")
        const existingGenres = await query(
          `SELECT genre_id, genre_text
           FROM genre
           WHERE LOWER(genre_text) IN (${placeholders})`,
          loweredGenres
        )

        const genreIdByText = new Map(
          existingGenres.map((row) => [
            String(row.genre_text).toLowerCase(),
            row.genre_id,
          ])
        )

        const missingGenres = nextGenres.filter(
          (genreText) => !genreIdByText.has(genreText.toLowerCase())
        )

        if (missingGenres.length) {
          const staffId = await getDefaultStaffId()
          if (!staffId) {
            sendJson(res, 400, {
              ok: false,
              message: "No staff account found to create new genres.",
            })
            return
          }

          for (const genreText of missingGenres) {
            const result = await query(
              `INSERT INTO genre (genre_text, created_by)
               VALUES (?, ?)`,
              [genreText, staffId]
            )
            genreIdByText.set(genreText.toLowerCase(), result.insertId)
          }
        }

        for (const genreText of nextGenres) {
          const genreId = genreIdByText.get(genreText.toLowerCase())
          if (!genreId) continue
          await query(
            `INSERT INTO assigned_genres (item_id, genre_id)
             VALUES (?, ?)`,
            [itemId, genreId]
          )
        }
      }
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

async function handleUpdateItem(req, res, id) {
  try {
    const body = await parseJsonBody(req)
    const itemId = Number(id)

    if (!Number.isFinite(itemId)) {
      sendJson(res, 400, { ok: false, message: "Invalid item id." })
      return
    }

    const existingRows = await query(
      `SELECT item_id, item_type_code
       FROM item
       WHERE item_id = ?
       LIMIT 1`,
      [itemId]
    )

    if (!existingRows.length) {
      sendJson(res, 404, { ok: false, message: "Item not found." })
      return
    }

    const itemTypeCode = existingRows[0].item_type_code
    const isBook = itemTypeCode === 1
    const isVideo = itemTypeCode === 2
    const isAudio = itemTypeCode === 3

    const itemSet = []
    const itemParams = []

    const nextTitle =
      body.title !== undefined
        ? String(body.title || "").trim()
        : isVideo && body.videoName !== undefined
          ? String(body.videoName || "").trim()
          : isAudio && body.audioName !== undefined
            ? String(body.audioName || "").trim()
            : body.rentalName !== undefined
              ? String(body.rentalName || "").trim()
              : undefined

    if (nextTitle !== undefined) {
      if (!nextTitle) {
        sendJson(res, 400, { ok: false, message: "Item title is required." })
        return
      }
      itemSet.push("title = ?")
      itemParams.push(nextTitle)
    }

    if (body.monetaryValue !== undefined) {
      itemSet.push("monetary_value = ?")
      itemParams.push(parseNullableNumber(body.monetaryValue, 0))
    }

    if (body.inventory !== undefined) {
      const parsedInventory = parseInventoryForUpdate(body.inventory)
      if (parsedInventory === null) {
        sendJson(res, 400, {
          ok: false,
          message: "Inventory must be an integer between 0 and 255.",
        })
        return
      }

      const activeBorrowCount = await getActiveBorrowCountForItem(itemId)
      if (parsedInventory < activeBorrowCount) {
        sendJson(res, 400, {
          ok: false,
          message:
            "Inventory cannot be lower than the current active borrow count for this item.",
        })
        return
      }

      itemSet.push("inventory = ?")
      itemParams.push(parsedInventory)
    }

    if (body.thumbnailImage !== undefined) {
      itemSet.push("thumbnail_image = ?")
      itemParams.push(parseNullableBlob(body.thumbnailImage))
    }

    if (itemSet.length) {
      await query(
        `UPDATE item
         SET ${itemSet.join(", ")}
         WHERE item_id = ?`,
        [...itemParams, itemId]
      )
    }

    if (isBook) {
      const bookSet = []
      const bookParams = []

      if (body.author !== undefined) {
        bookSet.push("author = ?")
        bookParams.push(String(body.author || "").trim() || "Unknown")
      }
      if (body.edition !== undefined) {
        bookSet.push("edition = ?")
        bookParams.push(parseOptionalString(body.edition))
      }
      if (body.publication !== undefined) {
        bookSet.push("publication = ?")
        bookParams.push(String(body.publication || "").trim() || "Unknown")
      }
      if (body.publicationDate !== undefined) {
        bookSet.push("publication_date = ?")
        bookParams.push(
          String(body.publicationDate || "").trim() ||
            new Date().toISOString().slice(0, 10)
        )
      }

      if (bookSet.length) {
        await query(
          `UPDATE book
           SET ${bookSet.join(", ")}
           WHERE item_id = ?`,
          [...bookParams, itemId]
        )
      }
    }

    if (isVideo) {
      const videoSet = []
      const videoParams = []

      if (body.videoLengthSeconds !== undefined) {
        videoSet.push("video_length_seconds = ?")
        videoParams.push(parseNullableNumber(body.videoLengthSeconds, 0))
      }
      if (body.videoFile !== undefined) {
        videoSet.push("video_file = ?")
        videoParams.push(parseNullableBlob(body.videoFile) || Buffer.alloc(0))
      }

      if (videoSet.length) {
        await query(
          `UPDATE video
           SET ${videoSet.join(", ")}
           WHERE item_id = ?`,
          [...videoParams, itemId]
        )
      }
    }

    if (isAudio) {
      const audioSet = []
      const audioParams = []

      if (body.audioLengthSeconds !== undefined) {
        audioSet.push("audio_length_seconds = ?")
        audioParams.push(parseNullableNumber(body.audioLengthSeconds, 0))
      }
      if (body.audioFile !== undefined) {
        audioSet.push("audio_file = ?")
        audioParams.push(parseNullableBlob(body.audioFile) || Buffer.alloc(0))
      }

      if (audioSet.length) {
        await query(
          `UPDATE audio
           SET ${audioSet.join(", ")}
           WHERE item_id = ?`,
          [...audioParams, itemId]
        )
      }
    }

    const nextGenres = parseGenres(body.genres)
    if (nextGenres !== undefined) {
      const invalidGenre = nextGenres.find((genreText) => genreText.length > 15)
      if (invalidGenre) {
        sendJson(res, 400, {
          ok: false,
          message: `Genre "${invalidGenre}" is too long (max 15 characters).`,
        })
        return
      }

      await query(`DELETE FROM assigned_genres WHERE item_id = ?`, [itemId])

      if (nextGenres.length) {
        const loweredGenres = nextGenres.map((genreText) =>
          genreText.toLowerCase()
        )
        const placeholders = loweredGenres.map(() => "?").join(",")
        const existingGenres = await query(
          `SELECT genre_id, genre_text
           FROM genre
           WHERE LOWER(genre_text) IN (${placeholders})`,
          loweredGenres
        )

        const genreIdByText = new Map(
          existingGenres.map((row) => [
            String(row.genre_text).toLowerCase(),
            row.genre_id,
          ])
        )

        const missingGenres = nextGenres.filter(
          (genreText) => !genreIdByText.has(genreText.toLowerCase())
        )

        if (missingGenres.length) {
          const createdBy = await getDefaultStaffId()
          if (!createdBy) {
            sendJson(res, 400, {
              ok: false,
              message: "No staff account found to create new genres.",
            })
            return
          }

          for (const genreText of missingGenres) {
            const result = await query(
              `INSERT INTO genre (genre_text, created_by)
               VALUES (?, ?)`,
              [genreText, createdBy]
            )
            genreIdByText.set(genreText.toLowerCase(), result.insertId)
          }
        }

        for (const genreText of nextGenres) {
          const genreId = genreIdByText.get(genreText.toLowerCase())
          if (!genreId) continue
          await query(
            `INSERT INTO assigned_genres (item_id, genre_id)
             VALUES (?, ?)`,
            [itemId, genreId]
          )
        }
      }
    }

    sendJson(res, 200, { ok: true, message: "Item updated successfully." })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to update item",
      error: error.message,
    })
  }
}

async function handleDeleteItem(_req, res, id) {
  try {
    const itemId = Number(id)
    if (!Number.isFinite(itemId)) {
      sendJson(res, 400, { ok: false, message: "Invalid item id." })
      return
    }

    try {
      await query(`DELETE FROM assigned_genres WHERE item_id = ?`, [itemId])
      const result = await query(`DELETE FROM item WHERE item_id = ?`, [itemId])
      if (!result.affectedRows) {
        sendJson(res, 404, { ok: false, message: "Item not found." })
        return
      }
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        sendJson(res, 409, {
          ok: false,
          message:
            "Item cannot be removed because it is referenced by existing records.",
        })
        return
      }
      throw error
    }

    sendJson(res, 200, { ok: true, message: "Item removed successfully." })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: "Failed to remove item",
      error: error.message,
    })
  }
}

module.exports = {
  handleGetItemsAll,
  handleGetItemById,
  handleSearchItems,
  handleSearchGenres,
  handleCreateItem,
  handleUpdateItem,
  handleDeleteItem,
}
