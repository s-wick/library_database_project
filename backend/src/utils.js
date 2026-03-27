function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk.toString()
      if (body.length > 15_000_000) {
        reject(new Error("Payload too large"))
        req.destroy()
      }
    })
    req.on("end", () => {
      if (!body) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error("Invalid JSON body"))
      }
    })
    req.on("error", reject)
  })
}

module.exports = {
  sendJson,
  parseJsonBody,
}
