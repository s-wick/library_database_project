const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

// Edit this list to control the order of data imports.
const dataFiles = ["users.sql", "items.sql", "transactions.sql"]

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

function runMysql({ mysqlBin, args, inputPath, label }) {
  const stdio = ["ignore", "pipe", "pipe"]
  let inFd = null

  if (inputPath) {
    inFd = fs.openSync(inputPath, "r")
    stdio[0] = inFd
  }

  const result = spawnSync(mysqlBin, args, {
    stdio,
    encoding: "utf8",
  })

  if (inFd !== null) {
    fs.closeSync(inFd)
  }

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim()
    throw new Error(`${label} failed${stderr ? `: ${stderr}` : ""}`)
  }
}

function main() {
  const rootDir = path.resolve(__dirname, "..")
  const envPath = path.join(rootDir, "backend", ".env")
  const schemaPath = path.join(rootDir, "database", "library_schema.sql")
  const dataDir = path.join(rootDir, "database", "data")

  if (!fs.existsSync(envPath)) {
    throw new Error(`backend/.env not found at: ${envPath}`)
  }

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at: ${schemaPath}`)
  }

  if (!fs.existsSync(dataDir)) {
    throw new Error(`Data directory not found at: ${dataDir}`)
  }

  const env = parseEnvFile(envPath)
  const connection = {
    host: requiredEnv(env, "DB_HOST"),
    port: env.DB_PORT || "3306",
    user: requiredEnv(env, "DB_USER"),
    password: env.DB_PASSWORD || "",
  }
  const database = requiredEnv(env, "DB_NAME")

  const mysqlBin = process.env.MYSQL_PATH || "mysql"
  const baseArgs = [
    "--host",
    connection.host,
    "--port",
    connection.port,
    "--user",
    connection.user,
    `--password=${connection.password}`,
    "--default-character-set=utf8mb4",
  ]

  runMysql({
    mysqlBin,
    args: [...baseArgs, "-e", `DROP DATABASE IF EXISTS \`${database}\`;`],
    label: `Drop schema ${database}`,
  })

  runMysql({
    mysqlBin,
    args: [...baseArgs, "-e", `CREATE DATABASE \`${database}\`;`],
    label: `Create schema ${database}`,
  })

  runMysql({
    mysqlBin,
    args: [...baseArgs, database],
    inputPath: schemaPath,
    label: "Import schema",
  })

  for (const fileName of dataFiles) {
    const filePath = path.join(dataDir, fileName)

    if (!fs.existsSync(filePath)) {
      throw new Error(`Data file not found: ${filePath}`)
    }

    runMysql({
      mysqlBin,
      args: [...baseArgs, database],
      inputPath: filePath,
      label: `Import data ${fileName}`,
    })
  }

  console.log("Database reset complete.")
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
