import { useEffect, useMemo, useState } from "react"
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
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Navbar } from "@/components/navbar"
import { API_BASE_URL } from "@/lib/api-config"

const CHART_COLORS = ["#0f766e", "#0369a1", "#b45309", "#be123c", "#4f46e5"]
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

function formatUserTypeForDisplay(value) {
  if (!value) return "-"
  const v = String(value).trim().toUpperCase()
  if (v === "FACULTY") return "Faculty"
  if (v === "STUDENT") return "Student"
  return (
    String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase()
  )
}

function formatDate(value) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString()
}

function formatDateTime(value) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function formatCurrency(value) {
  const amount = Number(value || 0)
  return `$${amount.toFixed(2)}`
}

function formatPercent(value) {
  const num = Number(value || 0)
  return `${num.toFixed(1)}%`
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

function toDayKey(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function displayDayKey(dayKey) {
  if (!dayKey) return "-"
  const date = new Date(`${dayKey}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dayKey
  return date.toLocaleDateString()
}

function MetricCard({ label, value, helper }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {helper ? (
        <p className="text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  )
}

function AggregationTable({ columns, rows }) {
  const pageSize = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const startIndex = (page - 1) * pageSize
  const pagedRows = rows.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    setPage(1)
  }, [rows.length, columns.length])

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-3 text-muted-foreground"
                  colSpan={columns.length}
                >
                  No data.
                </td>
              </tr>
            ) : (
              pagedRows.map((row, index) => (
                <tr
                  key={`${startIndex + index}-${row[columns[0].key] ?? "row"}`}
                  className="border-t"
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-2 align-top">
                      {column.render
                        ? column.render(row[column.key], row)
                        : (row[column.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > pageSize ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {startIndex + 1}-
            {Math.min(startIndex + pageSize, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function HorizontalBarChart({ data, valueFormatter }) {
  const max = data.length
    ? Math.max(...data.map((item) => Number(item.value || 0)))
    : 0

  if (!data.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No data available for this chart.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const value = Number(item.value || 0)
        const percent = max ? (value / max) * 100 : 0
        return (
          <div
            key={item.label}
            className="grid grid-cols-[170px_1fr_120px] items-center gap-3"
          >
            <span className="text-sm font-medium">{item.label}</span>
            <div className="h-6 rounded-md bg-muted">
              <div
                className="h-6 rounded-md"
                style={{
                  width: `${percent}%`,
                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
            </div>
            <span className="text-right text-sm text-muted-foreground">
              {valueFormatter ? valueFormatter(value) : value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function StackedBarChart({ data, segments }) {
  const max = data.length
    ? Math.max(
        ...data.map((row) =>
          segments.reduce((sum, s) => sum + Number(row[s.key] || 0), 0)
        )
      )
    : 0

  if (!data.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No data available for this chart.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {segments.map((segment, idx) => (
          <span key={segment.key} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{
                backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
              }}
            />
            {segment.label}
          </span>
        ))}
      </div>
      {data.map((row) => {
        const total = segments.reduce(
          (sum, s) => sum + Number(row[s.key] || 0),
          0
        )
        const width = max ? (total / max) * 100 : 0

        return (
          <div
            key={row.label}
            className="grid grid-cols-[170px_1fr_120px] items-center gap-3"
          >
            <span className="text-sm font-medium">{row.label}</span>
            <div className="h-6 overflow-hidden rounded-md bg-muted">
              <div className="flex h-6" style={{ width: `${width}%` }}>
                {segments.map((segment, index) => {
                  const segmentValue = Number(row[segment.key] || 0)
                  const segmentWidth = total ? (segmentValue / total) * 100 : 0
                  return (
                    <div
                      key={segment.key}
                      style={{
                        width: `${segmentWidth}%`,
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                  )
                })}
              </div>
            </div>
            <span className="text-right text-sm text-muted-foreground">
              {total}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function CheckoutCalendarChart({ data }) {
  const [selectedDay, setSelectedDay] = useState(undefined)
  const dataByDay = useMemo(() => {
    const map = new Map()
    data.forEach((item) => {
      map.set(String(item.dayKey || ""), Number(item.value || 0))
    })
    return map
  }, [data])
  const defaultMonth = data.length
    ? new Date(`${data[data.length - 1].dayKey}T00:00:00`)
    : new Date()

  if (!data.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No data available for this chart.
      </p>
    )
  }

  return (
    <div className="rounded-md border bg-background p-2">
      <Calendar
        mode="single"
        selected={selectedDay}
        onSelect={setSelectedDay}
        defaultMonth={defaultMonth}
        numberOfMonths={1}
        captionLayout="dropdown"
        className="[--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]"
        formatters={{
          formatMonthDropdown: (date) =>
            date.toLocaleString("default", { month: "long" }),
        }}
        components={{
          DayButton: ({ children, modifiers, day, ...props }) => {
            const key = toDayKey(day.date)
            const count = dataByDay.get(key) || 0

            return (
              <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                {children}
                {!modifiers.outside ? (
                  <span className="text-[10px] leading-none text-muted-foreground">
                    {count > 0 ? count : ""}
                  </span>
                ) : null}
              </CalendarDayButton>
            )
          },
        }}
      />
    </div>
  )
}

function ChartBlock({ title, formula, chart, columns, rows }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{formula}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {chart}
        <div>
          <p className="mb-2 text-sm font-medium">
            Source table for this chart
          </p>
          <AggregationTable columns={columns} rows={rows} />
        </div>
      </CardContent>
    </Card>
  )
}

function buildBorrowedInsights(rows) {
  const byTypeMap = new Map()
  const overdueByTypeMap = new Map()
  const byTitleMap = new Map()
  const trendMap = new Map()
  let totalBorrowDays = 0

  rows.forEach((row) => {
    const itemType = formatItemTypeForDisplay(row.itemType)
    const itemTitle = row.itemName || "Unknown"
    const day = toDayKey(row.checkoutDate)
    const overdue = Number(row.isOverdue) === 1
    const checkoutDate = new Date(row.checkoutDate)
    const endDate = row.returnDate ? new Date(row.returnDate) : new Date()
    const borrowDays =
      Number.isNaN(checkoutDate.getTime()) || Number.isNaN(endDate.getTime())
        ? 0
        : Math.max(
            1,
            Math.round(
              (endDate.getTime() - checkoutDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )

    totalBorrowDays += borrowDays
    byTypeMap.set(itemType, (byTypeMap.get(itemType) || 0) + 1)
    byTitleMap.set(itemTitle, (byTitleMap.get(itemTitle) || 0) + 1)

    if (!overdueByTypeMap.has(itemType)) {
      overdueByTypeMap.set(itemType, { overdue: 0, onTime: 0 })
    }
    const bucket = overdueByTypeMap.get(itemType)
    if (overdue) bucket.overdue += 1
    else bucket.onTime += 1

    trendMap.set(day, (trendMap.get(day) || 0) + 1)
  })

  const byType = Array.from(byTypeMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const overdueByType = Array.from(overdueByTypeMap.entries())
    .map(([label, values]) => ({
      label,
      overdue: values.overdue,
      onTime: values.onTime,
    }))
    .sort((a, b) => b.overdue + b.onTime - (a.overdue + a.onTime))

  const topItems = Array.from(byTitleMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  const trend = Array.from(trendMap.entries())
    .map(([dayKey, value]) => ({ dayKey, value }))
    .sort((a, b) => new Date(a.dayKey) - new Date(b.dayKey))

  const overdueCount = rows.filter((row) => Number(row.isOverdue) === 1).length
  const activeCount = rows.filter((row) => !row.returnDate).length

  return {
    byType,
    overdueByType,
    topItems,
    trend,
    metrics: {
      activeCount,
      overdueRate: rows.length ? (overdueCount / rows.length) * 100 : 0,
      avgBorrowDays: rows.length ? totalBorrowDays / rows.length : 0,
    },
  }
}

function buildRevenueInsights(rows) {
  const fineByUserTypeMap = new Map()
  const valueByUserTypeMap = new Map()
  const fineByBorrowerMap = new Map()
  const paidSplit = { paid: 0, unpaid: 0 }
  let totalFineOwed = 0
  let totalItemValue = 0

  rows.forEach((row) => {
    const userType = formatUserTypeForDisplay(row.userType)
    const borrower = row.borrowerName || row.borrowerId || "Unknown"
    const fineOwed = Number(row.fineOwed || 0)
    const itemValue = Number(row.itemValue || 0)
    const isPaid = Number(row.isPaidOff) === 1

    totalFineOwed += fineOwed
    totalItemValue += itemValue

    fineByUserTypeMap.set(
      userType,
      (fineByUserTypeMap.get(userType) || 0) + fineOwed
    )
    valueByUserTypeMap.set(
      userType,
      (valueByUserTypeMap.get(userType) || 0) + itemValue
    )
    fineByBorrowerMap.set(
      borrower,
      (fineByBorrowerMap.get(borrower) || 0) + fineOwed
    )

    if (isPaid) paidSplit.paid += 1
    else paidSplit.unpaid += 1
  })

  const fineByUserType = Array.from(fineByUserTypeMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const valueByUserType = Array.from(valueByUserTypeMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const fineByBorrower = Array.from(fineByBorrowerMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  const composition = [
    { label: "Fines owed", value: totalFineOwed },
    { label: "Item value", value: totalItemValue },
  ]

  const paymentStatus = [
    { label: "Paid off", value: paidSplit.paid },
    { label: "Unpaid", value: paidSplit.unpaid },
  ]

  return {
    fineByUserType,
    valueByUserType,
    fineByBorrower,
    composition,
    paymentStatus,
    metrics: {
      totalFineOwed,
      totalItemValue,
      paidOffRatio: rows.length ? (paidSplit.paid / rows.length) * 100 : 0,
    },
  }
}

function buildInventoryInsights(rows) {
  const unitsByType = new Map()
  const valueByType = new Map()
  const activeByType = new Map()

  rows.forEach((row) => {
    const itemType = formatItemTypeForDisplay(row.itemType)
    const units = Number(row.inventory || 0)
    const value = Number(row.catalogValue || 0)
    const active = Number(row.activeBorrows || 0)

    unitsByType.set(itemType, (unitsByType.get(itemType) || 0) + units)
    valueByType.set(itemType, (valueByType.get(itemType) || 0) + value)
    activeByType.set(itemType, (activeByType.get(itemType) || 0) + active)
  })

  const inventoryByType = Array.from(unitsByType.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const valueByTypeRows = Array.from(valueByType.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const activeByTypeRows = Array.from(activeByType.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const topByValue = [...rows]
    .map((row) => ({
      label: row.itemName || "Unknown",
      value: Number(row.catalogValue || 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  return {
    inventoryByType,
    valueByTypeRows,
    activeByTypeRows,
    topByValue,
  }
}

function buildHoldsInsights(rows) {
  const statusMap = new Map()
  const byItemMap = new Map()
  const waitByTypeMap = new Map()
  const reasonMap = new Map()
  let totalWaitHours = 0

  rows.forEach((row) => {
    const status = String(row.holdStatus || "ACTIVE")
    const itemName = row.itemName || "Unknown"
    const itemType = formatItemTypeForDisplay(row.itemType)
    const reason = row.closeReason || "ACTIVE"
    const waitHours = Number(row.waitHours || 0)

    totalWaitHours += waitHours
    statusMap.set(status, (statusMap.get(status) || 0) + 1)
    byItemMap.set(itemName, (byItemMap.get(itemName) || 0) + 1)
    reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1)

    if (!waitByTypeMap.has(itemType)) {
      waitByTypeMap.set(itemType, { totalHours: 0, count: 0 })
    }
    const bucket = waitByTypeMap.get(itemType)
    bucket.totalHours += waitHours
    bucket.count += 1
  })

  const statusBreakdown = Array.from(statusMap.entries()).map(
    ([label, value]) => ({
      label,
      value,
    })
  )

  const topRequestedItems = Array.from(byItemMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  const averageWaitByType = Array.from(waitByTypeMap.entries())
    .map(([label, entry]) => ({
      label,
      value: entry.count ? entry.totalHours / entry.count : 0,
      requestCount: entry.count,
    }))
    .sort((a, b) => b.value - a.value)

  const closeReasons = Array.from(reasonMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const active = rows.filter(
    (row) => String(row.holdStatus) === "ACTIVE"
  ).length
  const fulfilled = rows.filter(
    (row) => String(row.holdStatus) === "FULFILLED"
  ).length
  const canceled = rows.filter(
    (row) => String(row.holdStatus) === "CANCELED"
  ).length

  return {
    statusBreakdown,
    topRequestedItems,
    averageWaitByType,
    closeReasons,
    metrics: {
      active,
      fulfilled,
      canceled,
      avgWaitHours: rows.length ? totalWaitHours / rows.length : 0,
      fulfillmentRate: rows.length ? (fulfilled / rows.length) * 100 : 0,
    },
  }
}

export default function ReportsPage() {
  const [itemTypes] = useState([
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
  const [reportCache, setReportCache] = useState({})
  const [rawPage, setRawPage] = useState(1)

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
      setReportCache((prev) => ({
        ...prev,
        [filters.reportType]: {
          filters,
          rows,
          summary,
          hasGenerated,
          page,
          pageSize,
          error,
        },
      }))

      const cached = reportCache[value]
      if (cached) {
        setFilters(cached.filters)
        setRows(cached.rows)
        setSummary(cached.summary)
        setHasGenerated(cached.hasGenerated)
        setPage(cached.page)
        setPageSize(cached.pageSize)
        setRawPage(1)
        setError(cached.error || "")
        return
      }

      setHasGenerated(false)
      setRows([])
      setSummary(null)
      setError("")
      setPage(1)
      setRawPage(1)
    }

    setFilters((prev) => {
      if (name === "itemType" && value !== "" && value !== "BOOK") {
        return { ...prev, itemType: value, genre: [] }
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
      const authUser = JSON.parse(sessionStorage.getItem("authUser") || "{}")
      const user = JSON.parse(sessionStorage.getItem("user") || "{}")
      const candidateId = Number(authUser?.id || user?.id || 0)
      const accountType = String(
        authUser?.accountType || user?.accountType || ""
      )
        .trim()
        .toLowerCase()
      const role = String(authUser?.role || user?.role || "")
        .trim()
        .toLowerCase()
      const roleGroup = String(authUser?.roleGroup || user?.roleGroup || "")
        .trim()
        .toLowerCase()
      const isStaffSession =
        accountType === "staff" ||
        role === "staff" ||
        role === "admin" ||
        roleGroup === "adminstaff"
      const staffId =
        isStaffSession && Number.isFinite(candidateId) && candidateId > 0
          ? String(candidateId)
          : ""

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
        staffId,
      })

      const response = await fetch(`${API_BASE_URL}/api/reports?${params}`)
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.message || "Failed to generate report.")
        setRows([])
        setSummary(null)
        return
      }

      const nextRows = Array.isArray(data.rows) ? data.rows : []
      const nextSummary = data.summary || null
      setRows(nextRows)
      setSummary(nextSummary)
      setRawPage(1)
      setReportCache((prev) => ({
        ...prev,
        [filters.reportType]: {
          filters: { ...filters },
          rows: nextRows,
          summary: nextSummary,
          hasGenerated: true,
          page: nextPage,
          pageSize,
          error: "",
        },
      }))
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
    setRawPage(1)
    setGenreQuery("")
    setIsGenreOpen(false)
  }

  const supportsGenreForItemType =
    filters.itemType === "" || filters.itemType === "BOOK"
  const filteredGenres = genres.filter((genre) =>
    genre.toLowerCase().includes(genreQuery.trim().toLowerCase())
  )

  const borrowedInsights = useMemo(() => buildBorrowedInsights(rows), [rows])
  const revenueInsights = useMemo(() => buildRevenueInsights(rows), [rows])
  const holdsInsights = useMemo(() => buildHoldsInsights(rows), [rows])
  const inventoryInsights = useMemo(() => buildInventoryInsights(rows), [rows])

  const isBorrowedReport = filters.reportType === "itemsCheckedOut"
  const isRevenueReport = filters.reportType === "revenue"
  const isHoldsReport = filters.reportType === "holds"
  const isInventoryReport = filters.reportType === "inventory"

  const rawPageSize = 12
  const rawTotalPages = Math.max(1, Math.ceil(rows.length / rawPageSize))
  const rawStartIndex = (rawPage - 1) * rawPageSize
  const rawRows = rows.slice(rawStartIndex, rawStartIndex + rawPageSize)

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
                  className="h-9 w-full rounded-md border border-input bg-card px-2.5 py-1 text-sm text-foreground"
                >
                  <option value="itemsCheckedOut">Borrowed items</option>
                  <option value="revenue">Revenue</option>
                  <option value="holds">Holds and waitlist demand</option>
                  <option value="inventory">Inventory</option>
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
                  className="h-9 w-full rounded-md border border-input bg-card px-2.5 py-1 text-sm text-foreground"
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
                  className="h-9 w-full rounded-md border border-input bg-card px-2.5 py-1 text-sm text-foreground"
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
                {isHoldsReport || isInventoryReport ? (
                  <Input
                    value="Not applicable for this report"
                    disabled
                    className="h-9"
                  />
                ) : (
                  <select
                    id="overdue"
                    name="overdue"
                    value={filters.overdue}
                    onChange={onChange}
                    className="h-9 w-full rounded-md border border-input bg-card px-2.5 py-1 text-sm text-foreground"
                  >
                    <option value="all">All</option>
                    <option value="overdue">Overdue only</option>
                    <option value="notOverdue">Not overdue</option>
                  </select>
                )}
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
            <CardContent className="space-y-6">
              {isBorrowedReport && (
                <>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      label="Active checkouts"
                      value={borrowedInsights.metrics.activeCount}
                    />
                    <MetricCard
                      label="Overdue rate"
                      value={formatPercent(
                        borrowedInsights.metrics.overdueRate
                      )}
                    />
                    <MetricCard
                      label="Utilization (checked out items / total items)"
                      value={formatPercent(
                        summary?.itemsInLibrary
                          ? ((summary?.itemsCheckedOut || 0) /
                              summary.itemsInLibrary) *
                              100
                          : 0
                      )}
                    />
                    <MetricCard
                      label="Average borrow days"
                      value={borrowedInsights.metrics.avgBorrowDays.toFixed(1)}
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <ChartBlock
                      title="Checkout volume by item type"
                      formula="How many times each type is checked out in the selected period."
                      chart={
                        <HorizontalBarChart data={borrowedInsights.byType} />
                      }
                      columns={[
                        { key: "label", label: "Item type" },
                        { key: "value", label: "Checkouts" },
                      ]}
                      rows={borrowedInsights.byType}
                    />

                    <ChartBlock
                      title="Overdue status by item type"
                      formula="For each type, compare overdue checkouts against on-time checkouts."
                      chart={
                        <StackedBarChart
                          data={borrowedInsights.overdueByType}
                          segments={[
                            { key: "overdue", label: "Overdue" },
                            { key: "onTime", label: "On time" },
                          ]}
                        />
                      }
                      columns={[
                        { key: "label", label: "Item type" },
                        { key: "overdue", label: "Overdue" },
                        { key: "onTime", label: "On time" },
                      ]}
                      rows={borrowedInsights.overdueByType}
                    />

                    <ChartBlock
                      title="Top borrowed items"
                      formula="Most borrowed individual items in the selected period."
                      chart={
                        <HorizontalBarChart data={borrowedInsights.topItems} />
                      }
                      columns={[
                        { key: "label", label: "Item" },
                        { key: "value", label: "Checkouts" },
                      ]}
                      rows={borrowedInsights.topItems}
                    />

                    <ChartBlock
                      title="Checkout activity calendar"
                      formula="Daily checkout counts shown directly on each day."
                      chart={
                        <CheckoutCalendarChart data={borrowedInsights.trend} />
                      }
                      columns={[
                        {
                          key: "dayKey",
                          label: "Date",
                          render: (v) => displayDayKey(v),
                        },
                        { key: "value", label: "Checkouts" },
                      ]}
                      rows={borrowedInsights.trend}
                    />
                  </div>
                </>
              )}

              {isRevenueReport && (
                <>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <MetricCard
                      label="Outstanding fines"
                      value={formatCurrency(
                        revenueInsights.metrics.totalFineOwed
                      )}
                    />
                    {/* <MetricCard
                      label="Item value exposure"
                      value={formatCurrency(
                        revenueInsights.metrics.totalItemValue
                      )}
                      helper="Value of currently associated items"
                    /> */}
                    <MetricCard
                      label="Paid-off ratio"
                      value={formatPercent(
                        revenueInsights.metrics.paidOffRatio
                      )}
                    />
                    <MetricCard
                      label="Average fine per record"
                      value={formatCurrency(
                        rows.length
                          ? revenueInsights.metrics.totalFineOwed / rows.length
                          : 0
                      )}
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <ChartBlock
                      title="Fines vs item value"
                      formula="Keep fines and item value separate for clear interpretation."
                      chart={
                        <HorizontalBarChart
                          data={revenueInsights.composition}
                          valueFormatter={formatCurrency}
                        />
                      }
                      columns={[
                        { key: "label", label: "Component" },
                        {
                          key: "value",
                          label: "Amount",
                          render: (v) => formatCurrency(v),
                        },
                      ]}
                      rows={revenueInsights.composition}
                    />

                    <ChartBlock
                      title="Outstanding fines by user type"
                      formula="How much unpaid fine balance each user group currently carries."
                      chart={
                        <HorizontalBarChart
                          data={revenueInsights.fineByUserType}
                          valueFormatter={formatCurrency}
                        />
                      }
                      columns={[
                        { key: "label", label: "User type" },
                        {
                          key: "value",
                          label: "Fines",
                          render: (v) => formatCurrency(v),
                        },
                      ]}
                      rows={revenueInsights.fineByUserType}
                    />

                    <ChartBlock
                      title="Item value by user type"
                      formula="Catalog value grouped by who currently has the items."
                      chart={
                        <HorizontalBarChart
                          data={revenueInsights.valueByUserType}
                          valueFormatter={formatCurrency}
                        />
                      }
                      columns={[
                        { key: "label", label: "User type" },
                        {
                          key: "value",
                          label: "Item value",
                          render: (v) => formatCurrency(v),
                        },
                      ]}
                      rows={revenueInsights.valueByUserType}
                    />

                    <ChartBlock
                      title="Top borrowers by fines owed"
                      formula="Borrowers with the highest outstanding fines."
                      chart={
                        <HorizontalBarChart
                          data={revenueInsights.fineByBorrower}
                          valueFormatter={formatCurrency}
                        />
                      }
                      columns={[
                        { key: "label", label: "Borrower" },
                        {
                          key: "value",
                          label: "Fines",
                          render: (v) => formatCurrency(v),
                        },
                      ]}
                      rows={revenueInsights.fineByBorrower}
                    />
                  </div>
                </>
              )}

              {isInventoryReport && (
                <>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      label="Total value of catalog"
                      value={formatCurrency(summary?.totalCatalogValue || 0)}
                    />
                    <MetricCard
                      value={Number(summary?.totalInventoryUnits || 0)}
                      label="Number of items in catalog"
                    />
                    <MetricCard
                      label="Number of currently checked out items"
                      value={Number(summary?.totalActiveBorrows || 0)}
                    />
                    <MetricCard
                      label="Currently overdue checkouts"
                      value={Number(summary?.totalOverdueActiveBorrows || 0)}
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <ChartBlock
                      title="Units by item type"
                      formula="How many units exist in each item category."
                      chart={
                        <HorizontalBarChart
                          data={inventoryInsights.inventoryByType}
                        />
                      }
                      columns={[
                        { key: "label", label: "Item type" },
                        { key: "value", label: "Units" },
                      ]}
                      rows={inventoryInsights.inventoryByType}
                    />

                    <ChartBlock
                      title="Catalog value by item type"
                      formula="Total monetary value for each item category."
                      chart={
                        <HorizontalBarChart
                          data={inventoryInsights.valueByTypeRows}
                          valueFormatter={formatCurrency}
                        />
                      }
                      columns={[
                        { key: "label", label: "Item type" },
                        {
                          key: "value",
                          label: "Catalog value",
                          render: (v) => formatCurrency(v),
                        },
                      ]}
                      rows={inventoryInsights.valueByTypeRows}
                    />

                    <ChartBlock
                      title="Top items by catalog value"
                      formula="Most valuable individual items in the visible set."
                      chart={
                        <HorizontalBarChart
                          data={inventoryInsights.topByValue}
                          valueFormatter={formatCurrency}
                        />
                      }
                      columns={[
                        { key: "label", label: "Item" },
                        {
                          key: "value",
                          label: "Catalog value",
                          render: (v) => formatCurrency(v),
                        },
                      ]}
                      rows={inventoryInsights.topByValue}
                    />

                    <ChartBlock
                      title="Active checkouts by item type"
                      formula="How currently checked out units are distributed by type."
                      chart={
                        <HorizontalBarChart
                          data={inventoryInsights.activeByTypeRows}
                        />
                      }
                      columns={[
                        { key: "label", label: "Item type" },
                        { key: "value", label: "Active checkouts" },
                      ]}
                      rows={inventoryInsights.activeByTypeRows}
                    />
                  </div>
                </>
              )}

              {isHoldsReport && (
                <>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                    <MetricCard
                      label="Active holds"
                      value={holdsInsights.metrics.active}
                    />
                    <MetricCard
                      label="Fulfilled holds"
                      value={holdsInsights.metrics.fulfilled}
                    />
                    <MetricCard
                      label="Canceled holds"
                      value={holdsInsights.metrics.canceled}
                    />
                    <MetricCard
                      label="Average wait hours"
                      value={holdsInsights.metrics.avgWaitHours.toFixed(1)}
                    />
                    <MetricCard
                      label="Fulfillment rate"
                      value={formatPercent(
                        holdsInsights.metrics.fulfillmentRate
                      )}
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <ChartBlock
                      title="Hold status distribution"
                      formula="How hold requests are currently split by status."
                      chart={
                        <HorizontalBarChart
                          data={holdsInsights.statusBreakdown}
                        />
                      }
                      columns={[
                        { key: "label", label: "Status" },
                        { key: "value", label: "Count" },
                      ]}
                      rows={holdsInsights.statusBreakdown}
                    />

                    <ChartBlock
                      title="Most requested items"
                      formula="Items with the highest request volume."
                      chart={
                        <HorizontalBarChart
                          data={holdsInsights.topRequestedItems}
                        />
                      }
                      columns={[
                        { key: "label", label: "Item" },
                        { key: "value", label: "Hold requests" },
                      ]}
                      rows={holdsInsights.topRequestedItems}
                    />

                    <ChartBlock
                      title="Average wait time by item type"
                      formula="Average waiting time before a hold is closed."
                      chart={
                        <HorizontalBarChart
                          data={holdsInsights.averageWaitByType}
                          valueFormatter={(v) => `${Number(v).toFixed(1)}h`}
                        />
                      }
                      columns={[
                        { key: "label", label: "Item type" },
                        {
                          key: "value",
                          label: "Avg wait (hours)",
                          render: (v) => `${Number(v || 0).toFixed(1)}`,
                        },
                        { key: "requestCount", label: "Requests" },
                      ]}
                      rows={holdsInsights.averageWaitByType}
                    />

                    <ChartBlock
                      title="Closing reasons"
                      formula="Why hold requests are being closed."
                      chart={
                        <HorizontalBarChart data={holdsInsights.closeReasons} />
                      }
                      columns={[
                        { key: "label", label: "Reason" },
                        { key: "value", label: "Count" },
                      ]}
                      rows={holdsInsights.closeReasons}
                    />
                  </div>
                </>
              )}

              <div>
                <p className="mb-2 text-sm font-medium">Full report data</p>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left">
                      {isBorrowedReport ? (
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2">Item type</th>
                          <th className="px-3 py-2">User type</th>
                          <th className="px-3 py-2">Borrower</th>
                          <th className="px-3 py-2">Genre</th>
                          <th className="px-3 py-2">Checkout</th>
                          <th className="px-3 py-2">Due</th>
                          <th className="px-3 py-2">Return</th>
                          <th className="px-3 py-2">Overdue</th>
                        </tr>
                      ) : isRevenueReport ? (
                        <tr>
                          <th className="px-3 py-2">Borrow date</th>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2">Item type</th>
                          <th className="px-3 py-2">User type</th>
                          <th className="px-3 py-2">Borrower</th>
                          <th className="px-3 py-2">Fine owed</th>
                          <th className="px-3 py-2">Item value</th>
                          <th className="px-3 py-2">Paid off</th>
                          <th className="px-3 py-2">Source</th>
                        </tr>
                      ) : isInventoryReport ? (
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2">Item type</th>
                          <th className="px-3 py-2">Units</th>
                          <th className="px-3 py-2">Unit value</th>
                          <th className="px-3 py-2">Catalog value</th>
                          <th className="px-3 py-2">Total checkouts</th>
                          <th className="px-3 py-2">Active checkouts</th>
                          <th className="px-3 py-2">Active overdue</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="px-3 py-2">Requested</th>
                          <th className="px-3 py-2">Closed</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Reason</th>
                          <th className="px-3 py-2">Wait hours</th>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2">Item type</th>
                          <th className="px-3 py-2">User</th>
                          <th className="px-3 py-2">User type</th>
                          <th className="px-3 py-2">Genres</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td
                            className="px-3 py-4 text-muted-foreground"
                            colSpan={
                              isBorrowedReport
                                ? 9
                                : isRevenueReport
                                  ? 9
                                  : isInventoryReport
                                    ? 8
                                    : 10
                            }
                          >
                            No report data.
                          </td>
                        </tr>
                      ) : isBorrowedReport ? (
                        rawRows.map((row) => (
                          <tr
                            key={row.borrowTransactionId}
                            className="border-t"
                          >
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
                              {formatDate(row.returnDate)}
                            </td>
                            <td className="px-3 py-2">
                              {Number(row.isOverdue) === 1 ? "Yes" : "No"}
                            </td>
                          </tr>
                        ))
                      ) : isRevenueReport ? (
                        rawRows.map((row) => (
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
                            <td className="px-3 py-2">
                              {formatCurrency(row.fineOwed)}
                            </td>
                            <td className="px-3 py-2">
                              {formatCurrency(row.itemValue)}
                            </td>
                            <td className="px-3 py-2">
                              {row.revenueSource === "Item value"
                                ? "--"
                                : Number(row.isPaidOff) === 1
                                  ? "Yes"
                                  : "No"}
                            </td>
                            <td className="px-3 py-2">
                              {row.revenueSource || "-"}
                            </td>
                          </tr>
                        ))
                      ) : isInventoryReport ? (
                        rawRows.map((row) => (
                          <tr key={row.itemId} className="border-t">
                            <td className="px-3 py-2">{row.itemName || "-"}</td>
                            <td className="px-3 py-2">
                              {formatItemTypeForDisplay(row.itemType)}
                            </td>
                            <td className="px-3 py-2">
                              {Number(row.inventory || 0)}
                            </td>
                            <td className="px-3 py-2">
                              {formatCurrency(row.itemValue)}
                            </td>
                            <td className="px-3 py-2">
                              {formatCurrency(row.catalogValue)}
                            </td>
                            <td className="px-3 py-2">
                              {Number(row.totalBorrows || 0)}
                            </td>
                            <td className="px-3 py-2">
                              {Number(row.activeBorrows || 0)}
                            </td>
                            <td className="px-3 py-2">
                              {Number(row.overdueActiveBorrows || 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        rawRows.map((row) => (
                          <tr key={row.holdId} className="border-t">
                            <td className="px-3 py-2">
                              {formatDateTime(row.requestDateTime)}
                            </td>
                            <td className="px-3 py-2">
                              {formatDateTime(row.closeDateTime)}
                            </td>
                            <td className="px-3 py-2">
                              {row.holdStatus || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {row.closeReason || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {Number(row.waitHours || 0)}
                            </td>
                            <td className="px-3 py-2">{row.itemName || "-"}</td>
                            <td className="px-3 py-2">
                              {formatItemTypeForDisplay(row.itemType)}
                            </td>
                            <td className="px-3 py-2">
                              {row.userName ||
                                row.userEmail ||
                                row.userId ||
                                "-"}
                            </td>
                            <td className="px-3 py-2">
                              {formatUserTypeForDisplay(row.userType)}
                            </td>
                            <td className="px-3 py-2">{row.genres || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {rows.length > rawPageSize ? (
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Showing {rawStartIndex + 1}-
                      {Math.min(rawStartIndex + rawPageSize, rows.length)} of{" "}
                      {rows.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setRawPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={rawPage <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setRawPage((prev) =>
                            Math.min(rawTotalPages, prev + 1)
                          )
                        }
                        disabled={rawPage >= rawTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
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
                    disabled={(summary?.page ?? page) <= 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage((summary?.page ?? page) + 1)}
                    disabled={!summary?.hasMore || isLoading}
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
