import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
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
    genre: "",
    overdue: "all",
  })
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Genre lookup endpoint was removed in the new backend. Keep empty for now.
    setGenres([])
  }, [])

  function onChange(event) {
    const { name, value } = event.target
    setFilters((prev) => {
      if (name === "itemType") {
        if (value !== "" && value !== "BOOK") {
          return { ...prev, itemType: value, genre: "NOT_APPLICABLE" }
        }
        if (prev.genre === "NOT_APPLICABLE") {
          return { ...prev, itemType: value, genre: "" }
        }
      }
      return { ...prev, [name]: value }
    })
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user?.id) {
        setError("Please sign in to generate reports.")
        setRows([])
        setSummary(null)
        return
      }

      const response = await fetch(
        `${API_BASE_URL}/api/dashboard?userId=${user.id}`
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.message || "Failed to generate report.")
        setRows([])
        setSummary(null)
        return
      }

      if (filters.reportType === "itemsCheckedOut") {
        let checkedOutRows = (data.borrowedBooks || []).map((row) => ({
          borrowTransactionId: row.id,
          itemName: row.title,
          itemType: filters.itemType || "-",
          userType: user.role?.toUpperCase() || "USER",
          borrowerName: user.email || "-",
          checkoutDate: null,
          dueDate: row.dueDate,
          isOverdue: row.status === "overdue" ? 1 : 0,
        }))

        if (filters.overdue === "overdue") {
          checkedOutRows = checkedOutRows.filter(
            (row) => Number(row.isOverdue) === 1
          )
        }

        if (filters.overdue === "notOverdue") {
          checkedOutRows = checkedOutRows.filter(
            (row) => Number(row.isOverdue) === 0
          )
        }

        setRows(checkedOutRows)
        setSummary({
          totalRecords: checkedOutRows.length,
          overdueCount: checkedOutRows.filter(
            (row) => Number(row.isOverdue) === 1
          ).length,
        })
      } else {
        const fineRows = (data.fines || []).map((row) => ({
          fineId: row.id,
          itemName: row.book,
          userType: user.role?.toUpperCase() || "USER",
          borrowerName: user.email || "-",
          amount: Number(row.amount || 0),
          fineReason: "Overdue item",
          dateAssigned: null,
          isOverdue: Number(row.daysOverdue || 0) > 0 ? 1 : 0,
        }))

        setRows(fineRows)
        setSummary({
          totalRecords: fineRows.length,
          totalAmount: fineRows.reduce(
            (sum, row) => sum + Number(row.amount || 0),
            0
          ),
        })
      }
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

  const isBookOrAll = filters.itemType === "" || filters.itemType === "BOOK"

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
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="startDate">From date</FieldLabel>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={onChange}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="endDate">To date</FieldLabel>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={onChange}
                />
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
                      {type.itemType}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="genre">Genre</FieldLabel>
                <select
                  id="genre"
                  name="genre"
                  value={filters.genre}
                  onChange={onChange}
                  disabled={!isBookOrAll}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                >
                  {!isBookOrAll ? (
                    <option value="NOT_APPLICABLE">Not applicable</option>
                  ) : (
                    <>
                      <option value="">All</option>
                      {genres.map((genre) => (
                        <option key={genre.genreId} value={genre.genreId}>
                          {genre.genreName}
                        </option>
                      ))}
                    </>
                  )}
                </select>
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
                          filters.reportType === "itemsCheckedOut" ? 7 : 8
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
