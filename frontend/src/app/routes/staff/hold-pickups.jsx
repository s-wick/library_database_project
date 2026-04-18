import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, RefreshCw, Search, UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Navbar } from "@/components/navbar"
import { API_BASE_URL } from "@/lib/api-config"

function getDefaultPickupDateTime() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset()
  const localDate = new Date(now.getTime() - timezoneOffset * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function formatDateTime(value) {
  if (!value) return "-"

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleString()
}

export default function HoldPickupsPage() {
  const apiBaseUrl = API_BASE_URL
  const [pickupDate, setPickupDate] = useState(getDefaultPickupDateTime())
  const [searchText, setSearchText] = useState("")
  const deferredSearchText = useDeferredValue(searchText)
  const [rows, setRows] = useState([])
  const [selectedHoldId, setSelectedHoldId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState("")
  const [serverError, setServerError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedHoldId) || null,
    [rows, selectedHoldId]
  )

  async function fetchPickupReadyRows(signal) {
    setIsLoading(true)
    setServerError("")

    try {
      const params = new URLSearchParams()
      if (deferredSearchText.trim()) {
        params.set("q", deferredSearchText.trim())
      }

      const response = await fetch(
        `${apiBaseUrl}/api/holds/pickup-ready?${params.toString()}`,
        { signal }
      )
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || "Unable to load pickup-ready holds.")
      }

      const nextRows = Array.isArray(data.rows)
        ? data.rows.map((row) => ({
            ...row,
            id: `${row.itemId}-${row.userId}-${row.requestDate}`,
          }))
        : []

      setRows(nextRows)
      setSelectedHoldId((current) =>
        nextRows.some((row) => row.id === current) ? current : ""
      )
    } catch (error) {
      if (error.name === "AbortError") return
      setServerError(error.message || "Unable to load pickup-ready holds.")
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchPickupReadyRows(controller.signal)
    return () => controller.abort()
  }, [apiBaseUrl, deferredSearchText])

  async function handleCompletePickup(event) {
    event.preventDefault()
    setServerError("")
    setSuccessMessage("")

    if (!selectedRow) {
      setFieldError("Select one pickup-ready hold.")
      return
    }

    if (!pickupDate) {
      setFieldError("Pickup date and time are required.")
      return
    }

    setFieldError("")
    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/holds/pickup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: Number(selectedRow.itemId),
          userId: Number(selectedRow.userId),
          requestDate: selectedRow.requestDate,
          pickupDate: new Date(pickupDate).toISOString(),
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setServerError(data.message || "Unable to complete pickup.")
        return
      }

      setSuccessMessage(data.message || "Pickup completed.")
      setPickupDate(getDefaultPickupDateTime())
      setSelectedHoldId("")

      const controller = new AbortController()
      await fetchPickupReadyRows(controller.signal)
    } catch {
      setServerError("Unable to connect to server.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Button asChild variant="outline">
          <Link to="/management-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,0.9fr)]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Pickup-ready holds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <Field className="flex-1">
                  <FieldLabel htmlFor="pickupSearch">Search queue</FieldLabel>
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="pickupSearch"
                      value={searchText}
                      onChange={(event) => {
                        setSearchText(event.target.value)
                        setServerError("")
                        setSuccessMessage("")
                      }}
                      className="pl-9"
                      placeholder="Search by item, user, email, or ID"
                    />
                  </div>
                </Field>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => {
                    const controller = new AbortController()
                    fetchPickupReadyRows(controller.signal)
                  }}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[56px]"></TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Ready at</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length ? (
                      rows.map((row) => {
                        const isSelected = selectedHoldId === row.id
                        return (
                          <TableRow
                            key={row.id}
                            data-state={isSelected ? "selected" : undefined}
                          >
                            <TableCell className="align-middle">
                              <div className="flex justify-center">
                                <input
                                  type="radio"
                                  name="pickupHold"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedHoldId(row.id)
                                    setFieldError("")
                                    setServerError("")
                                    setSuccessMessage("")
                                  }}
                                  aria-label={`Select hold for ${row.itemTitle}`}
                                  className="h-4 w-4"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="align-top whitespace-normal">
                              <div className="font-medium">{row.itemTitle}</div>
                              <div className="text-xs text-muted-foreground">
                                Item #{row.itemId}
                              </div>
                            </TableCell>
                            <TableCell className="align-top whitespace-normal">
                              <div className="font-medium">
                                {row.userName || `User #${row.userId}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {row.userEmail} · {row.userType}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDateTime(row.pickupReadyAt)}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(row.pickupExpiresAt)}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          {isLoading
                            ? "Loading pickup-ready holds..."
                            : "No pickup-ready holds found."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Complete pickup</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCompletePickup}>
                <Field data-invalid={!!fieldError}>
                  <FieldLabel>Selected hold</FieldLabel>
                  <FieldDescription>
                    Staff confirms the user has physically picked up this item.
                  </FieldDescription>
                  <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                    {selectedRow ? (
                      <div className="space-y-1">
                        <p className="font-medium">{selectedRow.itemTitle}</p>
                        <p className="text-muted-foreground">
                          {selectedRow.userName ||
                            `User #${selectedRow.userId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Request: {formatDateTime(selectedRow.requestDate)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Select one pickup-ready hold from the table.
                      </p>
                    )}
                  </div>
                  {fieldError ? <FieldError>{fieldError}</FieldError> : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="pickupDate">
                    Pickup date and time
                  </FieldLabel>
                  <Input
                    id="pickupDate"
                    type="datetime-local"
                    value={pickupDate}
                    onChange={(event) => setPickupDate(event.target.value)}
                  />
                </Field>

                {serverError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {serverError}
                  </div>
                ) : null}

                {successMessage ? (
                  <div className="rounded-md border border-emerald-600/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                    {successMessage}
                  </div>
                ) : null}

                <Button type="submit" disabled={isSubmitting || !rows.length}>
                  {isSubmitting ? "Completing..." : "Mark as picked up"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
