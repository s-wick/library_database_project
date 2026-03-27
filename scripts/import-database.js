const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  const env = {}

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const eqIndex = line.indexOf("=")
    if (eqIndex < 0) continue

    const key = line.slice(0, eqIndex).trim()
    let value = line.slice(eqIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

function requiredEnv(env, key) {
  const value = env[key]
  if (!value) {
    throw new Error(`Missing required backend/.env value: ${key}`)
  }
  return value
}

function parseCliArgs(argv) {
  let mode = "auto"

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === "--mode") {
      mode = argv[i + 1] || ""
      i += 1
      continue
    }

    if (arg.startsWith("--mode=")) {
      mode = arg.slice("--mode=".length)
    }
  }

  const validModes = new Set(["auto", "full", "schema", "data", "schema+data"])
  if (!validModes.has(mode)) {
    throw new Error(
      `Invalid --mode value: ${mode}. Use one of: auto, full, schema, data, schema+data`
    )
  }

  return { mode }
}

function runImport({ mysqlBin, connection, database, inputPath }) {
  const args = [
    "--host",
    connection.host,
    "--port",
    connection.port,
    "--user",
    connection.user,
    `--password=${connection.password}`,
    "--default-character-set=utf8mb4",
    database,
  ]

  const inFd = fs.openSync(inputPath, "r")
  const result = spawnSync(mysqlBin, args, {
    stdio: [inFd, "pipe", "pipe"],
    encoding: "utf8",
  })
  fs.closeSync(inFd)

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim()
    throw new Error(
      `mysql import failed for ${path.basename(inputPath)}${
        stderr ? `: ${stderr}` : ""
      }`
    )
  }
}

function resolveTargets(dumpDir, mode) {
  const files = {
    full: path.join(dumpDir, "library_full_snapshot.sql"),
    schema: path.join(dumpDir, "library_schema.sql"),
    data: path.join(dumpDir, "library_sample_data.sql"),
  }

  const exists = {
    full: fs.existsSync(files.full),
    schema: fs.existsSync(files.schema),
    data: fs.existsSync(files.data),
  }

  if (mode === "full") {
    return [files.full]
  }

  if (mode === "schema") {
    return [files.schema]
  }

  if (mode === "data") {
    return [files.data]
  }

  if (mode === "schema+data") {
    return [files.schema, files.data]
  }

  // Auto mode: prefer a complete snapshot; otherwise fall back to schema + data.
  if (exists.full) {
    return [files.full]
  }

  const targets = [files.schema, files.data].filter((targetPath) =>
    fs.existsSync(targetPath)
  )

  return targets
}

function main() {
  const rootDir = path.resolve(__dirname, "..")
  const envPath = path.join(rootDir, "backend", ".env")
  const dumpDir = path.join(rootDir, "database")

  if (!fs.existsSync(envPath)) {
    throw new Error(`backend/.env not found at: ${envPath}`)
  }

  if (!fs.existsSync(dumpDir)) {
    throw new Error(`database directory not found at: ${dumpDir}`)
  }

  const { mode } = parseCliArgs(process.argv.slice(2))
  const env = parseEnvFile(envPath)
  const connection = {
    host: requiredEnv(env, "DB_HOST"),
    port: env.DB_PORT || "3306",
    user: requiredEnv(env, "DB_USER"),
    password: env.DB_PASSWORD || "",
  }
  const database = requiredEnv(env, "DB_NAME")

  const mysqlBin = process.env.MYSQL_PATH || "mysql"
  const targets = resolveTargets(dumpDir, mode)

  if (targets.length === 0) {
    throw new Error(
      `No SQL dump files found for mode '${mode}' in ${dumpDir}. Expected one or more of: library_full_snapshot.sql, library_schema.sql, library_sample_data.sql`
    )
  }

  for (const targetPath of targets) {
    if (!fs.existsSync(targetPath)) {
      throw new Error(`SQL dump file not found: ${targetPath}`)
    }

    runImport({
      mysqlBin,
      connection,
      database,
      inputPath: targetPath,
    })
    console.log(`Imported: ${targetPath}`)
  }
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
