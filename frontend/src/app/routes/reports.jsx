import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Calendar, Check, ChevronsUpDown, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { API_BASE_URL } from "@/lib/api-config"

export default function ReportsPage() {
  const [itemTypes, setItemTypes] = useState([
    { itemCode: 1, itemType: "BOOK" },
    { itemCode: 2, itemType: "VIDEO" },
    { itemCode: 3, itemType: "AUDIO" },
    { itemCode: 4, itemType: "RENTAL_EQUIPMENT" },
  ])
  const [genres, setGenres] = useState([])
  const [filters, setFilters] = useState({
    reportType: "itemsCheckedOut",
    startDate: "",
    endDate: "",
    userType: "",
    itemType: "",
    genre: [],
    overdue: "all",
    availability: "all",
    name: "",
    author: "",
  })
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenreOpen, setIsGenreOpen] = useState(false)
  const [genreQuery, setGenreQuery] = useState("")

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/genres/search?q=`)
      .then((response) => response.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.genres)) {
          setGenres(data.genres)
        }
      })
      .catch(() => {
        setGenres([])
      })
  }, [])

  function onChange(event) {
    const { name, value } = event.target
    setFilters((prev) => {
      if (name === "itemType") {
        if (value === "RENTAL_EQUIPMENT") {
          return { ...prev, itemType: value, genre: ["NOT_APPLICABLE"] }
        }
        if (Array.isArray(prev.genre) && prev.genre.includes("NOT_APPLICABLE")) {
          return { ...prev, itemType: value, genre: [] }
        }
      }
      return { ...prev, [name]: value }
    })
  }

  function toggleGenre(genre) {
    setFilters((prev) => {
      const selected = Array.isArray(prev.genre) ? prev.genre : []
      if (selected.includes(genre)) {
        return { ...prev, genre: selected.filter((item) => item !== genre) }
      }
      return { ...prev, genre: [...selected, genre] }
    })
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        reportType: filters.reportType,
        startDate: filters.startDate,
        endDate: filters.endDate,
        userType: filters.userType,
        itemType: filters.itemType,
        genre: Array.isArray(filters.genre) ? filters.genre.join(",") : "",
        overdue: filters.overdue,
        availability: filters.availability,
        name: filters.name,
        author: filters.author,
      })

      const response = await fetch(`${API_BASE_URL}/api/reports?${params}`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.message || "Failed to generate report.")
        setRows([])
        setSummary(null)
        return
      }

      setRows(Array.isArray(data.rows) ? data.rows : [])
      setSummary(data.summary || null)
    } catch {
      setError("Unable to connect to server.")
      setRows([])
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }

  function formatDate(value) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleDateString()
  }

  function formatPickerDate(value) {
    if (!value) return "Select a date"
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString()
  }

  const supportsGenreForItemType =
    filters.itemType === "" ||
    filters.itemType === "BOOK" ||
    filters.itemType === "AUDIO" ||
    filters.itemType === "VIDEO"
  const isUserSearchReport = filters.reportType === "userItemSearch"
  const filteredGenres = genres.filter((genre) =>
    genre.toLowerCase().includes(genreQuery.trim().toLowerCase())
  )

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
            <CardTitle>Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
              onSubmit={onSubmit}
            >
              <Field>
                <FieldLabel htmlFor="reportType">Report type</FieldLabel>
                <select
                  id="reportType"
                  name="reportType"
                  value={filters.reportType}
                  onChange={onChange}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                >
                  <option value="itemsCheckedOut">Items checked out</option>
                  <option value="finesOwed">Fines owed</option>
                  <option value="userItemSearch">User item search</option>
                </select>
              </Field>
              {!isUserSearchReport && (
                <Field>
                  <FieldLabel htmlFor="startDate">From date</FieldLabel>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className={`h-9 w-full justify-start text-left font-normal ${!filters.startDate ? "text-muted-foreground" : ""}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatPickerDate(filters.startDate)}
                    </Button>
                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={filters.startDate}
                      onChange={onChange}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>
                </Field>
              )}
              {!isUserSearchReport && (
                <Field>
                  <FieldLabel htmlFor="endDate">To date</FieldLabel>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className={`h-9 w-full justify-start text-left font-normal ${!filters.endDate ? "text-muted-foreground" : ""}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatPickerDate(filters.endDate)}
                    </Button>
                    <input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={filters.endDate}
                      onChange={onChange}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>
                </Field>
              )}
              {!isUserSearchReport && (
                <Field>
                  <FieldLabel htmlFor="userType">User type</FieldLabel>
                  <select
                    id="userType"
                    name="userType"
                    value={filters.userType}
                    onChange={onChange}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                  >
                    <option value="">All</option>
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty</option>
                  </select>
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="itemType">Item type</FieldLabel>
                <select
                  id="itemType"
                  name="itemType"
                  value={filters.itemType}
                  onChange={onChange}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                >
                  <option value="">All</option>
                  {itemTypes.map((type) => (
                    <option key={type.itemCode} value={type.itemType}>
                      {type.itemType}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="genre">Genre</FieldLabel>
                {!supportsGenreForItemType ? (
                  <Input value="Not applicable" disabled className="h-9" />
                ) : (
                  <Popover open={isGenreOpen} onOpenChange={setIsGenreOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-9 w-full justify-between px-2 py-1.5"
                      >
                        <div className="flex flex-wrap items-center gap-1">
                          {filters.genre.length === 0 ? (
                            <span className="text-muted-foreground">
                              Select genres
                            </span>
                          ) : (
                            filters.genre.map((genre) => (
                              <Badge key={genre} variant="secondary">
                                {genre}
                                <button
                                  type="button"
                                  className="ml-1"
                                  onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    toggleGenre(genre)
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-2" align="start">
                      <Input
                        value={genreQuery}
                        onChange={(event) => setGenreQuery(event.target.value)}
                        placeholder="Search genres..."
                        className="mb-2 h-9"
                      />
                      <div className="max-h-48 overflow-y-auto rounded-md border">
                        {filteredGenres.length === 0 ? (
                          <p className="px-2 py-2 text-sm text-muted-foreground">
                            No genres found.
                          </p>
                        ) : (
                          filteredGenres.map((genre) => {
                            const selected = filters.genre.includes(genre)
                            return (
                              <button
                                key={genre}
                                type="button"
                                className="flex w-full items-center justify-between px-2 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => toggleGenre(genre)}
                              >
                                <span>{genre}</span>
                                {selected && <Check className="h-4 w-4" />}
                              </button>
                            )
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </Field>
              {!isUserSearchReport && (
                <Field>
                  <FieldLabel htmlFor="overdue">Overdue</FieldLabel>
                  <select
                    id="overdue"
                    name="overdue"
                    value={filters.overdue}
                    onChange={onChange}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="overdue">Overdue only</option>
                    <option value="notOverdue">Not overdue</option>
                  </select>
                </Field>
              )}
              {isUserSearchReport && (
                <Field>
                  <FieldLabel htmlFor="availability">Availability</FieldLabel>
                  <select
                    id="availability"
                    name="availability"
                    value={filters.availability}
                    onChange={onChange}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="available">Available</option>
                    <option value="notAvailable">Not Available</option>
                  </select>
                </Field>
              )}
              {isUserSearchReport && (
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    value={filters.name}
                    onChange={onChange}
                    placeholder="Item name"
                  />
                </Field>
              )}
              {isUserSearchReport && (
                <Field>
                  <FieldLabel htmlFor="author">Author</FieldLabel>
                  <Input
                    id="author"
                    name="author"
                    value={filters.author}
                    onChange={onChange}
                    placeholder="Author"
                  />
                </Field>
              )}
              <div className="flex items-end">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Generating..." : "Generate report"}
                </Button>
              </div>
            </form>
            {error && (
              <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Total records</p>
                  <p className="text-lg font-semibold">
                    {summary.totalRecords ?? 0}
                  </p>
                </div>
                {filters.reportType === "itemsCheckedOut" ? (
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">
                      Overdue count
                    </p>
                    <p className="text-lg font-semibold">
                      {summary.overdueCount ?? 0}
                    </p>
                  </div>
                ) : filters.reportType === "userItemSearch" ? (
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">
                      Available count
                    </p>
                    <p className="text-lg font-semibold">
                      {summary.availableCount ?? 0}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">
                      Total amount
                    </p>
                    <p className="text-lg font-semibold">
                      ${Number(summary.totalAmount || 0)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  {filters.reportType === "itemsCheckedOut" ? (
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Item type</th>
                      <th className="px-3 py-2">User type</th>
                      <th className="px-3 py-2">Borrower</th>
                      <th className="px-3 py-2">Checkout</th>
                      <th className="px-3 py-2">Due</th>
                      <th className="px-3 py-2">Overdue</th>
                    </tr>
                  ) : filters.reportType === "userItemSearch" ? (
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Item type</th>
                      <th className="px-3 py-2">Author</th>
                      <th className="px-3 py-2">Genre</th>
                      <th className="px-3 py-2">Availability</th>
                      <th className="px-3 py-2">In stock</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-3 py-2">Fine ID</th>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">User type</th>
                      <th className="px-3 py-2">Borrower</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Reason</th>
                      <th className="px-3 py-2">Assigned</th>
                      <th className="px-3 py-2">Overdue</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        className="px-3 py-4 text-muted-foreground"
                        colSpan={
                          filters.reportType === "itemsCheckedOut"
                            ? 7
                            : filters.reportType === "userItemSearch"
                              ? 6
                              : 8
                        }
                      >
                        No report data.
                      </td>
                    </tr>
                  ) : filters.reportType === "itemsCheckedOut" ? (
                    rows.map((row) => (
                      <tr key={row.borrowTransactionId} className="border-t">
                        <td className="px-3 py-2">{row.itemName || "-"}</td>
                        <td className="px-3 py-2">{row.itemType || "-"}</td>
                        <td className="px-3 py-2">{row.userType || "-"}</td>
                        <td className="px-3 py-2">
                          {row.borrowerName || row.borrowerId || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {formatDate(row.checkoutDate)}
                        </td>
                        <td className="px-3 py-2">{formatDate(row.dueDate)}</td>
                        <td className="px-3 py-2">
                          {Number(row.isOverdue) === 1 ? "Yes" : "No"}
                        </td>
                      </tr>
                    ))
                  ) : filters.reportType === "userItemSearch" ? (
                    rows.map((row) => (
                      <tr key={row.itemId} className="border-t">
                        <td className="px-3 py-2">{row.itemName || "-"}</td>
                        <td className="px-3 py-2">{row.itemType || "-"}</td>
                        <td className="px-3 py-2">{row.author || "-"}</td>
                        <td className="px-3 py-2">{row.genres || "-"}</td>
                        <td className="px-3 py-2">{row.availability || "-"}</td>
                        <td className="px-3 py-2">{row.inStock ?? 0}</td>
                      </tr>
                    ))
                  ) : (
                    rows.map((row) => (
                      <tr key={row.fineId} className="border-t">
                        <td className="px-3 py-2">{row.fineId}</td>
                        <td className="px-3 py-2">{row.itemName || "-"}</td>
                        <td className="px-3 py-2">{row.userType || "-"}</td>
                        <td className="px-3 py-2">
                          {row.borrowerName || row.borrowerId || "-"}
                        </td>
                        <td className="px-3 py-2">
                          ${Number(row.amount || 0)}
                        </td>
                        <td className="px-3 py-2">{row.fineReason || "-"}</td>
                        <td className="px-3 py-2">
                          {formatDate(row.dateAssigned)}
                        </td>
                        <td className="px-3 py-2">
                          {Number(row.isOverdue) === 1 ? "Yes" : "No"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
