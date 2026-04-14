import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { API_BASE_URL } from "@/lib/api-config"

const PAGE_SIZE = 25

function getAuthHeaders(actorId, actorRole) {
  return {
    "x-actor-id": String(actorId || ""),
    "x-actor-role": String(actorRole || ""),
  }
}

function getDisplayName(user) {
  return [user.first_name, user.middle_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
}

export default function MarkFacultyPage() {
  const authUser = JSON.parse(sessionStorage.getItem("authUser") || "{}")
  const actorId = String(authUser?.id || "")
  const actorRole = String(authUser?.role || "")
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  })
  const [selectedIds, setSelectedIds] = useState([])
  const [pendingOperation, setPendingOperation] = useState(null)
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true)
      setError("")
      try {
        const params = new URLSearchParams()
        if (query.trim()) params.set("q", query.trim())
        params.set("page", String(page))
        params.set("pageSize", String(PAGE_SIZE))

        const response = await fetch(`${API_BASE_URL}/api/users?${params}`, {
          headers: getAuthHeaders(actorId, actorRole),
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          setError(data.message || "Failed to load users.")
          setUsers([])
          return
        }

        setUsers(Array.isArray(data.users) ? data.users : [])
        setPagination(
          data.pagination || {
            page,
            pageSize: PAGE_SIZE,
            total: 0,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          }
        )
      } catch {
        setError("Unable to connect to server.")
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [query, page, actorId, actorRole])

  const filteredUsers = useMemo(() => {
    return users
  }, [users])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const allPageSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((user) => selectedSet.has(Number(user.user_id)))

  function toggleUserSelection(userId, checked) {
    const id = Number(userId)
    setSelectedIds((prev) => {
      const set = new Set(prev)
      if (checked) set.add(id)
      else set.delete(id)
      return [...set]
    })
  }

  function toggleSelectPage(checked) {
    const pageIds = filteredUsers.map((user) => Number(user.user_id))
    setSelectedIds((prev) => {
      const set = new Set(prev)
      if (checked) {
        pageIds.forEach((id) => set.add(id))
      } else {
        pageIds.forEach((id) => set.delete(id))
      }
      return [...set]
    })
  }

  async function onConfirmChanges() {
    if (!pendingOperation || !selectedIds.length) return

    setError("")
    setSuccess("")
    setIsSubmittingBulk(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/faculty/bulk`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(actorId, actorRole),
        },
        body: JSON.stringify({
          userIds: selectedIds,
          isFaculty: pendingOperation === "mark",
          reason: reason.trim(),
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.message || "Failed to apply changes.")
        return
      }

      const updatedSet = new Set(
        (data.updatedUsers || []).map((user) => Number(user.user_id))
      )
      const nextIsFaculty = pendingOperation === "mark" ? 1 : 0

      setUsers((prev) =>
        prev.map((user) =>
          updatedSet.has(Number(user.user_id))
            ? { ...user, is_faculty: nextIsFaculty }
            : user
        )
      )
      setSuccess(
        `${data.updatedCount || 0} user(s) updated. ${data.skippedCount || 0} skipped.`
      )
      setPendingOperation(null)
      setReason("")
      setSelectedIds([])
    } catch {
      setError("Unable to connect to server.")
    } finally {
      setIsSubmittingBulk(false)
    }
  }

  if (authUser.role !== "admin" && authUser.role !== "staff") {
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
                Only staff members can access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
            <CardTitle>Mark user as faculty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                setQuery(searchInput)
                setPage(1)
                setSelectedIds([])
                setPendingOperation(null)
              }}
            >
              <Input
                placeholder="Search by name or email"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <Button type="submit" variant="secondary">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                disabled={!selectedIds.length || isSubmittingBulk}
                onClick={() => {
                  setPendingOperation("mark")
                  setError("")
                }}
              >
                Mark selected as faculty
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!selectedIds.length || isSubmittingBulk}
                onClick={() => {
                  setPendingOperation("undo")
                  setError("")
                }}
              >
                Undo faculty for selected
              </Button>
              <p className="text-sm text-muted-foreground">
                {selectedIds.length} selected on current result set
              </p>
            </div>

            {pendingOperation ? (
              <div className="space-y-3 rounded-md border border-amber-400/50 bg-amber-50/50 p-4 dark:border-amber-700/50 dark:bg-amber-950/30">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Review changes: you are about to{" "}
                  {pendingOperation === "mark" ? "mark" : "undo"} faculty status
                  for {selectedIds.length} user(s).
                </p>
                <Input
                  placeholder="Reason (optional, stored in audit trail)"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={isSubmittingBulk || !selectedIds.length}
                    onClick={onConfirmChanges}
                  >
                    Confirm changes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSubmittingBulk}
                    onClick={() => setPendingOperation(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? (
              <p className="text-sm text-green-600">{success}</p>
            ) : null}

            <div className="rounded-md border">
              <div className="grid grid-cols-[auto_2fr_2fr_1fr] gap-3 border-b bg-muted/40 p-3 text-sm font-medium">
                <div className="flex items-center">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={(checked) =>
                      toggleSelectPage(Boolean(checked))
                    }
                    aria-label="Select all users on this page"
                  />
                </div>
                <p>Name</p>
                <p>Email</p>
                <p>Status</p>
              </div>

              {isLoading ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Loading users...
                </p>
              ) : filteredUsers.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  No users found for this search.
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const isFaculty = Boolean(user.is_faculty)
                  const isChecked = selectedSet.has(Number(user.user_id))

                  return (
                    <div
                      key={user.user_id}
                      className="grid grid-cols-[auto_2fr_2fr_1fr] gap-3 border-b p-3 text-sm last:border-b-0"
                    >
                      <div className="flex items-center">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            toggleUserSelection(user.user_id, Boolean(checked))
                          }
                          aria-label={`Select user ${user.email}`}
                        />
                      </div>
                      <p className="truncate" title={getDisplayName(user)}>
                        {getDisplayName(user) || "Unknown user"}
                      </p>
                      <p className="truncate" title={user.email || ""}>
                        {user.email}
                      </p>
                      <div>
                        {isFaculty ? (
                          <Badge>Faculty</Badge>
                        ) : (
                          <Badge variant="secondary">Student</Badge>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} (
                {pagination.total} total users)
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPreviousPage || isLoading}
                  onClick={() => {
                    setPage((prev) => Math.max(prev - 1, 1))
                    setSelectedIds([])
                    setPendingOperation(null)
                  }}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage || isLoading}
                  onClick={() => {
                    setPage((prev) => prev + 1)
                    setSelectedIds([])
                    setPendingOperation(null)
                  }}
                >
                  Next
                </Button>
              </div>
            </div>

            {isSubmittingBulk ? (
              <p className="text-sm text-muted-foreground">
                Applying changes...
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
