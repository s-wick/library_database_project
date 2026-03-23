import { useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { API_BASE_URL } from "@/lib/api-config"

const roles = [
  { id: "admin", label: "Admin / Staff" },
  { id: "student", label: "Student & Faculty" },
]

const emptyForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState("admin")
  const [mode, setMode] = useState("signin")
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSignUp = mode === "signup"
  const apiBaseUrl = API_BASE_URL

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
    if (nextMode === "signup") {
      setSelectedRole("student")
    }
    setErrors({})
    setSuccess("")
    setForm(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setSuccess("")
    const nextErrors = {}

    if (!form.email.trim()) {
      nextErrors.email = "Email is required."
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required."
    }

    if (isSignUp) {
      if (!form.confirmPassword.trim()) {
        nextErrors.confirmPassword = "Retype password is required."
      }

      if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match."
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const payload = isSignUp
      ? {
          roleGroup: "studentFaculty",
          role: "student",
          firstName: form.firstName.trim(),
          middleName: form.middleName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
        }
      : selectedRole === "admin"
        ? {
            roleGroup: "adminStaff",
            role: "admin",
            email: form.email.trim(),
            password: form.password,
          }
        : {
            roleGroup: "studentFaculty",
            role: "student",
            email: form.email.trim(),
            password: form.password,
          }

    setIsSubmitting(true)
    try {
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/signin"
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (!isSignUp && response.status === 401) {
          setErrors({ general: "Account does not exist. Create an account." })
          return
        }
        setErrors({
          general:
            data.message ||
            (isSignUp ? "Failed to create account." : "Failed to sign in."),
        })
        return
      }

      if (isSignUp) {
        setSuccess("Account created successfully.")
      } else {
        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("authToken", data?.token || "")
        localStorage.setItem("authUser", JSON.stringify(data?.user || {}))
        if (data?.user?.roleGroup === "adminStaff") {
          navigate("/management-dashboard")
        } else {
          navigate("/user-dashboard")
        }
      }
    } catch {
      setErrors({
        general: "Unable to connect to server.",
      })
    } finally {
      setIsSubmitting(false)
    }
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
                  <TabsTrigger
                    key={role.id}
                    value={role.id}
                    disabled={isSignUp && role.id === "admin"}
                  >
                    {role.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isSignUp && (
                <>
                  <Field className="space-y-0">
                    <FieldLabel htmlFor="firstName">First name</FieldLabel>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="First name"
                      value={form.firstName}
                      onChange={handleChange}
                    />
                  </Field>

                  <Field className="space-y-0">
                    <FieldLabel htmlFor="middleName">Middle name</FieldLabel>
                    <Input
                      id="middleName"
                      name="middleName"
                      type="text"
                      placeholder="Middle name"
                      value={form.middleName}
                      onChange={handleChange}
                    />
                  </Field>

                  <Field className="space-y-0">
                    <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last name"
                      value={form.lastName}
                      onChange={handleChange}
                    />
                  </Field>
                </>
              )}

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
              {errors.general && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors.general}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {submitLabel}
              </Button>
            </form>

            {(isSignUp || selectedRole !== "admin") && (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
