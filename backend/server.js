const express = require("express")
const cors = require("cors")
require("dotenv").config()
const { query, testConnection } = require("./db")

const app = express()
const port = Number(process.env.PORT || 4000)

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  })
)
app.use(express.json())

function normalizeRoleGroup(roleGroup = "") {
  const value = String(roleGroup).trim().toLowerCase()
  if (
    value === "adminstaff" ||
    value === "admin/staff" ||
    value === "admin_staff" ||
    value === "admin-staff"
  ) {
    return "adminStaff"
  }
  if (
    value === "studentfaculty" ||
    value === "student/faculty" ||
    value === "student_faculty" ||
    value === "student-faculty"
  ) {
    return "studentFaculty"
  }
  return value
}

function normalizeRole(role = "") {
  const value = String(role).trim().toLowerCase()
  if (value === "system_administrator") return "admin"
  return value
}

async function getNextNumericId(tableName, columnName) {
  const rows = await query(
    `SELECT COALESCE(MAX(${columnName}), 0) + 1 AS nextId FROM ${tableName}`
  )
  return rows[0].nextId
}

function generateStudentId() {
  const randomPart = Math.floor(Math.random() * 1_000_000_000_000)
    .toString()
    .padStart(12, "0")
  return `S${randomPart}`.slice(0, 15)
}

app.get("/api/health", async (_req, res) => {
  try {
    const isConnected = await testConnection()
    if (!isConnected) {
      return res.status(500).json({ ok: false, message: "Database not ready." })
    }

    return res.json({
      ok: true,
      message: "Backend and MySQL are connected.",
      database: process.env.DB_NAME,
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Database connection failed.",
      error: error.message,
    })
  }
})

app.post("/api/auth/signup", async (req, res) => {
  try {
    const roleGroup = normalizeRoleGroup(req.body.roleGroup)
    const role = normalizeRole(req.body.role)
    const email = String(req.body.email || "").trim().toLowerCase()
    const password = String(req.body.password || "")

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Email and password are required." })
    }

    if (roleGroup === "adminStaff") {
      if (role === "admin") {
        const existing = await query(
          "SELECT administrator_id FROM system_administrator WHERE email = ? LIMIT 1",
          [email]
        )
        if (existing.length) {
          return res.status(409).json({ ok: false, message: "Email already exists for admin." })
        }

        const administratorId = await getNextNumericId(
          "system_administrator",
          "administrator_id"
        )
        await query(
          "INSERT INTO system_administrator (administrator_id, email, password) VALUES (?, ?, ?)",
          [administratorId, email, password]
        )

        return res.status(201).json({
          ok: true,
          message: "Admin account created.",
          user: { roleGroup: "adminStaff", role: "admin", id: administratorId, email },
        })
      }

      if (role === "staff" || role === "librarian") {
        const existing = await query(
          "SELECT librarian_id FROM librarian WHERE email = ? LIMIT 1",
          [email]
        )
        if (existing.length) {
          return res.status(409).json({ ok: false, message: "Email already exists for staff." })
        }

        const librarianId = await getNextNumericId("librarian", "librarian_id")
        await query(
          "INSERT INTO librarian (librarian_id, email, password) VALUES (?, ?, ?)",
          [librarianId, email, password]
        )

        return res.status(201).json({
          ok: true,
          message: "Staff account created.",
          user: { roleGroup: "adminStaff", role: "staff", id: librarianId, email },
        })
      }

      return res
        .status(400)
        .json({ ok: false, message: "Role must be admin or staff for Admin / Staff." })
    }

    if (roleGroup === "studentFaculty") {
      if (role === "student") {
        const existing = await query(
          "SELECT student_id FROM student_user WHERE email = ? LIMIT 1",
          [email]
        )
        if (existing.length) {
          return res
            .status(409)
            .json({ ok: false, message: "Email already exists for student." })
        }

        const studentId = generateStudentId()
        await query(
          "INSERT INTO student_user (student_id, email, password, user_type_code) VALUES (?, ?, ?, 1)",
          [studentId, email, password]
        )

        return res.status(201).json({
          ok: true,
          message: "Student account created.",
          user: { roleGroup: "studentFaculty", role: "student", id: studentId, email },
        })
      }

      if (role === "faculty") {
        const existing = await query(
          "SELECT faculty_id FROM faculty_user WHERE email = ? LIMIT 1",
          [email]
        )
        if (existing.length) {
          return res
            .status(409)
            .json({ ok: false, message: "Email already exists for faculty." })
        }

        const facultyId = await getNextNumericId("faculty_user", "faculty_id")
        await query(
          "INSERT INTO faculty_user (faculty_id, email, password, user_type_code) VALUES (?, ?, ?, 2)",
          [facultyId, email, password]
        )

        return res.status(201).json({
          ok: true,
          message: "Faculty account created.",
          user: { roleGroup: "studentFaculty", role: "faculty", id: facultyId, email },
        })
      }

      return res
        .status(400)
        .json({ ok: false, message: "Role must be student or faculty for Student & Faculty." })
    }

    return res.status(400).json({
      ok: false,
      message: "Invalid roleGroup. Use adminStaff or studentFaculty.",
    })
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Signup failed.", error: error.message })
  }
})

app.post("/api/auth/signin", async (req, res) => {
  try {
    const roleGroup = normalizeRoleGroup(req.body.roleGroup)
    const role = normalizeRole(req.body.role)
    const email = String(req.body.email || "").trim().toLowerCase()
    const password = String(req.body.password || "")

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Email and password are required." })
    }

    if (roleGroup === "adminStaff" && role === "admin") {
      const rows = await query(
        "SELECT administrator_id, email FROM system_administrator WHERE email = ? AND password = ? LIMIT 1",
        [email, password]
      )
      if (!rows.length) {
        return res.status(401).json({ ok: false, message: "Invalid admin credentials." })
      }
      return res.json({
        ok: true,
        message: "Sign in successful.",
        user: { roleGroup, role: "admin", id: rows[0].administrator_id, email: rows[0].email },
      })
    }

    if (roleGroup === "adminStaff" && (role === "staff" || role === "librarian")) {
      const rows = await query(
        "SELECT librarian_id, email FROM librarian WHERE email = ? AND password = ? LIMIT 1",
        [email, password]
      )
      if (!rows.length) {
        return res.status(401).json({ ok: false, message: "Invalid staff credentials." })
      }
      return res.json({
        ok: true,
        message: "Sign in successful.",
        user: { roleGroup, role: "staff", id: rows[0].librarian_id, email: rows[0].email },
      })
    }

    if (roleGroup === "studentFaculty" && role === "student") {
      const rows = await query(
        "SELECT student_id, email FROM student_user WHERE email = ? AND password = ? LIMIT 1",
        [email, password]
      )
      if (!rows.length) {
        return res.status(401).json({ ok: false, message: "Invalid student credentials." })
      }
      return res.json({
        ok: true,
        message: "Sign in successful.",
        user: { roleGroup, role: "student", id: rows[0].student_id, email: rows[0].email },
      })
    }

    if (roleGroup === "studentFaculty" && role === "faculty") {
      const rows = await query(
        "SELECT faculty_id, email FROM faculty_user WHERE email = ? AND password = ? LIMIT 1",
        [email, password]
      )
      if (!rows.length) {
        return res.status(401).json({ ok: false, message: "Invalid faculty credentials." })
      }
      return res.json({
        ok: true,
        message: "Sign in successful.",
        user: { roleGroup, role: "faculty", id: rows[0].faculty_id, email: rows[0].email },
      })
    }

    return res.status(400).json({ ok: false, message: "Invalid roleGroup/role combination." })
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Signin failed.", error: error.message })
  }
})

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`)
})
