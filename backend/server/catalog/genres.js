function createGetGenresHandler({ query, sendJson }) {
  return async function handleGetGenres(_req, res) {
    try {
      const rows = await query(
        "SELECT genre_id AS genreId, genre_text AS genreName FROM genre ORDER BY genre_text ASC"
      )
      sendJson(res, 200, { ok: true, genres: rows })
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        message: "Failed to fetch genres.",
        error: error.message,
      })
    }
  }
}

module.exports = {
  createGetGenresHandler,
}
