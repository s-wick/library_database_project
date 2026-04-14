import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, GraduationCap, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/api-config"

function getDisplayName(user) {
  return [user.first_name, user.middle_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
}

export default function MarkFacultyPage() {
  const authUser = JSON.parse(sessionStorage.getItem("authUser") || "{}")
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingId, setIsSubmittingId] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true)
      setError("")
      try {
        const params = new URLSearchParams()
        if (query.trim()) params.set("q", query.trim())

        const response = await fetch(`${API_BASE_URL}/api/users?${params}`)
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          setError(data.message || "Failed to load users.")
          setUsers([])
          return
        }

        setUsers(Array.isArray(data.users) ? data.users : [])
      } catch {
        setError("Unable to connect to server.")
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [query])

  const filteredUsers = useMemo(() => {
    return users
  }, [users])

  async function onMarkFaculty(userId) {
    setError("")
    setSuccess("")
    setIsSubmittingId(String(userId))

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/${userId}/faculty`,
        {
          method: "PUT",
        }
      )
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.message || "Failed to mark user as faculty.")
        return
      }

      setUsers((prev) =>
        prev.map((user) =>
          Number(user.user_id) === Number(userId)
            ? { ...user, is_faculty: 1 }
            : user
        )
      )
      setSuccess("User marked as faculty.")
    } catch {
      setError("Unable to connect to server.")
    } finally {
      setIsSubmittingId("")
    }
  }

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

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? (
              <p className="text-sm text-green-600">{success}</p>
            ) : null}

            <div className="rounded-md border">
              <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-3 border-b bg-muted/40 p-3 text-sm font-medium">
                <p>Name</p>
                <p>Email</p>
                <p>Status</p>
                <p>Action</p>
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
                  const isSaving = isSubmittingId === String(user.user_id)

                  return (
                    <div
                      key={user.user_id}
                      className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-3 border-b p-3 text-sm last:border-b-0"
                    >
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
                      <div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isFaculty || isSaving}
                          onClick={() => onMarkFaculty(user.user_id)}
                        >
                          <GraduationCap className="mr-2 h-4 w-4" />
                          {isSaving ? "Updating..." : "Mark faculty"}
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
