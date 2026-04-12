const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

// Edit this list to control the order of data imports.
const dataFiles = ["users.sql", "items.sql", "transactions.sql"]
const thumbnailFiles = [
  {
    title: "To Kill a Mockingbird",
    relativePath: path.join("books", "to-kill-a-mockingbird.jpg"),
  },
  { title: "1984", relativePath: path.join("books", "1984.jpg") },
  {
    title: "The Great Gatsby",
    relativePath: path.join("books", "the-great-gatsby.jpg"),
  },
  {
    title: "Pride and Prejudice",
    relativePath: path.join("books", "pride-and-predjudice.jpg"),
  },
  {
    title: "The Hobbit",
    relativePath: path.join("books", "the-hobbit.jpg"),
  },
  {
    title: "Canon EOS Rebel T7 Camera Kit",
    relativePath: path.join("equipment", "canon-eos-rebel-t7-camera-kit.jpg"),
  },
  {
    title: "Dell Latitude 5440 Laptop",
    relativePath: path.join("equipment", "dell-latitude-5440-laptop.png"),
  },
  {
    title: "Shure SM58 Microphone",
    relativePath: path.join("equipment", "shure-sm58-microphone.jpg"),
  },
]

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
    throw new Error(
      `Missing required database/.env value: ${key}. Check database/.env.`
    )
  }
  return value
}

function escapeSqlString(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
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

function runMysqlQuery({ mysqlBin, args, query, label }) {
  const result = spawnSync(mysqlBin, [...args, "-N", "-B", "-e", query], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim()
    throw new Error(`${label} failed${stderr ? `: ${stderr}` : ""}`)
  }

  return (result.stdout || "").trim()
}

function updateThumbnails({ mysqlBin, baseArgs, database, rootDir }) {
  const imagesDir = path.join(rootDir, "database", "data", "images")
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "db-reset-"))
  const tempSqlPath = path.join(tempDir, "thumbnail-updates.sql")

  try {
    const statements = []

    for (const entry of thumbnailFiles) {
      const filePath = path.join(imagesDir, entry.relativePath)

      if (!fs.existsSync(filePath)) {
        throw new Error(`Thumbnail file not found: ${filePath}`)
      }

      const hex = fs.readFileSync(filePath).toString("hex")
      if (!hex) {
        throw new Error(`Thumbnail file is empty: ${filePath}`)
      }

      statements.push(
        `UPDATE item SET thumbnail_image = UNHEX('${hex}') WHERE title = '${escapeSqlString(
          entry.title
        )}';`
      )
    }

    fs.writeFileSync(tempSqlPath, `${statements.join("\n")}\n`, "utf8")

    runMysql({
      mysqlBin,
      args: [...baseArgs, database],
      inputPath: tempSqlPath,
      label: "Thumbnail updates",
    })
  } finally {
    try {
      fs.unlinkSync(tempSqlPath)
    } catch (error) {
      // Best-effort cleanup.
    }

    try {
      fs.rmdirSync(tempDir)
    } catch (error) {
      // Best-effort cleanup.
    }
  }
}

function main() {
  const rootDir = path.resolve(__dirname, "..")
  const envPath = path.join(rootDir, "database", ".env")
  const schemaPath = path.join(rootDir, "database", "library_schema.sql")
  const dataDir = path.join(rootDir, "database", "data")

  if (!fs.existsSync(envPath)) {
    throw new Error(
      `database/.env not found at: ${envPath}. Create it with DB_HOST, DB_USER, DB_NAME, and optional IMAGE_ROOT.`
    )
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

    const args = [...baseArgs, database]

    runMysql({
      mysqlBin,
      args,
      inputPath: filePath,
      label: `Import data ${fileName}`,
    })

    if (fileName === "items.sql") {
      updateThumbnails({ mysqlBin, baseArgs, database, rootDir })

      const quotedTitles = thumbnailFiles
        .map((entry) => `'${escapeSqlString(entry.title)}'`)
        .join(", ")
      const nullCount = runMysqlQuery({
        mysqlBin,
        args: [...baseArgs, database],
        query: `SELECT COUNT(*) FROM item WHERE title IN (${quotedTitles}) AND thumbnail_image IS NULL;`,
        label: "Thumbnail validation",
      })

      if (Number(nullCount) > 0) {
        throw new Error(
          "Thumbnail images failed to load. Check that the image files exist and are readable from database/data/images, then rerun db:reset."
        )
      }
    }
  }

  console.log("Database reset complete.")
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
