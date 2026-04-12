import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { API_BASE_URL } from "@/lib/api-config"

const CHART_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"]
const INITIAL_FILTERS = {
  reportType: "itemsCheckedOut",
  startDate: "",
  endDate: "",
  userType: "",
  itemType: "",
  genre: [],
  overdue: "all",
}

function formatItemTypeForDisplay(value) {
  if (!value) return "-"
  const v = String(value).trim()
  if (v === "RENTAL_EQUIPMENT") return "Rental equipment"
  return v
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
}

function formatItemTypesSummary(value) {
  if (!value || !String(value).trim()) return "-"
  return (
    String(value)
      .split(", ")
      .map((part) => formatItemTypeForDisplay(part.trim()))
      .filter((part) => part !== "-")
      .join(", ") || "-"
  )
}

function formatUserTypeForDisplay(value) {
  if (!value) return "-"
  const v = String(value).trim().toUpperCase()
  if (v === "FACULTY") return "Faculty"
  if (v === "STUDENT") return "Student"
  return (
    String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase()
  )
}

function buildCheckoutBuckets(rows) {
  const buckets = Array.from({ length: 6 }, (_, index) => ({
    label: String(index + 1),
    value: 0,
  }))
  const counts = new Map()

  rows.forEach((row) => {
    const key = String(row.userId || row.userEmail || row.userName || "")
    if (!key) return
    if (!counts.has(key)) counts.set(key, 0)
    if (!row.returnDate) {
      counts.set(key, (counts.get(key) || 0) + 1)
    }
  })

  counts.forEach((count) => {
    const clamped = Math.min(Math.max(count, 1), 6)
    buckets[clamped - 1].value += 1
  })

  return buckets
}

function buildDurationBuckets(rows) {
  const buckets = [
    { label: "1-3 days", value: 0 },
    { label: "4-7 days", value: 0 },
    { label: "7-10 days", value: 0 },
    { label: "10-14 days", value: 0 },
    { label: "15+ days", value: 0 },
  ]

  rows.forEach((row) => {
    const days = Number(row.borrowDays || 0)
    if (days <= 3) {
      buckets[0].value += 1
      return
    }
    if (days <= 7) {
      buckets[1].value += 1
      return
    }
    if (days <= 10) {
      buckets[2].value += 1
      return
    }
    if (days <= 14) {
      buckets[3].value += 1
      return
    }
    buckets[4].value += 1
  })

  return buckets
}

function buildPieBackground(data) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0)
  if (!total) return "conic-gradient(#e5e7eb 0deg 360deg)"

  let current = 0
  const segments = data
    .map((item, index) => ({ ...item, colorIndex: index }))
    .filter((item) => Number(item.value || 0) > 0)
    .map((item) => {
      const value = Number(item.value || 0)
      const start = (current / total) * 360
      current += value
      const end = (current / total) * 360
      return `${CHART_COLORS[item.colorIndex % CHART_COLORS.length]} ${start}deg ${end}deg`
    })

  return `conic-gradient(${segments.join(", ")})`
}

function PieChartCard({ title, data, className = "" }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const background = buildPieBackground(data)

  return (
    <div className={`flex flex-col rounded-md border p-4 ${className}`}>
      <p className="mb-3 text-sm font-medium">{title}</p>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 md:flex-row md:items-center md:justify-center">
        <div
          className="aspect-square h-36 w-36 shrink-0 rounded-full border"
          style={{ background }}
          aria-label={`${title} pie chart`}
        />
        <div className="space-y-2">
          {data.map((item, index) => {
            const value = Number(item.value || 0)
            const percent = total ? Math.round((value / total) * 100) : 0
            return (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span className="min-w-36">{item.label}</span>
                <span className="text-muted-foreground">
                  {value} ({percent}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BarChartCard({ data, chartHeading = "Financial Summary" }) {
  const max = data.length
    ? Math.max(...data.map((item) => Number(item.value || 0)))
    : 0
  const barColors = ["#d97706", "#0284c7", "#059669"]

  return (
    <div className="rounded-md border p-4">
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data.</p>
      ) : (
        <div className="rounded-md border bg-background p-4">
          <div className="mb-4 text-center">
            <p className="text-xl font-semibold">{chartHeading}</p>
          </div>
          <div className="flex h-72 items-end justify-center gap-6">
            {data.map((item, index) => {
              const value = Number(item.value || 0)
              const height = max > 0 ? (value / max) * 100 : 0
              return (
                <div
                  key={item.label}
                  className="flex w-32 flex-col items-center justify-end gap-2"
                >
                  <span className="text-sm font-medium">
                    ${value.toFixed(2)}
                  </span>
                  <div className="flex h-56 w-full items-end">
                    <div
                      className="w-full rounded-t-md"
                      style={{
                        height: `${height}%`,
                        backgroundColor: barColors[index % barColors.length],
                      }}
                    />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  const [itemTypes, setItemTypes] = useState([
    { itemCode: 1, itemType: "BOOK" },
    { itemCode: 2, itemType: "VIDEO" },
    { itemCode: 3, itemType: "AUDIO" },
    { itemCode: 4, itemType: "RENTAL_EQUIPMENT" },
  ])
  const [genres, setGenres] = useState([])
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS })
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
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
    if (name === "reportType") {
      setHasGenerated(false)
      setRows([])
      setSummary(null)
      setError("")
      setPage(1)
    }
    setFilters((prev) => {
      if (name === "itemType") {
        if (value !== "" && value !== "BOOK") {
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

  async function fetchReport(nextPage) {
    setError("")
    setIsLoading(true)
    setHasGenerated(true)
    try {
      const params = new URLSearchParams({
        reportType: filters.reportType,
        startDate: filters.startDate,
        endDate: filters.endDate,
        userType: filters.userType,
        itemType: filters.itemType,
        genre: Array.isArray(filters.genre) ? filters.genre.join(",") : "",
        overdue: filters.overdue,
        page: String(nextPage),
        pageSize: String(pageSize),
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

  async function onSubmit(event) {
    event.preventDefault()
    setPage(1)
    await fetchReport(1)
  }

  async function goToPage(nextPage) {
    if (nextPage < 1 || isLoading) return
    setPage(nextPage)
    await fetchReport(nextPage)
  }

  function resetFilters() {
    setFilters({ ...INITIAL_FILTERS })
    setRows([])
    setSummary(null)
    setError("")
    setHasGenerated(false)
    setPage(1)
    setGenreQuery("")
    setIsGenreOpen(false)
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

  const supportsGenreForItemType =
    filters.itemType === "" || filters.itemType === "BOOK"
  const filteredGenres = genres.filter((genre) =>
    genre.toLowerCase().includes(genreQuery.trim().toLowerCase())
  )
  const checkoutPieData =
    filters.reportType === "userDemographics" ? buildCheckoutBuckets(rows) : []
  const durationPieData =
    filters.reportType === "userDemographics" ? buildDurationBuckets(rows) : []
  const itemTypePieData =
    filters.reportType === "itemsCheckedOut"
      ? Object.entries(
          rows.reduce((acc, row) => {
            const key = row.itemType || "UNKNOWN"
            acc[key] = (acc[key] || 0) + 1
            return acc
          }, {})
        ).map(([label, value]) => ({
          label:
            label === "UNKNOWN" ? "Unknown" : formatItemTypeForDisplay(label),
          value: Number(value || 0),
        }))
      : []
  const userTypePieData =
    filters.reportType === "itemsCheckedOut"
      ? Object.entries(
          rows.reduce((acc, row) => {
            const key = formatUserTypeForDisplay(row.userType)
            acc[key] = (acc[key] || 0) + 1
            return acc
          }, {})
        ).map(([label, value]) => ({
          label,
          value: Number(value || 0),
        }))
      : []
  const revenueBarData =
    filters.reportType === "revenue"
      ? [
          {
            label: "Fines owed",
            value: Number(summary?.totalFineOwed || 0),
          },
          {
            label: "Item value",
            value: Number(summary?.totalItemValue || 0),
          },
          {
            label: "Balance",
            value: Number(summary?.totalRevenue || 0),
          },
        ]
      : []
  const revenueUserTypeBarData =
    filters.reportType === "revenue"
      ? Object.entries(
          rows.reduce((acc, row) => {
            const key = formatUserTypeForDisplay(row.userType)
            acc[key] = (acc[key] || 0) + Number(row.revenueAmount || 0)
            return acc
          }, {})
        ).map(([label, value]) => ({
          label,
          value: Number(value || 0),
        }))
      : []
  const overdueUsers =
    filters.reportType === "userDemographics"
      ? new Set(
          rows
            .filter((row) => Number(row.isOverdue) === 1 && !row.returnDate)
            .map((row) => row.userId || row.userEmail || row.userName)
            .filter(Boolean)
        ).size
      : 0

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
                  <option value="revenue">Revenue</option>
                  <option value="userDemographics">User demographics</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="startDate">From date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={`h-9 w-full justify-start text-left font-normal ${!filters.startDate ? "text-muted-foreground" : ""}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatPickerDate(filters.startDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDateValue(filters.startDate)}
                      onSelect={(date) =>
                        setFilters((prev) => ({
                          ...prev,
                          startDate: toDateValue(date),
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              <Field>
                <FieldLabel htmlFor="endDate">To date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={`h-9 w-full justify-start text-left font-normal ${!filters.endDate ? "text-muted-foreground" : ""}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatPickerDate(filters.endDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDateValue(filters.endDate)}
                      onSelect={(date) =>
                        setFilters((prev) => ({
                          ...prev,
                          endDate: toDateValue(date),
                        }))
                      }
                      disabled={(date) => {
                        const minDate = parseDateValue(filters.startDate)
                        if (!minDate) return false
                        return date < minDate
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </Field>
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
                      {formatItemTypeForDisplay(type.itemType)}
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
                        className="min-h-9 w-full justify-between overflow-hidden px-2 py-1.5"
                      >
                        <div className="flex max-w-[calc(100%-1.5rem)] items-center gap-1 overflow-x-auto">
                          {filters.genre.length === 0 ? (
                            <span className="text-muted-foreground">
                              Select genres
                            </span>
                          ) : (
                            filters.genre.map((genre) => (
                              <Badge
                                key={genre}
                                variant="secondary"
                                className="max-w-[160px] shrink-0"
                              >
                                <span className="truncate">{genre}</span>
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
              <div className="flex items-end justify-end gap-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-w-[160px] flex-1"
                >
                  {isLoading ? "Generating..." : "Generate report"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="px-3"
                >
                  Reset filters
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

        {hasGenerated && (
          <Card>
            <CardHeader>
              <CardTitle>Report results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary && (
                <div
                  className={`grid gap-4 ${filters.reportType === "revenue" ? "md:grid-cols-4" : "md:grid-cols-3"}`}
                >
                  <div
                    className={`rounded-md border p-3 ${filters.reportType === "revenue" ? "border-indigo-200 bg-indigo-50/70 dark:border-indigo-900/50 dark:bg-indigo-950/20" : filters.reportType === "itemsCheckedOut" ? "border-sky-200 bg-sky-50/70 dark:border-sky-900/50 dark:bg-sky-950/20" : filters.reportType === "userDemographics" ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20" : ""}`}
                  >
                    <p
                      className={`text-xs ${filters.reportType === "revenue" ? "text-indigo-700 dark:text-indigo-300" : filters.reportType === "itemsCheckedOut" ? "text-sky-700 dark:text-sky-300" : filters.reportType === "userDemographics" ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}
                    >
                      Records shown
                    </p>
                    <p
                      className={`text-lg font-semibold ${filters.reportType === "revenue" ? "text-indigo-900 dark:text-indigo-100" : filters.reportType === "itemsCheckedOut" ? "text-sky-900 dark:text-sky-100" : filters.reportType === "userDemographics" ? "text-emerald-900 dark:text-emerald-100" : ""}`}
                    >
                      {summary.totalRecords ?? 0}
                    </p>
                  </div>
                  {filters.reportType === "itemsCheckedOut" ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Overdue count
                      </p>
                      <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                        {summary.overdueCount ?? 0}
                      </p>
                    </div>
                  ) : filters.reportType === "userDemographics" ? (
                    <>
                      <div className="rounded-md border border-lime-200 bg-lime-50/70 p-3 dark:border-lime-900/50 dark:bg-lime-950/20">
                        <p className="text-xs text-lime-700 dark:text-lime-300">
                          Users
                        </p>
                        <p className="text-lg font-semibold text-lime-900 dark:text-lime-100">
                          {summary.totalUsers ?? 0}
                        </p>
                      </div>
                      <div className="rounded-md border border-rose-200 bg-rose-50/70 p-3 dark:border-rose-900/50 dark:bg-rose-950/20">
                        <p className="text-xs text-rose-700 dark:text-rose-300">
                          Users with active overdue items
                        </p>
                        <p className="text-lg font-semibold text-rose-900 dark:text-rose-100">
                          {overdueUsers}
                        </p>
                      </div>
                    </>
                  ) : filters.reportType === "revenue" ? (
                    <>
                      <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Fines owed
                        </p>
                        <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                          ${Number(summary.totalFineOwed || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-md border border-sky-200 bg-sky-50/70 p-3 dark:border-sky-900/50 dark:bg-sky-950/20">
                        <p className="text-xs text-sky-700 dark:text-sky-300">
                          Item value
                        </p>
                        <p className="text-lg font-semibold text-sky-900 dark:text-sky-100">
                          ${Number(summary.totalItemValue || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-md border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                          Balance
                        </p>
                        <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                          ${Number(summary.totalRevenue || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                          Sum of fines owed and item value
                        </p>
                      </div>
                    </>
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

              {filters.reportType === "userDemographics" && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <PieChartCard
                    title="Users by checked out items"
                    data={checkoutPieData}
                  />
                  <PieChartCard
                    title="Borrowing time distribution"
                    data={durationPieData}
                  />
                </div>
              )}
              {filters.reportType === "itemsCheckedOut" && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <PieChartCard
                    title="Checked out by item type"
                    data={itemTypePieData}
                  />
                  <PieChartCard
                    title="Checked out by user type"
                    data={userTypePieData}
                  />
                </div>
              )}
              {filters.reportType === "revenue" && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <BarChartCard
                    data={revenueBarData}
                    chartHeading="Overall financial summary"
                  />

                  <BarChartCard
                    data={revenueUserTypeBarData}
                    chartHeading="Financial summary by user"
                  />
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
                        <th className="px-3 py-2">Genre</th>
                        <th className="px-3 py-2">Checkout</th>
                        <th className="px-3 py-2">Due</th>
                        <th className="px-3 py-2">Overdue</th>
                      </tr>
                    ) : filters.reportType === "userDemographics" ? (
                      <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">User type</th>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Item type</th>
                        <th className="px-3 py-2">Genre</th>
                        <th className="px-3 py-2">Checkout</th>
                        <th className="px-3 py-2">Due</th>
                        <th className="px-3 py-2">Overdue</th>
                        <th className="px-3 py-2">Borrow days</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-3 py-2">Borrow date</th>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Item type</th>
                        <th className="px-3 py-2">User type</th>
                        <th className="px-3 py-2">Borrower</th>
                        <th className="px-3 py-2">Genre</th>
                        <th className="px-3 py-2">Fine Amount</th>
                        <th className="px-3 py-2">Item value</th>
                        <th className="px-3 py-2">Paid off</th>
                        <th className="px-3 py-2">Source</th>
                        <th className="px-3 py-2">Checkout</th>
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
                              ? 8
                              : filters.reportType === "userDemographics"
                                ? 10
                                : 12
                          }
                        >
                          No report data.
                        </td>
                      </tr>
                    ) : filters.reportType === "itemsCheckedOut" ? (
                      rows.map((row) => (
                        <tr key={row.borrowTransactionId} className="border-t">
                          <td className="px-3 py-2">{row.itemName || "-"}</td>
                          <td className="px-3 py-2">
                            {formatItemTypeForDisplay(row.itemType)}
                          </td>
                          <td className="px-3 py-2">
                            {formatUserTypeForDisplay(row.userType)}
                          </td>
                          <td className="px-3 py-2">
                            {row.borrowerName || row.borrowerId || "-"}
                          </td>
                          <td className="px-3 py-2">{row.genres || "-"}</td>
                          <td className="px-3 py-2">
                            {formatDate(row.checkoutDate)}
                          </td>
                          <td className="px-3 py-2">
                            {formatDate(row.dueDate)}
                          </td>
                          <td className="px-3 py-2">
                            {Number(row.isOverdue) === 1 ? "Yes" : "No"}
                          </td>
                        </tr>
                      ))
                    ) : filters.reportType === "userDemographics" ? (
                      rows.map((row) => (
                        <tr
                          key={row.userBorrowId || row.userId || row.userEmail}
                          className="border-t"
                        >
                          <td className="px-3 py-2">
                            {row.userName || row.userId || "-"}
                          </td>
                          <td className="px-3 py-2">{row.userEmail || "-"}</td>
                          <td className="px-3 py-2">
                            {formatUserTypeForDisplay(row.userType)}
                          </td>
                          <td className="px-3 py-2">
                            {row.itemName || row.itemId || "-"}
                          </td>
                          <td className="px-3 py-2">
                            {formatItemTypeForDisplay(row.itemType)}
                          </td>
                          <td className="px-3 py-2">
                            {row.genres?.trim() || "-"}
                          </td>
                          <td className="px-3 py-2">
                            {formatDate(row.checkoutDate)}
                          </td>
                          <td className="px-3 py-2">
                            {formatDate(row.dueDate)}
                          </td>
                          <td className="px-3 py-2">
                            {Number(row.isOverdue) === 1 ? "Yes" : "No"}
                          </td>
                          <td className="px-3 py-2">
                            {row.borrowDays === null
                              ? "-"
                              : Number(row.borrowDays)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      rows.map((row) => (
                        <tr key={row.fineId} className="border-t">
                          <td className="px-3 py-2">
                            {formatDate(row.checkoutDate)}
                          </td>
                          <td className="px-3 py-2">{row.itemName || "-"}</td>
                          <td className="px-3 py-2">
                            {formatItemTypeForDisplay(row.itemType)}
                          </td>
                          <td className="px-3 py-2">
                            {formatUserTypeForDisplay(row.userType)}
                          </td>
                          <td className="px-3 py-2">
                            {row.borrowerName || row.borrowerId || "-"}
                          </td>
                          <td className="px-3 py-2">{row.genres || "-"}</td>
                          <td className="px-3 py-2">
                            ${Number(row.fineOwed || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            ${Number(row.itemValue || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            {Number(row.isPaidOff) === 1 ? "Yes" : "No"}
                          </td>
                          <td className="px-3 py-2">
                            {row.revenueSource || "-"}
                          </td>
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
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  Page {summary?.page ?? page}
                  {summary?.pageSize ? ` · ${summary.pageSize} per page` : ""}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage((summary?.page ?? page) - 1)}
                    disabled={
                      filters.reportType === "userDemographics" ||
                      (summary?.page ?? page) <= 1 ||
                      isLoading
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage((summary?.page ?? page) + 1)}
                    disabled={
                      filters.reportType === "userDemographics" ||
                      !summary?.hasMore ||
                      isLoading
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
