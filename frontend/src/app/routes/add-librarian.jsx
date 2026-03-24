import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { API_BASE_URL } from "@/lib/api-config"

function formatUsPhone(value = "") {
  const raw = String(value)
  const rawDigits = raw.replace(/\D/g, "")
  const digits = raw.trim().startsWith("+1")
    ? rawDigits.slice(1, 11)
    : rawDigits.slice(0, 10)
  if (!digits) return "+1 "
  if (digits.length <= 3) return `+1 (${digits}`
  if (digits.length <= 6) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export default function AddLibrarianPage() {
  const apiBaseUrl = API_BASE_URL
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}")
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "+1 ",
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (authUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <Button asChild variant="outline">
            <Link to="/management-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Access denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Only system administrators can access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  function getFieldError(name, value, currentForm) {
    if (name === "firstName" && !String(value || "").trim()) return "First name is required."
    if (name === "middleName" && !String(value || "").trim()) return "Middle name is required."
    if (name === "lastName" && !String(value || "").trim()) return "Last name is required."
    if (name === "email" && !String(value || "").trim()) return "Email is required."
    if (name === "password" && !String(value || "").trim()) return "Password is required."
    if (name === "phoneNumber") {
      const phoneRawDigits = String(currentForm.phoneNumber || "").replace(/\D/g, "")
      const phoneDigits = String(currentForm.phoneNumber || "")
        .trim()
        .startsWith("+1")
        ? phoneRawDigits.slice(1, 11)
        : phoneRawDigits.slice(0, 10)
      if (phoneDigits.length < 10) return "Phone number must have 10 digits."
    }
    return ""
  }

  function onChange(event) {
    const { name, value } = event.target
    setFieldErrors((prev) => ({ ...prev, [name]: "" }))
    if (name === "phoneNumber") {
      setForm((prev) => ({ ...prev, phoneNumber: formatUsPhone(value) }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function onBlur(event) {
    const { name, value } = event.target
    const message = getFieldError(name, value, form)
    if (!message) return
    setFieldErrors((prev) => ({ ...prev, [name]: message }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setFieldErrors({})
    setError("")
    setSuccess("")

    const nextErrors = {
      firstName: getFieldError("firstName", form.firstName, form),
      middleName: getFieldError("middleName", form.middleName, form),
      lastName: getFieldError("lastName", form.lastName, form),
      email: getFieldError("email", form.email, form),
      password: getFieldError("password", form.password, form),
      phoneNumber: getFieldError("phoneNumber", form.phoneNumber, form),
    }
    const phoneRawDigits = form.phoneNumber.replace(/\D/g, "")
    const phoneDigits = form.phoneNumber.trim().startsWith("+1")
      ? phoneRawDigits.slice(1, 11)
      : phoneRawDigits.slice(0, 10)
    const hasErrors = Object.values(nextErrors).some(Boolean)
    if (hasErrors) {
      setFieldErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const authToken = localStorage.getItem("authToken") || ""
      const response = await fetch(`${apiBaseUrl}/api/management/librarians`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          middleName: form.middleName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          phoneNumber: `+1${phoneDigits}`,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please sign in again.")
          return
        }
        setError(data.message || "Failed to add librarian.")
        return
      }
      setSuccess("Librarian added successfully.")
      setForm({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        password: "",
        phoneNumber: "+1 ",
      })
    } catch {
      setError("Unable to connect to server.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Button asChild variant="outline">
          <Link to="/management-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Add librarian</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <Field data-invalid={!!fieldErrors.firstName}>
                <FieldLabel htmlFor="firstName">First name</FieldLabel>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={onChange}
                  onBlur={onBlur}
                  aria-invalid={!!fieldErrors.firstName}
                  required
                />
                <FieldError>{fieldErrors.firstName}</FieldError>
              </Field>
              <Field data-invalid={!!fieldErrors.middleName}>
                <FieldLabel htmlFor="middleName">Middle name</FieldLabel>
                <Input
                  id="middleName"
                  name="middleName"
                  type="text"
                  value={form.middleName}
                  onChange={onChange}
                  onBlur={onBlur}
                  aria-invalid={!!fieldErrors.middleName}
                  required
                />
                <FieldError>{fieldErrors.middleName}</FieldError>
              </Field>
              <Field data-invalid={!!fieldErrors.lastName}>
                <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={onChange}
                  onBlur={onBlur}
                  aria-invalid={!!fieldErrors.lastName}
                  required
                />
                <FieldError>{fieldErrors.lastName}</FieldError>
              </Field>
              <Field data-invalid={!!fieldErrors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  onBlur={onBlur}
                  aria-invalid={!!fieldErrors.email}
                  required
                />
                <FieldError>{fieldErrors.email}</FieldError>
              </Field>
              <Field data-invalid={!!fieldErrors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  onBlur={onBlur}
                  aria-invalid={!!fieldErrors.password}
                  required
                />
                <FieldError>{fieldErrors.password}</FieldError>
              </Field>
              <Field data-invalid={!!fieldErrors.phoneNumber}>
                <FieldLabel htmlFor="phoneNumber">Phone number</FieldLabel>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  value={form.phoneNumber}
                  onChange={onChange}
                  onBlur={onBlur}
                  maxLength={17}
                  placeholder="+1 (555) 123-4567"
                  aria-invalid={!!fieldErrors.phoneNumber}
                  required
                />
                <FieldError>{fieldErrors.phoneNumber}</FieldError>
              </Field>

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                  {success}
                </p>
              )}

              <Button type="submit" disabled={isSubmitting}>
                Add librarian
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
