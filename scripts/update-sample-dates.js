const fs = require("node:fs")
const path = require("node:path")

// Edit this list to control which sample data files get updated.
const dataFiles = ["transactions.sql"]

// The date the sample data currently targets.
const baseDate = "2026-04-11"

function parseCliArgs(argv) {
  let targetDate = "today"

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === "--date") {
      targetDate = argv[i + 1] || ""
      i += 1
      continue
    }

    if (arg.startsWith("--date=")) {
      targetDate = arg.slice("--date=".length)
    }
  }

  return { targetDate }
}

function parseDateOnly(value) {
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(value)
  if (!match) return null

  const [year, month, day] = value.split("-").map((part) => Number(part))
  if (!year || !month || !day) return null

  return { year, month, day }
}

function toUtcMillis({ year, month, day, hour = 0, minute = 0, second = 0 }) {
  return Date.UTC(year, month - 1, day, hour, minute, second)
}

function formatDateTimeUtc(ms) {
  const date = new Date(ms)
  const pad = (value) => String(value).padStart(2, "0")

  const year = date.getUTCFullYear()
  const month = pad(date.getUTCMonth() + 1)
  const day = pad(date.getUTCDate())
  const hour = pad(date.getUTCHours())
  const minute = pad(date.getUTCMinutes())
  const second = pad(date.getUTCSeconds())

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

function resolveTargetDate(rawTarget) {
  if (rawTarget === "today") {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  if (!parseDateOnly(rawTarget)) {
    throw new Error(
      `Invalid --date value: ${rawTarget}. Use YYYY-MM-DD or 'today'.`
    )
  }

  return rawTarget
}

function updateFile(filePath, deltaMs, targetDateValue) {
  const content = fs.readFileSync(filePath, "utf8")
  const dateTimeRegex = /'(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})'/g

  let updated = content.replace(dateTimeRegex, (_match, datePart, timePart) => {
    const [year, month, day] = datePart.split("-").map((part) => Number(part))
    const [hour, minute, second] = timePart
      .split(":")
      .map((part) => Number(part))

    const ms = toUtcMillis({ year, month, day, hour, minute, second })
    return `'${formatDateTimeUtc(ms + deltaMs)}'`
  })

  if (baseDate !== targetDateValue) {
    const baseDateRegex = new RegExp(baseDate.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "g")
    updated = updated.replace(baseDateRegex, targetDateValue)
  }

  if (updated !== content) {
    fs.writeFileSync(filePath, updated)
    console.log(`Updated dates in ${filePath}`)
  } else {
    console.log(`No date updates needed in ${filePath}`)
  }
}

function main() {
  const rootDir = path.resolve(__dirname, "..")
  const dataDir = path.join(rootDir, "database", "data")

  if (!fs.existsSync(dataDir)) {
    throw new Error(`Data directory not found at: ${dataDir}`)
  }

  const { targetDate } = parseCliArgs(process.argv.slice(2))
  const resolvedTargetDate = resolveTargetDate(targetDate)

  const baseDateParts = parseDateOnly(baseDate)
  const targetDateParts = parseDateOnly(resolvedTargetDate)

  if (!baseDateParts || !targetDateParts) {
    throw new Error("Base or target date is invalid. Use YYYY-MM-DD.")
  }

  const baseMs = toUtcMillis(baseDateParts)
  const targetMs = toUtcMillis(targetDateParts)
  const deltaMs = targetMs - baseMs

  for (const fileName of dataFiles) {
    const filePath = path.join(dataDir, fileName)

    if (!fs.existsSync(filePath)) {
      throw new Error(`Sample data file not found: ${filePath}`)
    }

    updateFile(filePath, deltaMs, resolvedTargetDate)
  }
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
