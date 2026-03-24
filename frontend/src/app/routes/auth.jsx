import { useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const roles = [
  { id: "admin", label: "Admin / Staff" },
  { id: "student", label: "Student & Faculty" },
]

const emptyForm = {
  email: "",
  password: "",
  confirmPassword: "",
}

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "http://localhost:4000/api"

const SIGNIN_ATTEMPTS = {
  admin: [
    { roleGroup: "adminStaff", role: "admin" },
    { roleGroup: "adminStaff", role: "staff" },
  ],
  student: [
    { roleGroup: "studentFaculty", role: "student" },
    { roleGroup: "studentFaculty", role: "faculty" },
  ],
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState("admin")
  const [mode, setMode] = useState("signin")
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState("")

  const isSignUp = mode === "signup"

  const submitLabel = useMemo(() => {
    if (isSignUp) return "Create account"
    return "Sign in"
  }, [isSignUp])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setErrors({})
    setSuccess("")
    setForm(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setSuccess("")

    if (!form.email.trim()) {
      setErrors({ email: "Email is required." })
    }

    if (!form.password.trim()) {
      setErrors((prev) => ({ ...prev, password: "Password is required." }))
      return
    }

    if (isSignUp) {
      if (!form.confirmPassword.trim()) {
        setErrors({ confirmPassword: "Retype password is required." })
        return
      }

      if (form.password !== form.confirmPassword) {
        setErrors({ confirmPassword: "Passwords do not match." })
        return
      }
    }

    if (isSignUp) {
      const roleLabel =
        selectedRole === "admin" ? "Admin / Staff" : "Student & Faculty"
      setSuccess(`Account created for ${roleLabel}.`)
      return
    }

    const attempts = SIGNIN_ATTEMPTS[selectedRole] || []
    let lastFailureMessage = "Invalid credentials."

    for (const attempt of attempts) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roleGroup: attempt.roleGroup,
            role: attempt.role,
            email: form.email.trim(),
            password: form.password,
          }),
        })

        const payload = await response.json()

        if (!response.ok) {
          lastFailureMessage = payload?.message || "Invalid credentials."
          continue
        }

        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("userId", String(payload.user.id))
        localStorage.setItem("userRole", payload.user.role)
        localStorage.setItem("userRoleGroup", payload.user.roleGroup)

        if (payload.user.userTypeCode) {
          localStorage.setItem("userTypeCode", String(payload.user.userTypeCode))
        } else {
          localStorage.removeItem("userTypeCode")
        }

        navigate("/")
        return
      } catch {
        setErrors({ email: "Unable to reach the server. Please try again." })
        return
      }
    }

    setErrors({ email: lastFailureMessage })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <Card className="border bg-card">
          <CardHeader>
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:opacity-90"
            >
              <ArrowLeft className="size-4" />
              <span>Back to home</span>
            </Link>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {isSignUp ? "Sign up" : "Sign in"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">University Library</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs
              value={selectedRole}
              onValueChange={setSelectedRole}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                {roles.map((role) => (
                  <TabsTrigger key={role.id} value={role.id}>
                    {role.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field className="space-y-0">
                <FieldLabel htmlFor={errors.email ? "input-invalid" : "email"}>
                  Email
                </FieldLabel>
                <Input
                  id={errors.email ? "input-invalid" : "email"}
                  name="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={form.email}
                  onChange={handleChange}
                  aria-invalid={!!errors.email}
                  className={
                    errors.email
                      ? "border-destructive text-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {errors.email && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.email}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel
                  htmlFor={errors.password ? "input-invalid" : "password"}
                >
                  Password
                </FieldLabel>
                <Input
                  id={errors.password ? "input-invalid" : "password"}
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  aria-invalid={!!errors.password}
                  className={
                    errors.password
                      ? "border-destructive text-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {errors.password && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.password}
                  </p>
                )}
              </Field>

              {isSignUp && (
                <Field>
                  <FieldLabel
                    htmlFor={
                      errors.confirmPassword
                        ? "input-invalid"
                        : "confirmPassword"
                    }
                  >
                    Retype password
                  </FieldLabel>
                  <Input
                    id={
                      errors.confirmPassword
                        ? "input-invalid"
                        : "confirmPassword"
                    }
                    name="confirmPassword"
                    type="password"
                    placeholder="Retype your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    aria-invalid={!!errors.confirmPassword}
                    className={
                      errors.confirmPassword
                        ? "border-destructive text-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.confirmPassword}
                    </p>
                  )}
                </Field>
              )}

              {success && (
                <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                  {success}
                </p>
              )}

              <Button type="submit" className="w-full">
                {submitLabel}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(isSignUp ? "signin" : "signup")}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {isSignUp ? "Sign in" : "Create an account"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
