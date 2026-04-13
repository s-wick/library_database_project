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

function runDump({
  mysqldumpBin,
  connection,
  database,
  outputPath,
  extraArgs = [],
}) {
  const args = [
    "--host",
    connection.host,
    "--port",
    connection.port,
    "--user",
    connection.user,
    `--password=${connection.password}`,
    "--single-transaction",
    ...extraArgs,
    database,
  ]

  const outFd = fs.openSync(outputPath, "w")
  const result = spawnSync(mysqldumpBin, args, {
    stdio: ["ignore", outFd, "pipe"],
    encoding: "utf8",
  })
  fs.closeSync(outFd)

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim()
    throw new Error(
      `mysqldump failed for ${path.basename(outputPath)}${
        stderr ? `: ${stderr}` : ""
      }`
    )
  }
}

function postProcessSchemaFile(schemaFilePath) {
  // Read the schema file
  let content = fs.readFileSync(schemaFilePath, "utf8")
  // Remove AUTO_INCREMENT=... entirely
  // Handles variations like AUTO_INCREMENT=123, AUTO_INCREMENT = 123, etc.
  content = content.replace(/\s*AUTO_INCREMENT\s*=\s*\d+/gi, "")
  fs.writeFileSync(schemaFilePath, content, "utf8")
}

function main() {
  const rootDir = path.resolve(__dirname, "..")
  const envPath = path.join(rootDir, "backend", ".env")
  const outDir = path.join(rootDir, "database")

  if (!fs.existsSync(envPath)) {
    throw new Error(`backend/.env not found at: ${envPath}`)
  }

  const env = parseEnvFile(envPath)
  const connection = {
    host: requiredEnv(env, "DB_HOST"),
    port: env.DB_PORT || "3306",
    user: requiredEnv(env, "DB_USER"),
    password: env.DB_PASSWORD || "",
  }
  const database = requiredEnv(env, "DB_NAME")

  const mysqldumpBin = process.env.MYSQLDUMP_PATH || "mysqldump"

  // Only dump the schema
  const schemaPath = path.join(outDir, "library_schema.sql")
  runDump({
    mysqldumpBin,
    connection,
    database,
    outputPath: schemaPath,
    extraArgs: ["--no-data", "--skip-triggers"],
  })
  console.log(`Created schema-only dump: ${schemaPath}`)

  // Post-process to remove/normalize AUTO_INCREMENT
  postProcessSchemaFile(schemaPath)
  console.log(
    `Post-processed schema file to reset AUTO_INCREMENT to 1: ${schemaPath}`
  )
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
