const http = require("node:http")
require("dotenv").config()
const { handleApiRoute } = require("./routes")

const port = Number(process.env.PORT || 4000)
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://127.0.0.1:5173"]

const normalizeOrigin = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "")
const allowedOrigins = new Set(envOrigins.map(normalizeOrigin).filter(Boolean))

function writeCorsHeaders(req, res) {
  const origin = normalizeOrigin(req.headers.origin)
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Vary", "Origin")
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")

  const requestedHeaders = String(
    req.headers["access-control-request-headers"] || ""
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  const defaultAllowedHeaders = [
    "Content-Type",
    "Authorization",
    "x-actor-id",
    "x-actor-role",
  ]

  const allowedHeaders = Array.from(
    new Set([...defaultAllowedHeaders, ...requestedHeaders])
  ).join(", ")

  res.setHeader("Access-Control-Allow-Headers", allowedHeaders)
}

const server = http.createServer(async (req, res) => {
  writeCorsHeaders(req, res)

  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`)
  await handleApiRoute(req, res, url)
})

server.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`)
})
