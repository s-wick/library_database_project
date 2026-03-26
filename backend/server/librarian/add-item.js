function createAddItemHandler({
  parseJsonBody,
  normalizeItemType,
  getItemSchemas,
  parseNullableString,
  parseNullableNumber,
  parseNullableBlob,
  query,
  getNextNumericId,
  sendJson,
}) {
  return async function handleAddItem(req, res) {
    try {
      const body = await parseJsonBody(req)
      const librarianId = req.user ? req.user.id : null
      const itemType = normalizeItemType(body.itemType)
      const typeSchema = getItemSchemas()[itemType]
      const createdAt = new Date().toISOString().slice(0, 10)

      if (!typeSchema) {
        sendJson(res, 400, { ok: false, message: "Invalid item type." })
        return
      }

      for (const field of typeSchema.requiredBodyFields) {
        if (!parseNullableString(body[field])) {
          sendJson(res, 400, { ok: false, message: `${field} is required.` })
          return
        }
      }

      const itemTypeRow = await query(
        "SELECT item_code AS itemCode FROM item_type WHERE item_type = ? LIMIT 1",
        [itemType]
      )
      if (!itemTypeRow.length) {
        sendJson(res, 400, {
          ok: false,
          message: "Selected item type not found in database.",
        })
        return
      }

      const itemTypeCode = itemTypeRow[0].itemCode
      const createdId = await getNextNumericId(
        typeSchema.table,
        typeSchema.idColumn
      )
      const genresInput = Array.isArray(body.genres) ? body.genres : []

      if (itemType === "BOOK" && genresInput.length === 0) {
        sendJson(res, 400, {
          ok: false,
          message: "At least one genre is required for books.",
        })
        return
      }

      // We will handle genre lookups/inserts inside the BOOK transaction below

      if (itemType === "BOOK") {
        await query(
          "INSERT INTO book (book_id, title, author, edition, publication, publication_date, thumbnail_image, monetary_value, books_in_stock, created_at, created_by, item_type_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            createdId,
            parseNullableString(body.title),
            parseNullableString(body.author),
            parseNullableString(body.edition),
            parseNullableString(body.publication),
            parseNullableString(body.publicationDate),
            parseNullableBlob(body.thumbnailImage),
            parseNullableNumber(body.monetaryValue),
            parseNullableNumber(body.booksInStock),
            createdAt,
            librarianId,
            itemTypeCode,
          ]
        )
        // Process genres
        for (const genreText of genresInput) {
          const cleanText = genreText.trim()
          if (!cleanText) continue

          let gId
          const existing = await query(
            "SELECT genre_id FROM genre WHERE genre_text = ?",
            [cleanText]
          )
          if (existing.length > 0) {
            gId = existing[0].genre_id
          } else {
            const insertRes = await query(
              "INSERT INTO genre (genre_text, created_at, created_by) VALUES (?, ?, ?)",
              [cleanText, createdAt, librarianId]
            )
            gId = insertRes.insertId
          }
          // Avoid duplicate assignment
          const assigned = await query(
            "SELECT 1 FROM assigned_genres WHERE book_id = ? AND genre_id = ?",
            [createdId, gId]
          )
          if (assigned.length === 0) {
            await query(
              "INSERT INTO assigned_genres (book_id, genre_id, assigned_at) VALUES (?, ?, ?)",
              [createdId, gId, createdAt]
            )
          }
        }
      } else if (itemType === "VIDEO") {
        await query(
          "INSERT INTO video (video_id, video_name, thumbnail_image, video_length_seconds, video_file, monetary_value, videos_in_stock, created_at, created_by, item_type_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            createdId,
            parseNullableString(body.videoName),
            parseNullableBlob(body.thumbnailImage),
            parseNullableNumber(body.videoLengthSeconds),
            parseNullableBlob(body.videoFile),
            parseNullableNumber(body.monetaryValue),
            parseNullableNumber(body.videosInStock),
            createdAt,
            librarianId,
            itemTypeCode,
          ]
        )
      } else if (itemType === "AUDIO") {
        await query(
          "INSERT INTO audio (audio_id, audio_name, thumbnail_image, audio_length_seconds, audio_file, monetary_value, audios_in_stock, created_at, created_by, item_type_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            createdId,
            parseNullableString(body.audioName),
            parseNullableBlob(body.thumbnailImage),
            parseNullableNumber(body.audioLengthSeconds),
            parseNullableBlob(body.audioFile),
            parseNullableNumber(body.monetaryValue),
            parseNullableNumber(body.audiosInStock),
            createdAt,
            librarianId,
            itemTypeCode,
          ]
        )
      } else if (itemType === "RENTAL_EQUIPMENT") {
        await query(
          "INSERT INTO rental_equipment (equipment_id, rental_name, thumbnail_image, monetary_value, equipment_in_stock, created_at, created_by, item_type_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            createdId,
            parseNullableString(body.rentalName),
            parseNullableBlob(body.thumbnailImage),
            parseNullableNumber(body.monetaryValue),
            parseNullableNumber(body.equipmentInStock),
            createdAt,
            librarianId,
            itemTypeCode,
          ]
        )
      }

      sendJson(res, 201, {
        ok: true,
        message: "Item added successfully.",
        item: { itemId: createdId, itemType, itemTypeCode },
      })
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        message: "Failed to add item.",
        error: error.message,
      })
    }
  }
}

module.exports = {
  createAddItemHandler,
}
