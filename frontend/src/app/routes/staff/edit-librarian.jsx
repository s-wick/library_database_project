import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { API_BASE_URL } from "@/lib/api-config"

function getActorHeaders(authUser) {
  return {
    "x-actor-id": String(authUser?.id || ""),
    "x-actor-role": String(authUser?.role || ""),
  }
}

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

function parseDateValue(value) {
  if (!value) return undefined
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toDateValue(date) {
  if (!date) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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
  const authUser = JSON.parse(sessionStorage.getItem("authUser") || "{}")
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
        const response = await fetch(`${API_BASE_URL}/api/staff`, {
          headers: getActorHeaders(authUser),
        })
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
          ...getActorHeaders(authUser),
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
      <div className="mx-auto max-w-6xl space-y-6">
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
            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <div className="rounded-md border p-4">
                {!selectedLibrarian ? (
                  <p className="text-sm text-muted-foreground">
                    {isLoading
                      ? "Loading librarians..."
                      : "Select a librarian to edit."}
                  </p>
                ) : (
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
                      <FieldLabel htmlFor="phoneNumber">
                        Phone number
                      </FieldLabel>
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
                      <FieldLabel htmlFor="isRetired">
                        Set retire date
                      </FieldLabel>
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="isRetired"
                            type="button"
                            variant="outline"
                            className={`h-9 w-full justify-start text-left font-normal ${!form.isRetired ? "text-muted-foreground" : ""}`}
                            disabled={!hasRetirementDate}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formatPickerDate(form.isRetired)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseDateValue(form.isRetired)}
                            onSelect={(date) => {
                              setFieldErrors((prev) => ({
                                ...prev,
                                isRetired: "",
                              }))
                              setForm((prev) => ({
                                ...prev,
                                isRetired: toDateValue(date),
                              }))
                            }}
                            disabled={(date) =>
                              date < new Date(`${todayDate}T00:00:00`)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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

              <div className="space-y-2 rounded-md border p-3">
                {librarians.map((librarian) => (
                  <button
                    key={librarian.staff_id}
                    type="button"
                    onClick={() => setSelectedId(String(librarian.staff_id))}
                    className={`w-full rounded-md border px-3 py-2 text-left transition hover:bg-muted/30 ${
                      String(librarian.staff_id) === selectedId
                        ? "border-primary"
                        : ""
                    }`}
                  >
                    <p className="font-medium">
                      {`${librarian.first_name || ""} ${librarian.last_name || ""}`.trim()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {librarian.email}
                      {librarian.is_retired
                        ? hasRetirementReached(librarian.is_retired)
                          ? " • Retired"
                          : " • Retirement scheduled"
                        : " • Active"}
                    </p>
                  </button>
                ))}
                {!isLoading && librarians.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No librarians found.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
