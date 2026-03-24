import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  BookOpen,
  Clock,
  AlertCircle,
  CreditCard,
  Calendar,
  ChevronRight,
  Bell,
  User,
  LogOut,
  Sun,
  Moon,
  Home,
  CheckCircle2,
  XCircle,
  BookMarked,
  RotateCcw,
  DollarSign,
  ArrowUpRight,
  Loader,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

// API Base URL - Vite-safe env lookup with fallback for non-Vite contexts
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "http://localhost:4000/api"

// Temporary testing override: force dashboard to load a faculty user.
const FORCE_TEST_FACULTY_SESSION = true
const TEST_FACULTY_USER_ID = "2001"
const TEST_FACULTY_USER_TYPE_CODE = 2

const FETCH_TIMEOUT_MS = 10000  // 10 second timeout

// Helper Functions (defined before main component)
function fetchWithTimeout(url, options = {}) {
  const timeout = options.timeout || FETCH_TIMEOUT_MS
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId)
  )
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function calculateDueStatus(dueDate) {
  const diff = new Date(dueDate) - new Date()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return "overdue"
  if (days <= 3) return "due_soon"
  return "on_time"
}

function getDashboardSessionContext() {
  if (FORCE_TEST_FACULTY_SESSION) {
    return {
      currentUserId: TEST_FACULTY_USER_ID,
      currentUserRole: "faculty",
      currentUserTypeCode: TEST_FACULTY_USER_TYPE_CODE,
    }
  }

  const currentUserId = localStorage.getItem("userId")
  const currentUserRole = String(localStorage.getItem("userRole") || "")
    .trim()
    .toLowerCase()
  const storedUserTypeCode = Number.parseInt(
    localStorage.getItem("userTypeCode") || "",
    10
  )

  const currentUserTypeCode =
    storedUserTypeCode === 1 || storedUserTypeCode === 2
      ? storedUserTypeCode
      : currentUserRole === "faculty"
        ? 2
        : 1

  return {
    currentUserId,
    currentUserRole,
    currentUserTypeCode,
  }
}

function StatusBadge({ status }) {
  if (status === "overdue")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
        <XCircle className="h-3 w-3" /> Overdue
      </span>
    )
  if (status === "due_soon")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <Clock className="h-3 w-3" /> Due Soon
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
      <CheckCircle2 className="h-3 w-3" /> On Time
    </span>
  )
}

function OverviewCards({ borrowedBooks, holdQueue, fines, borrowHistory }) {
  const totalFines = fines
    .filter((f) => f.status === "unpaid")
    .reduce((s, f) => s + f.amount, 0)

  const stats = [
    {
      label: "Currently Borrowed",
      value: borrowedBooks.length,
      icon: BookOpen,
      accent: "#22c55e",
    },
    {
      label: "On Hold",
      value: holdQueue.length,
      icon: BookMarked,
      accent: "#16a34a",
    },
    {
      label: "Outstanding Fines",
      value: `$${totalFines.toFixed(2)}`,
      icon: DollarSign,
      accent: "#16a34a",
    },
    {
      label: "Books Read (2026)",
      value: borrowHistory.length,
      icon: RotateCcw,
      accent: "#16a34a",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, accent }) => (
        <div
          key={label}
          className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-shadow "
        >
          <div
            className="mb-3 inline-flex rounded-xl p-2"
            style={{ backgroundColor: `${accent}20` }}
          >
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  )
}

function BorrowedBooks({ books }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Currently Borrowed</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
        >
          View all <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {books.map((book) => {
          const days = daysUntil(book.dueDate)
          return (
            <div
              key={book.id}
              className="flex items-center gap-4 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
            >
              {/* Mini book cover */}
              <div
                className="flex h-14 w-10 shrink-0 items-center justify-center rounded-md text-white"
                style={{ backgroundColor: book.coverColor }}
              >
                <BookOpen className="h-5 w-5 opacity-70" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate leading-tight font-semibold">
                  {book.title}
                </p>
                <p className="text-xs text-muted-foreground">{book.author}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusBadge status={book.status} />
                  <span className="text-xs text-muted-foreground">
                    {days < 0
                      ? `${Math.abs(days)}d overdue`
                      : days === 0
                        ? "Due today"
                        : `${days}d left`}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        {books.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No borrowed items.
          </p>
        )}
      </CardContent>
    </Card>
  )
}



function HoldQueue({ holds, onRefresh }) {
  const [cancelingHoldId, setCancelingHoldId] = useState(null)

  const handleCancelHold = async (holdId) => {
    setCancelingHoldId(holdId)
    try {
      const response = await fetch(`${API_BASE_URL}/holds/${holdId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hold_status: "cancelled" }),
      })

      if (!response.ok) throw new Error("Failed to cancel hold")

      setTimeout(() => {
        setCancelingHoldId(null)
        onRefresh()
      }, 500)
    } catch (err) {
      console.error("Error cancelling hold:", err)
      setCancelingHoldId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Hold Queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {holds.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border bg-muted/30 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                #{item.queuePosition}
              </div>
              <div>
                <p className="leading-tight font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.author}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground">
                {item.estimatedWait}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancelHold(item.id)}
                disabled={cancelingHoldId === item.id}
                className="mt-1 h-6 px-2 text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
              >
                {cancelingHoldId === item.id ? "Cancelling..." : "Cancel"}
              </Button>
            </div>
          </div>
        ))}
        {holds.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No holds placed.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function FinesPanel({ fines, onPayClick }) {
  const unpaid = fines.filter((f) => f.status === "unpaid")
  const total = unpaid.reduce((s, f) => s + f.amount, 0)

  return (
    <Card className={total > 0 ? "border-red-200 dark:border-red-900" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Fines</CardTitle>
          {total > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-0.5 text-sm font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
              ${total.toFixed(2)} due
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fines.map((fine) => (
          <div
            key={fine.id}
            className="flex items-center justify-between rounded-xl border bg-muted/30 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="leading-tight font-semibold">{fine.book}</p>
                <p className="text-xs text-muted-foreground">
                  {fine.daysOverdue} days overdue
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span
                  className={`font-bold ${
                    fine.status === "paid"
                      ? "text-muted-foreground line-through"
                      : "text-red-600"
                  }`}
                >
                  ${fine.amount.toFixed(2)}
                </span>
                <div className="mt-1">
                  {fine.status === "unpaid" ? (
                    <Badge
                      variant="destructive"
                      className="h-4 px-1.5 py-0 text-[10px] tracking-wider uppercase"
                    >
                      Unpaid
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 py-0 text-[10px] tracking-wider uppercase"
                    >
                      Paid
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {fines.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No fines found.
          </p>
        )}
      </CardContent>
      {total > 0 && (
        <CardFooter className="pt-0">
          <Button
            onClick={() => onPayClick(unpaid, total)}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <CreditCard className="mr-2 h-4 w-4" /> Pay ${total.toFixed(2)}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

function BorrowHistory({ history }) {
  const [isLoading, setIsLoading] = useState(false)
  const [displayedItems, setDisplayedItems] = useState(5)

  const handleLoadMore = () => {
    setIsLoading(true)
    setTimeout(() => {
      setDisplayedItems((prev) => prev + 5)
      setIsLoading(false)
    }, 800)
  }

  const visibleHistory = history.slice(0, displayedItems)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Borrow History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleHistory.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border bg-muted/30 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="leading-tight font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.author}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Returned</p>
              <p className="text-xs font-semibold">{item.returned}</p>
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No history found.
          </p>
        )}
      </CardContent>
      {history.length > visibleHistory.length && (
        <CardFooter className="pt-0">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

// Main Dashboard Component
export default function UserDashboard() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("overview")
  const navigate = useNavigate()

  // State for user data
  const [user, setUser] = useState(null)
  const [borrowedBooks, setBorrowedBooks] = useState([])
  const [holdQueue, setHoldQueue] = useState([])
  const [fines, setFines] = useState([])
  const [borrowHistory, setBorrowHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all data on component mount
  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        currentUserId,
        currentUserRole,
        currentUserTypeCode,
      } = getDashboardSessionContext()

      if (!currentUserId) {
        throw new Error("No active user session found. Please sign in again.")
      }

      // Test backend connection first
      console.log(`Checking backend health at ${API_BASE_URL}/health`)
      try {
        const healthRes = await fetchWithTimeout(`${API_BASE_URL}/health`, {
          timeout: 5000,
        })
        if (!healthRes.ok) {
          throw new Error(
            "Backend health check failed. Server may be down or database is not connected."
          )
        }
        const healthData = await healthRes.json()
        console.log("Backend health:", healthData)
      } catch (err) {
        console.error("Health check error:", err)
        throw new Error(
          `Cannot connect to backend at ${API_BASE_URL}. Make sure the backend server is running on port 4000 and the database is connected. Error: ${err.message}`
        )
      }

      console.log(
        `Fetching dashboard data for ${currentUserRole || "user"} ${currentUserId} from ${API_BASE_URL}`
      )

      // Fetch all required data in parallel
      const [userData, borrowsData, holdsData, finesData] = await Promise.all([
        fetchWithTimeout(
          `${API_BASE_URL}/users/profile?user_id=${currentUserId}&user_type=${currentUserTypeCode}`
        ).then(
          (r) =>
            r.ok
              ? r.json()
              : Promise.reject(
                  `Profile API returned ${r.status}: ${r.statusText}`
                )
        ),
        fetchWithTimeout(
          `${API_BASE_URL}/borrows?borrower_id=${currentUserId}&borrower_type=${currentUserTypeCode}`
        ).then((r) =>
          r.ok ? r.json() : Promise.reject(`Borrows API returned ${r.status}`)
        ),
        fetchWithTimeout(
          `${API_BASE_URL}/holds?user_id=${currentUserId}&user_type=${currentUserTypeCode}`
        ).then((r) =>
          r.ok ? r.json() : Promise.reject(`Holds API returned ${r.status}`)
        ),
        fetchWithTimeout(
          `${API_BASE_URL}/fines?user_id=${currentUserId}&user_type=${currentUserTypeCode}`
        ).then((r) =>
          r.ok ? r.json() : Promise.reject(`Fines API returned ${r.status}`)
        ),
      ])

      const firstName = userData.first_name || "Library"
      const lastName = userData.last_name || "Member"

      setUser({
        name: `${firstName} ${lastName}`.trim(),
        email: userData.email,
        memberSince: new Date(userData.created_at).toLocaleDateString(
          "default",
          {
            month: "long",
            year: "numeric",
          }
        ),
        avatarInitials: `${firstName[0]}${lastName[0]}`,
        cardNumber: userData.user_id,
      })

      // Process borrowed books
      const active = borrowsData
        .filter((b) => !b.return_date)
        .map((b) => ({
          id: b.borrow_transaction_id,
          title: b.item_title || "Unknown",
          author: b.item_author || "Unknown",
          genre: b.item_genre || "Unknown",
          dueDate: b.due_date ? b.due_date.split("T")[0] : "",
          status: calculateDueStatus(b.due_date),
          coverColor: b.cover_color || "#333",
        }))
      setBorrowedBooks(active)

      // Process hold queue
      const active_holds = holdsData
        .filter((h) => h.hold_status === "active")
        .map((h) => ({
          id: h.hold_id,
          title: h.item_title || "Unknown",
          author: h.item_author || "Unknown",
          queuePosition: h.queue_position,
          estimatedWait:
            h.queue_position === 1 ? "Ready soon" : "~1 week",
        }))
      setHoldQueue(active_holds)

      // Process fines
      const unpaidFines = finesData.map((f) => ({
        id: f.fine_id,
        book: f.item_title || "Unknown",
        daysOverdue: f.days_overdue || 0,
        amount: f.amount,
        status: f.is_paid ? "paid" : "unpaid",
      }))
      setFines(unpaidFines)

      // Process borrow history
      const history = borrowsData
        .filter((b) => b.return_date)
        .slice(0, 10)
        .map((b) => ({
          id: b.borrow_transaction_id,
          title: b.item_title || "Unknown",
          author: b.item_author || "Unknown",
          returned: b.return_date ? b.return_date.split("T")[0] : "",
        }))
      setBorrowHistory(history)
    } catch (err) {
      console.error("Error fetching user data:", err)
      
      let errorMessage = "Failed to load dashboard. Please try again."
      
      // Provide more specific error messages based on error type
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        errorMessage = `Cannot connect to backend at ${API_BASE_URL}. Make sure the backend server is running on port 4000.`
      } else if (err.name === "AbortError") {
        errorMessage = `Request timed out after ${FETCH_TIMEOUT_MS/1000}s. The backend may be slow or unresponsive.`
      } else if (err.message && err.message.length > 0) {
        errorMessage = `Error: ${err.message}`
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <h2 className="mb-2 text-xl font-semibold">Error Loading Dashboard</h2>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-600" />
          <h2 className="mb-2 text-xl font-semibold">No User Data Found</h2>
          <p className="mb-4 text-muted-foreground">
            The dashboard could not load a user profile.
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const handleSignOut = () => {
    localStorage.setItem("isLoggedIn", "false")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    localStorage.removeItem("userRoleGroup")
    localStorage.removeItem("userTypeCode")
    navigate("/")
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "borrowed", label: "Borrowed", icon: BookOpen },
    { id: "holds", label: "Holds", icon: BookMarked },
    { id: "fines", label: "Fines", icon: AlertCircle },
    { id: "history", label: "History", icon: Clock },
  ]

  const handlePayFines = (unpaidFines, total) => {
    navigate("/payment", { state: { fines: unpaidFines, total } })
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
            aria-label="Back to home"
          >
            <div className="inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-md bg-emerald-600 px-2 text-[12px] font-bold whitespace-nowrap text-white ring-1 ring-emerald-700">
              LIBRARY LOGO HERE
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setTheme(
                theme === "dark" ||
                  (theme === "system" &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches)
                  ? "light"
                  : "dark"
              )
            }
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md transition-opacity outline-none hover:opacity-90">
                <Avatar className="h-9 w-9 bg-transparent">
                  <AvatarFallback className="bg-transparent text-sm font-bold text-white">
                    {user.avatarInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/user-dashboard" className="w-full cursor-pointer">
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="w-full cursor-pointer"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {/* Profile Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow-md">
              {user.avatarInitials}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Hello, {user.name.split(" ")[0]}
              </h1>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border bg-muted/40 p-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <OverviewCards
                borrowedBooks={borrowedBooks}
                holdQueue={holdQueue}
                fines={fines}
                borrowHistory={borrowHistory}
              />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <BorrowedBooks books={borrowedBooks} />
                <div className="space-y-6">
                  <HoldQueue holds={holdQueue} onRefresh={fetchUserData} />
                  <FinesPanel fines={fines} onPayClick={handlePayFines} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="borrowed">
            <div className="space-y-4">
              <BorrowedBooks books={borrowedBooks} />
            </div>
          </TabsContent>

          <TabsContent value="holds">
            <div className="space-y-4">
              <HoldQueue holds={holdQueue} onRefresh={fetchUserData} />
            </div>
          </TabsContent>

          <TabsContent value="fines">
            <div className="space-y-4">
              <FinesPanel fines={fines} onPayClick={handlePayFines} />
              <p className="text-center text-xs text-muted-foreground">
                Fines accrue at $0.25/day per overdue item.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              <BorrowHistory history={borrowHistory} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}