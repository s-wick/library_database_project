import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  CalendarClock,
  PackageCheck,
  RefreshCw,
  Search,
} from "lucide-react"
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
import { API_BASE_URL } from "@/lib/api-config"

function getDefaultReturnDateTime() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset()
  const localDate = new Date(now.getTime() - timezoneOffset * 60_000)
  return localDate.toISOString().slice(0, 16)
}

export default function CheckInPage() {
  const apiBaseUrl = API_BASE_URL
  const [form, setForm] = useState({ returnDate: getDefaultReturnDateTime() })
  const [searchText, setSearchText] = useState("")
  const deferredSearchText = useDeferredValue(searchText)
  const [activeBorrows, setActiveBorrows] = useState([])
  const [selectedBorrowIds, setSelectedBorrowIds] = useState([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)
  const [catalogError, setCatalogError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  // Store all check-ins in this session
  const [sessionCheckIns, setSessionCheckIns] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Removed auto-refresh logic

  const selectedBorrows = useMemo(
    () =>
      activeBorrows.filter((borrow) =>
        selectedBorrowIds.includes(borrow.borrowTransactionId)
      ),
    [activeBorrows, selectedBorrowIds]
  )

  const previewDate = useMemo(() => {
    if (!form.returnDate) return ""
    const parsedDate = new Date(form.returnDate)
    if (Number.isNaN(parsedDate.getTime())) return ""
    return parsedDate.toLocaleString()
  }, [form.returnDate])

  function getFieldError(name, value) {
    const trimmedValue = String(value || "").trim()

    if (name === "selectedBorrowIds") {
      return Array.isArray(value) && value.length
        ? ""
        : "Select at least one active borrowed item to check in."
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

  useEffect(() => {
    const controller = new AbortController()

    async function fetchActiveBorrows() {
      setIsLoadingCatalog(true)
      setCatalogError("")

      try {
        const params = new URLSearchParams()
        if (deferredSearchText.trim()) {
          params.set("q", deferredSearchText.trim())
        }

        const response = await fetch(
          `${apiBaseUrl}/api/check-in/catalog?${params.toString()}`,
          { signal: controller.signal }
        )
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.message || "Unable to load active borrows.")
        }

        const nextRows = Array.isArray(data.rows) ? data.rows : []
        setActiveBorrows(nextRows)
        setSelectedBorrowIds((current) =>
          current.filter((selectedId) =>
            nextRows.some((row) => row.borrowTransactionId === selectedId)
          )
        )
      } catch (error) {
        if (error.name === "AbortError") return
        setCatalogError(error.message || "Unable to load active borrows.")
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCatalog(false)
        }
      }
    }

    fetchActiveBorrows()

    return () => controller.abort()
  }, [apiBaseUrl, deferredSearchText, refreshKey])

  // Removed auto-refresh effect

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
      selectedBorrowIds: getFieldError("selectedBorrowIds", selectedBorrowIds),
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
          records: selectedBorrows.map((borrow) => ({
            itemId: Number(borrow.itemId),
            userId: Number(borrow.borrowerId),
            checkoutDate: borrow.checkoutDate,
          })),
          returnDate: new Date(form.returnDate).toISOString(),
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setServerError(data.message || "Unable to complete check-in.")
        return
      }

      setSessionCheckIns((prev) => [
        {
          rows: selectedBorrows,
          returnDate: form.returnDate,
        },
        ...prev,
      ])
      setSuccessMessage(
        data.message || "Item checked in successfully and stock updated."
      )
      setForm({ returnDate: getDefaultReturnDateTime() })
      setSelectedBorrowIds([])
      setFieldErrors({})
    } catch {
      setServerError("Unable to connect to server.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatDateTime(value) {
    if (!value) return "-"

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value

    return parsed.toLocaleString()
  }

  function toggleBorrowSelection(borrowId) {
    setSelectedBorrowIds((current) =>
      current.includes(borrowId)
        ? current.filter((id) => id !== borrowId)
        : [...current, borrowId]
    )
    setFieldErrors((prev) => ({
      ...prev,
      selectedBorrowIds: "",
    }))
    setSuccessMessage("")
    setServerError("")
  }

  function selectAllVisible() {
    setSelectedBorrowIds(
      activeBorrows.map((borrow) => borrow.borrowTransactionId)
    )
    setFieldErrors((prev) => ({
      ...prev,
      selectedBorrowIds: "",
    }))
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Button asChild variant="outline">
          <Link to="/management-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,0.9fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-primary" />
                Check in borrowed item
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <Field className="flex-1">
                    <FieldLabel htmlFor="borrowSearch">
                      Search active borrow catalog
                    </FieldLabel>
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="borrowSearch"
                        value={searchText}
                        onChange={(event) => {
                          setSearchText(event.target.value)
                          setSuccessMessage("")
                          setServerError("")
                        }}
                        className="pl-9"
                        placeholder="Search by item title, item type, borrower name, email, or ID"
                      />
                    </div>
                  </Field>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoadingCatalog}
                    className="md:w-auto"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${isLoadingCatalog ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={selectAllVisible}
                    disabled={!activeBorrows.length}
                    className="md:w-auto"
                  >
                    Select all visible
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedBorrowIds([])}
                    disabled={!selectedBorrowIds.length}
                    className="md:w-auto"
                  >
                    Clear selection
                  </Button>
                </div>

                {catalogError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {catalogError}
                  </div>
                ) : null}

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[56px]">Select</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Borrower</TableHead>
                        <TableHead>Checked out</TableHead>
                        <TableHead>Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeBorrows.length ? (
                        activeBorrows.map((borrow) => {
                          const isSelected = selectedBorrowIds.includes(
                            borrow.borrowTransactionId
                          )

                          return (
                            <TableRow
                              key={borrow.borrowTransactionId}
                              data-state={isSelected ? "selected" : undefined}
                            >
                              <TableCell className="align-middle">
                                <div className="flex justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      toggleBorrowSelection(
                                        borrow.borrowTransactionId
                                      )
                                    }
                                    aria-label={`Select ${borrow.itemName}`}
                                    className="h-4 w-4 rounded border-input"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="font-medium">
                                  {borrow.itemName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {borrow.itemType} · Item #{borrow.itemId}
                                </div>
                              </TableCell>
                              <TableCell className="align-top whitespace-normal">
                                <div className="font-medium">
                                  {borrow.borrowerName ||
                                    `User #${borrow.borrowerId}`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {borrow.borrowerEmail} · {borrow.borrowerType}
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatDateTime(borrow.checkoutDate)}
                              </TableCell>
                              <TableCell>
                                {formatDateTime(borrow.dueDate)}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-8 text-center text-sm text-muted-foreground"
                          >
                            {isLoadingCatalog
                              ? "Loading active borrow catalog..."
                              : "No active borrowed items matched your search."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <Field data-invalid={!!fieldErrors.selectedBorrowIds}>
                  <FieldLabel>Selected borrow records</FieldLabel>
                  <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                    {selectedBorrows.length ? (
                      <div className="space-y-2 text-muted-foreground">
                        <p className="font-medium text-foreground">
                          {selectedBorrows.length} item(s) selected
                        </p>
                        <div className="space-y-1">
                          {selectedBorrows.slice(0, 5).map((borrow) => (
                            <p key={borrow.borrowTransactionId}>
                              {borrow.itemName} -{" "}
                              {borrow.borrowerName ||
                                `User #${borrow.borrowerId}`}
                            </p>
                          ))}
                          {selectedBorrows.length > 5 ? (
                            <p>
                              And {selectedBorrows.length - 5} more selected
                              item(s).
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Select one or more rows from the active borrow catalog
                        above.
                      </p>
                    )}
                  </div>
                  <FieldError>{fieldErrors.selectedBorrowIds}</FieldError>
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
                  disabled={isSubmitting || !selectedBorrowIds.length}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting
                    ? "Checking in..."
                    : selectedBorrowIds.length === 1
                      ? "Record 1 check-in"
                      : `Record ${selectedBorrowIds.length} check-ins`}
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
                <p className="font-medium">Session check-in history</p>
                {sessionCheckIns.length ? (
                  <div className="mt-1 space-y-4 text-muted-foreground">
                    {sessionCheckIns.map((checkIn, idx) => (
                      <div
                        key={idx}
                        className="border-b pb-2 last:border-b-0 last:pb-0"
                      >
                        <p className="font-semibold text-foreground">
                          {checkIn.rows.length} item(s) checked in
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            at {formatDateTime(checkIn.returnDate)}
                          </span>
                        </p>
                        <div className="mt-1 space-y-1">
                          {checkIn.rows.slice(0, 3).map((borrow) => (
                            <p key={borrow.borrowTransactionId}>
                              {borrow.itemName || `Item #${borrow.itemId}`} -{" "}
                              {borrow.borrowerName ||
                                `User #${borrow.userId || borrow.borrowerId}`}
                            </p>
                          ))}
                          {checkIn.rows.length > 3 && (
                            <p>And {checkIn.rows.length - 3} more item(s).</p>
                          )}
                        </div>
                      </div>
                    ))}
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
