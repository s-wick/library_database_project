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
      const parsedGenreId = parseNullableNumber(body.genreId)
      const genreId =
        itemType === "RENTAL_EQUIPMENT"
          ? null
          : Number.isInteger(parsedGenreId)
            ? parsedGenreId
            : null

      if (itemType !== "RENTAL_EQUIPMENT" && !genreId) {
        sendJson(res, 400, { ok: false, message: "genreId is required." })
        return
      }
      if (genreId) {
        const genreRows = await query(
          "SELECT genre_id FROM genre WHERE genre_id = ? LIMIT 1",
          [genreId]
        )
        if (!genreRows.length) {
          sendJson(res, 400, {
            ok: false,
            message: "Selected genre not found.",
          })
          return
        }
      }

      if (itemType === "BOOK") {
        await query(
          "INSERT INTO book (book_id, title, author, edition, publication, publication_date, thumbnail_image, monetary_value, books_in_stock, genre_id, created_at, created_by, item_type_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
            genreId,
            createdAt,
            parseNullableString(body.createdBy),
            itemTypeCode,
          ]
        )
      } else if (itemType === "VIDEO") {
        await query(
          "INSERT INTO video (video_id, video_name, thumbnail_image, video_length_seconds, video_file, monetary_value, videos_in_stock, genre_id, created_at, created_by, item_type_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            createdId,
            parseNullableString(body.videoName),
            parseNullableBlob(body.thumbnailImage),
            parseNullableNumber(body.videoLengthSeconds),
            parseNullableBlob(body.videoFile),
            parseNullableNumber(body.monetaryValue),
            parseNullableNumber(body.videosInStock),
            genreId,
            createdAt,
            parseNullableString(body.createdBy),
            itemTypeCode,
          ]
        )
      } else if (itemType === "AUDIO") {
        await query(
          "INSERT INTO audio (audio_id, audio_name, thumbnail_image, audio_length_seconds, audio_file, monetary_value, audios_in_stock, genre_id, created_at, created_by, item_type_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            createdId,
            parseNullableString(body.audioName),
            parseNullableBlob(body.thumbnailImage),
            parseNullableNumber(body.audioLengthSeconds),
            parseNullableBlob(body.audioFile),
            parseNullableNumber(body.monetaryValue),
            parseNullableNumber(body.audiosInStock),
            genreId,
            createdAt,
            parseNullableString(body.createdBy),
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
            parseNullableString(body.createdBy),
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
