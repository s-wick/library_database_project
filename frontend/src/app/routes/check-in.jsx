import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, CalendarClock, PackageCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { API_BASE_URL } from "@/lib/api-config"

function getDefaultReturnDateTime() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset()
  const localDate = new Date(now.getTime() - timezoneOffset * 60_000)
  return localDate.toISOString().slice(0, 16)
}

export default function CheckInPage() {
  const apiBaseUrl = API_BASE_URL
  const [form, setForm] = useState({
    itemId: "",
    userId: "",
    returnDate: getDefaultReturnDateTime(),
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [lastCheckIn, setLastCheckIn] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const previewDate = useMemo(() => {
    if (!form.returnDate) return ""
    const parsedDate = new Date(form.returnDate)
    if (Number.isNaN(parsedDate.getTime())) return ""
    return parsedDate.toLocaleString()
  }, [form.returnDate])

  function getFieldError(name, value) {
    const trimmedValue = String(value || "").trim()

    if ((name === "itemId" || name === "userId") && !trimmedValue) {
      return `${name === "itemId" ? "Item" : "User"} ID is required.`
    }

    if (
      (name === "itemId" || name === "userId") &&
      !/^\d+$/.test(trimmedValue)
    ) {
      return `${name === "itemId" ? "Item" : "User"} ID must be a whole number.`
    }

    if (name === "returnDate") {
      if (!trimmedValue) return "Return date and time are required."

      const parsedDate = new Date(trimmedValue)
      if (Number.isNaN(parsedDate.getTime())) {
        return "Return date and time must be valid."
      }
    }

    return ""
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: "" }))
    setServerError("")
    setSuccessMessage("")
  }

  function handleBlur(event) {
    const { name, value } = event.target
    const nextError = getFieldError(name, value)
    if (!nextError) return

    setFieldErrors((prev) => ({ ...prev, [name]: nextError }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setServerError("")
    setSuccessMessage("")

    const nextErrors = {
      itemId: getFieldError("itemId", form.itemId),
      userId: getFieldError("userId", form.userId),
      returnDate: getFieldError("returnDate", form.returnDate),
    }

    if (Object.values(nextErrors).some(Boolean)) {
      setFieldErrors(nextErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: Number(form.itemId),
          userId: Number(form.userId),
          returnDate: new Date(form.returnDate).toISOString(),
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setServerError(data.message || "Unable to complete check-in.")
        return
      }

      setLastCheckIn(data.data || null)
      setSuccessMessage(
        data.message || "Item checked in successfully and stock updated."
      )
      setForm({
        itemId: "",
        userId: "",
        returnDate: getDefaultReturnDateTime(),
      })
      setFieldErrors({})
    } catch {
      setServerError("Unable to connect to server.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Button asChild variant="outline">
          <Link to="/management-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-primary" />
                Check in borrowed item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <Field data-invalid={!!fieldErrors.itemId}>
                  <FieldLabel htmlFor="itemId">Item ID</FieldLabel>
                  <Input
                    id="itemId"
                    name="itemId"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.itemId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!fieldErrors.itemId}
                    placeholder="Enter the returned item ID"
                    required
                  />
                  <FieldError>{fieldErrors.itemId}</FieldError>
                </Field>

                <Field data-invalid={!!fieldErrors.userId}>
                  <FieldLabel htmlFor="userId">User ID</FieldLabel>
                  <Input
                    id="userId"
                    name="userId"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.userId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!fieldErrors.userId}
                    placeholder="Enter the student user ID"
                    required
                  />
                  <FieldError>{fieldErrors.userId}</FieldError>
                </Field>

                <Field data-invalid={!!fieldErrors.returnDate}>
                  <FieldLabel htmlFor="returnDate">
                    Return date and time
                  </FieldLabel>
                  <Input
                    id="returnDate"
                    name="returnDate"
                    type="datetime-local"
                    value={form.returnDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!fieldErrors.returnDate}
                    required
                  />
                  <FieldDescription>
                    The selected timestamp will be saved to the borrow record
                    and the item stock will increase by 1.
                  </FieldDescription>
                  <FieldError>{fieldErrors.returnDate}</FieldError>
                </Field>

                {serverError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {serverError}
                  </div>
                ) : null}

                {successMessage ? (
                  <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? "Checking in..." : "Record check-in"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-primary" />
                Return summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="font-medium">Scheduled return timestamp</p>
                <p className="mt-1 text-muted-foreground">
                  {previewDate || "Select a valid return date and time."}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="font-medium">What this updates</p>
                <p className="mt-1 text-muted-foreground">
                  The matching active borrow record gets its return time, and
                  the item inventory in the database is incremented by one copy.
                </p>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="font-medium">Last successful check-in</p>
                {lastCheckIn ? (
                  <div className="mt-1 space-y-1 text-muted-foreground">
                    <p>Item ID: {lastCheckIn.itemId}</p>
                    <p>User ID: {lastCheckIn.userId}</p>
                    <p>
                      Returned at:{" "}
                      {new Date(lastCheckIn.returnDate).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-muted-foreground">
                    No check-in recorded in this session yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
