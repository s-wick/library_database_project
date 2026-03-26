const { sendJson } = require("../utils")
const {
  searchItems,
  getItemById,
  getItemGenres,
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

module.exports = {
  handleGetItemsAll,
  handleGetItemById,
  handleSearchItems,
}
