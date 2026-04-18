const fs = require("node:fs")
const path = require("node:path")

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

function parseArgs(argv) {
  const args = {
    users: null,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    apiBaseUrl: process.env.API_BASE_URL || "http://localhost:4000",
    listOnly: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === "--list") {
      args.listOnly = true
      continue
    }

    if (arg === "--users") {
      args.users = argv[i + 1] || ""
      i += 1
      continue
    }

    if (arg.startsWith("--users=")) {
      args.users = arg.slice("--users=".length)
      continue
    }

    if (arg === "--frontend") {
      args.frontendUrl = argv[i + 1] || args.frontendUrl
      i += 1
      continue
    }

    if (arg.startsWith("--frontend=")) {
      args.frontendUrl = arg.slice("--frontend=".length)
      continue
    }

    if (arg === "--api") {
      args.apiBaseUrl = argv[i + 1] || args.apiBaseUrl
      i += 1
      continue
    }

    if (arg.startsWith("--api=")) {
      args.apiBaseUrl = arg.slice("--api=".length)
    }
  }

  return args
}

function normalizeUrl(value, fallback) {
  const trimmed = String(value || "")
    .trim()
    .replace(/\/+$/, "")
  if (!trimmed) return fallback
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `http://${trimmed.replace(/^\/+/, "")}`
}

function chunked(list, size) {
  const chunks = []
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size))
  }
  return chunks
}

const ACCOUNT_MAP = {
  student1: {
    label: "student1",
    accountType: "user",
    email: "student1.user@lib.com",
  },
  student2: {
    label: "student2",
    accountType: "user",
    email: "student2.user@lib.com",
  },
  faculty: {
    label: "faculty",
    accountType: "user",
    email: "faculty.user@lib.com",
  },
  librarian: {
    label: "librarian",
    accountType: "staff",
    email: "librarian.staff@lib.com",
  },
  admin: {
    label: "admin",
    accountType: "staff",
    email: "admin.staff@lib.com",
  },
  "qcase1.front": {
    label: "qcase1.front",
    accountType: "user",
    email: "qcase1.front@lib.com",
  },
  "qcase1.next": {
    label: "qcase1.next",
    accountType: "user",
    email: "qcase1.next@lib.com",
  },
  "qcase2.front": {
    label: "qcase2.front",
    accountType: "user",
    email: "qcase2.front@lib.com",
  },
  "qcase2.next": {
    label: "qcase2.next",
    accountType: "user",
    email: "qcase2.next@lib.com",
  },
  "qcase3.front": {
    label: "qcase3.front",
    accountType: "user",
    email: "qcase3.front@lib.com",
  },
  "qcase.stockholder": {
    label: "qcase.stockholder",
    accountType: "user",
    email: "qcase.stockholder@lib.com",
  },
}

const DEFAULT_SELECTION = ["student1"]

function printAccountList() {
  console.log("Available users:")
  const keys = Object.keys(ACCOUNT_MAP)
  for (const row of chunked(keys, 3)) {
    console.log(`  ${row.join(" | ")}`)
  }
  console.log("")
  console.log("Example: npm run user-tabs -- --users=student1")
}

async function signin(apiBaseUrl, account, password) {
  const response = await fetch(`${apiBaseUrl}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountType: account.accountType,
      email: account.email,
      password,
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data?.user) {
    const message = data?.message || `HTTP ${response.status}`
    throw new Error(`${account.label}: signin failed (${message})`)
  }

  return data.user
}

async function main() {
  const rootDir = path.resolve(__dirname, "..")
  const envPath = path.join(rootDir, "database", ".env")

  if (!fs.existsSync(envPath)) {
    throw new Error(`database/.env not found at ${envPath}`)
  }

  const args = parseArgs(process.argv.slice(2))
  if (args.listOnly) {
    printAccountList()
    return
  }

  const requested = (args.users || DEFAULT_SELECTION.join(","))
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)

  const unknown = requested.filter((key) => !ACCOUNT_MAP[key])
  if (unknown.length > 0) {
    printAccountList()
    throw new Error(`Unknown user keys: ${unknown.join(", ")}`)
  }

  const env = parseEnvFile(envPath)
  const userPassword = String(env.SEED_USER_PASSWORD || "")
  const staffPassword = String(env.SEED_STAFF_PASSWORD || "")

  if (!userPassword || !staffPassword) {
    throw new Error(
      "Missing SEED_USER_PASSWORD or SEED_STAFF_PASSWORD in database/.env"
    )
  }

  const frontendUrl = normalizeUrl(args.frontendUrl, "http://localhost:5173")
  const apiBaseUrl = normalizeUrl(args.apiBaseUrl, "http://localhost:4000")

  let playwright
  try {
    playwright = require("playwright")
  } catch {
    throw new Error(
      "Missing dependency: playwright. Run: npm install -D playwright"
    )
  }

  const context = await playwright.firefox.launchPersistentContext(
    path.join(rootDir, ".tmp", "tabs-users-profile"),
    {
      headless: false,
      viewport: { width: 1420, height: 900 },
    }
  )

  try {
    for (const key of requested) {
      const account = ACCOUNT_MAP[key]
      const password =
        account.accountType === "staff" ? staffPassword : userPassword
      const user = await signin(apiBaseUrl, account, password)

      const page = await context.newPage()
      await page.goto(`${frontendUrl}/auth`, { waitUntil: "domcontentloaded" })
      await page.evaluate(
        (payload) => {
          sessionStorage.setItem("isLoggedIn", "true")
          sessionStorage.setItem("authToken", "")
          sessionStorage.setItem("authUser", JSON.stringify(payload.user))
          sessionStorage.setItem("user", JSON.stringify(payload.user))
        },
        { user }
      )

      const targetPath =
        user.accountType === "staff" || user.roleGroup === "adminStaff"
          ? "/management-dashboard"
          : "/"
      await page.goto(`${frontendUrl}${targetPath}`, {
        waitUntil: "domcontentloaded",
      })
      await page.bringToFront()

      console.log(`Opened tab for ${account.label} (${account.email})`)
    }

    console.log("")
    console.log("Tabs are ready. Close the browser window when done.")
  } catch (error) {
    await context.close()
    throw error
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
