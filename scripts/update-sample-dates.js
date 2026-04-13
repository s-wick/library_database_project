const fs = require("node:fs")
const path = require("node:path")

// Edit this list to control which sample data files get updated.
const dataFiles = ["transactions.sql", "room-bookings.sql"]

// The date the sample data currently targets.
const baseDate = "2026-04-11"

function parseDateOnly(value) {
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(value)
  if (!match) return null

  const [year, month, day] = value.split("-").map((part) => Number(part))
  if (!year || !month || !day) return null

  return { year, month, day }
}

function formatDateOnlyUtc(ms) {
  const date = new Date(ms)
  const pad = (value) => String(value).padStart(2, "0")

  const year = date.getUTCFullYear()
  const month = pad(date.getUTCMonth() + 1)
  const day = pad(date.getUTCDate())

  return `${year}-${month}-${day}`
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

function addDaysToDateString(dateString, days) {
  const parts = parseDateOnly(dateString)
  if (!parts || !Number.isFinite(days)) return dateString

  const ms = toUtcMillis(parts) + days * 24 * 60 * 60 * 1000
  return formatDateOnlyUtc(ms)
}

function resolveTodayDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseFileDirectives(content) {
  const baseMatch = /^--\s*sample-base-date:\s*(\d{4}-\d{2}-\d{2})/m.exec(
    content
  )
  const shiftMatch = /^--\s*sample-shift-days:\s*(-?\d+)/m.exec(content)

  return {
    baseDateOverride: baseMatch ? baseMatch[1] : null,
    shiftDays: shiftMatch ? Number(shiftMatch[1]) : 0,
  }
}

function updateFile(filePath, baseDateValue, targetDateValue) {
  const content = fs.readFileSync(filePath, "utf8")
  const dateTimeRegex = /'(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})'/g
  const nextShiftRegex = /^\s*--\s*sample-shift-days-next:\s*(-?\d+)\s*$/

  const baseParts = parseDateOnly(baseDateValue)
  const targetParts = parseDateOnly(targetDateValue)

  if (!baseParts || !targetParts) {
    throw new Error(`Invalid base/target date for ${filePath}`)
  }

  const baseDeltaMs = toUtcMillis(targetParts) - toUtcMillis(baseParts)
  let pendingShiftDays = null

  const updatedLines = content.split(/\r?\n/).map((line) => {
    const shiftMatch = nextShiftRegex.exec(line)
    if (shiftMatch) {
      pendingShiftDays = Number(shiftMatch[1])
      return line
    }

    const extraShiftMs =
      baseDeltaMs === 0 ? 0 : (pendingShiftDays || 0) * 24 * 60 * 60 * 1000
    const updatedLine = line.replace(
      dateTimeRegex,
      (_match, datePart, timePart) => {
        const [year, month, day] = datePart
          .split("-")
          .map((part) => Number(part))
        const [hour, minute, second] = timePart
          .split(":")
          .map((part) => Number(part))

        const ms = toUtcMillis({ year, month, day, hour, minute, second })
        return `'${formatDateTimeUtc(ms + baseDeltaMs + extraShiftMs)}'`
      }
    )

    if (pendingShiftDays !== null && line.includes(";")) {
      pendingShiftDays = null
    }

    return updatedLine
  })

  let updated = updatedLines.join("\n")

  if (baseDateValue !== targetDateValue) {
    const baseDateRegex = new RegExp(
      baseDateValue.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
      "g"
    )
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

  const resolvedTargetDate = resolveTodayDate()

  const baseDateParts = parseDateOnly(baseDate)
  const targetDateParts = parseDateOnly(resolvedTargetDate)

  if (!baseDateParts || !targetDateParts) {
    throw new Error("Base or target date is invalid. Use YYYY-MM-DD.")
  }

  for (const fileName of dataFiles) {
    const filePath = path.join(dataDir, fileName)

    if (!fs.existsSync(filePath)) {
      throw new Error(`Sample data file not found: ${filePath}`)
    }

    const content = fs.readFileSync(filePath, "utf8")
    const { baseDateOverride, shiftDays } = parseFileDirectives(content)
    const fileBaseDate = baseDateOverride || baseDate
    const fileTargetDate = addDaysToDateString(resolvedTargetDate, shiftDays)
    const fileBaseParts = parseDateOnly(fileBaseDate)
    const fileTargetParts = parseDateOnly(fileTargetDate)

    if (!fileBaseParts || !fileTargetParts) {
      throw new Error(
        `Invalid base/target date in directives for ${fileName}. Use YYYY-MM-DD.`
      )
    }

    updateFile(filePath, fileBaseDate, fileTargetDate)
  }
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
