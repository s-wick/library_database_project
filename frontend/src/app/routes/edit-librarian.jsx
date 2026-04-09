import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Calendar } from "lucide-react"
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

function formatPickerDate(value) {
  if (!value) return "Select a date"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function getRetiredDateValue(value) {
  if (!value) return ""
  return String(value).slice(0, 10)
}

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10)
}

function hasRetirementReached(value) {
  if (!value) return false
  return String(value).slice(0, 10) <= getTodayDateValue()
}

export default function EditLibrarianPage() {
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}")
  const todayDate = getTodayDateValue()
  const [librarians, setLibrarians] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "+1 ",
    isRetired: "",
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedLibrarian = useMemo(
    () =>
      librarians.find(
        (librarian) => String(librarian.staff_id) === selectedId
      ) || null,
    [librarians, selectedId]
  )

  useEffect(() => {
    async function loadLibrarians() {
      setIsLoading(true)
      setError("")
      try {
        const response = await fetch(`${API_BASE_URL}/api/staff`)
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          setError(data.message || "Failed to load librarians.")
          setLibrarians([])
          return
        }
        const rows = Array.isArray(data.librarians) ? data.librarians : []
        setLibrarians(rows)
        if (rows.length > 0) {
          setSelectedId(String(rows[0].staff_id))
        }
      } catch {
        setError("Unable to connect to server.")
        setLibrarians([])
      } finally {
        setIsLoading(false)
      }
    }

    loadLibrarians()
  }, [])

  useEffect(() => {
    if (!selectedLibrarian) return
    setForm({
      firstName: selectedLibrarian.first_name || "",
      middleName: selectedLibrarian.middle_name || "",
      lastName: selectedLibrarian.last_name || "",
      email: selectedLibrarian.email || "",
      password: "",
      phoneNumber: formatUsPhone(selectedLibrarian.phone_number || ""),
      isRetired: getRetiredDateValue(selectedLibrarian.is_retired),
    })
    setFieldErrors({})
    setError("")
    setSuccess("")
  }, [selectedLibrarian])

  const hasRetirementDate = Boolean(form.isRetired)

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
    if (name === "firstName" && !String(value || "").trim())
      return "First name is required."
    if (name === "lastName" && !String(value || "").trim())
      return "Last name is required."
    if (name === "email" && !String(value || "").trim())
      return "Email is required."
    if (
      name === "isRetired" &&
      String(value || "").trim() &&
      value < todayDate
    ) {
      return "Retired date must be today or a future date."
    }
    if (name === "phoneNumber") {
      const phoneRawDigits = String(currentForm.phoneNumber || "").replace(
        /\D/g,
        ""
      )
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
    if (name === "hasRetirementDate") {
      setForm((prev) => ({
        ...prev,
        isRetired: value === "true" ? prev.isRetired || todayDate : "",
      }))
      return
    }
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
    if (!selectedId) return

    setFieldErrors({})
    setError("")
    setSuccess("")

    const nextErrors = {
      firstName: getFieldError("firstName", form.firstName, form),
      middleName: getFieldError("middleName", form.middleName, form),
      lastName: getFieldError("lastName", form.lastName, form),
      email: getFieldError("email", form.email, form),
      isRetired: getFieldError("isRetired", form.isRetired, form),
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
      const response = await fetch(`${API_BASE_URL}/api/staff/${selectedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          middleName: form.middleName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          phoneNumber: `+1${phoneDigits}`,
          isRetired: form.isRetired,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || data.message || "Failed to update librarian.")
        return
      }

      setSuccess("Librarian updated successfully.")
      setLibrarians((prev) =>
        prev.map((librarian) =>
          String(librarian.staff_id) === selectedId
            ? { ...librarian, ...data.librarian }
            : librarian
        )
      )
      setForm((prev) => ({ ...prev, password: "" }))
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
            <CardTitle>Edit librarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Field>
                <FieldLabel htmlFor="selectedLibrarian">Librarian</FieldLabel>
                <select
                  id="selectedLibrarian"
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                  disabled={isLoading || librarians.length === 0}
                >
                  {librarians.length === 0 ? (
                    <option value="">
                      {isLoading
                        ? "Loading librarians..."
                        : "No librarians found"}
                    </option>
                  ) : (
                    librarians.map((librarian) => (
                      <option
                        key={librarian.staff_id}
                        value={String(librarian.staff_id)}
                      >
                        {`${librarian.first_name || ""} ${librarian.last_name || ""}`.trim()}
                        {librarian.is_retired
                          ? hasRetirementReached(librarian.is_retired)
                            ? " - Retired"
                            : " - Retirement scheduled"
                          : ""}
                      </option>
                    ))
                  )}
                </select>
              </Field>

              {selectedLibrarian && (
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
                    <FieldLabel htmlFor="middleName">
                      Middle name (optional)
                    </FieldLabel>
                    <Input
                      id="middleName"
                      name="middleName"
                      type="text"
                      value={form.middleName}
                      onChange={onChange}
                      onBlur={onBlur}
                      aria-invalid={!!fieldErrors.middleName}
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
                  <Field>
                    <FieldLabel htmlFor="password">
                      Password (leave blank to keep current)
                    </FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={onChange}
                    />
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
                  <Field>
                    <FieldLabel htmlFor="isRetired">Set retire date</FieldLabel>
                    <label className="mb-2 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="hasRetirementDate"
                        checked={hasRetirementDate}
                        value={hasRetirementDate ? "false" : "true"}
                        onChange={onChange}
                      />
                      Set retire date
                    </label>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        className={`h-9 w-full justify-start text-left font-normal ${!form.isRetired ? "text-muted-foreground" : ""}`}
                        disabled={!hasRetirementDate}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formatPickerDate(form.isRetired)}
                      </Button>
                      <input
                        id="isRetired"
                        name="isRetired"
                        type="date"
                        min={todayDate}
                        value={form.isRetired}
                        onChange={onChange}
                        onBlur={onBlur}
                        disabled={!hasRetirementDate}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {form.isRetired
                        ? hasRetirementReached(form.isRetired)
                          ? "Retired"
                          : "Retirement scheduled"
                        : "Active"}
                    </p>
                    <FieldError>{fieldErrors.isRetired}</FieldError>
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
                    Save changes
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
