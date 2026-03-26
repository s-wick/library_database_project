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

// Application Data Helpers

// Utility to format data inside rendering if needed.

// Helpers
function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
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

// Sections
function OverviewCards({
  borrowedBooks = [],
  holdQueue = [],
  fines = [],
  borrowHistory = [],
}) {
  const totalFines = fines
    .filter((f) => f.status === "unpaid")
    .reduce((s, f) => s + f.amount, 0)

  const stats = [
    {
      label: "Currently Borrowed",
      value: borrowedBooks.length,
      icon: BookOpen,
      accent: "#4F7FFA",
    },
    {
      label: "On Hold",
      value: holdQueue.length,
      icon: BookMarked,
      accent: "#A78BFA",
    },
    {
      label: "Outstanding Fines",
      value: `$${totalFines.toFixed(2)}`,
      icon: DollarSign,
      accent: "#F87171",
    },
    {
      label: "Books Read",
      value: borrowHistory.length,
      icon: RotateCcw,
      accent: "#34D399",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, accent }) => (
        <div
          key={label}
          className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div
            className="absolute -top-3 -right-3 h-16 w-16 rounded-full opacity-10 transition-transform group-hover:scale-125"
            style={{ backgroundColor: accent }}
          />
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

function BorrowedBooks({ borrowedBooks = [] }) {
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
        {borrowedBooks.map((book) => {
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
      </CardContent>
    </Card>
  )
}

function HoldQueue({ holdQueue = [] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Hold Queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {holdQueue.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border bg-muted/30 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
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
                className="mt-1 h-6 px-2 text-xs text-red-500 hover:text-red-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        ))}
        {holdQueue.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No holds placed.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function FinesPanel({ fines = [], onPayClick }) {
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
            className="w-full bg-red-600 text-white hover:bg-red-700"
            onClick={() => onPayClick?.(total)}
          >
            <CreditCard className="mr-2 h-4 w-4" /> Pay ${total.toFixed(2)}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

function BorrowHistory({ borrowHistory = [] }) {
  const [isLoading, setIsLoading] = useState(false)
  const [displayedItems, setDisplayedItems] = useState(5)

  const handleLoadMore = () => {
    setIsLoading(true)
    setTimeout(() => {
      setDisplayedItems((prev) => prev + 5)
      setIsLoading(false)
    }, 800)
  }

  const visibleHistory = borrowHistory.slice(0, displayedItems)

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
        {borrowHistory.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No history found.
          </p>
        )}
      </CardContent>
      {borrowHistory.length > visibleHistory.length && (
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

// Main Dashboard
export default function UserDashboard() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("overview")
  const navigate = useNavigate()

  const [userData, setUserData] = useState({
    name: "User",
    email: "",
    avatarInitials: "U",
  })

  const [borrowedBooks, setBorrowedBooks] = useState([])
  const [holdQueue, setHoldQueue] = useState([])
  const [fines, setFines] = useState([])
  const [borrowHistory, setBorrowHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"

  useEffect(() => {
    // Attempt to load user from local storage
    try {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        let name = "User"
        let initials = "U"
        if (parsed.firstName && parsed.lastName) {
          name = `${parsed.firstName} ${parsed.lastName}`
          initials = `${parsed.firstName[0]}${parsed.lastName[0]}`.toUpperCase()
        } else if (parsed.email) {
          name = parsed.email.split("@")[0]
          initials = name[0].toUpperCase()
        }
        setUserData({ name, email: parsed.email, avatarInitials: initials })
      }
    } catch (err) {
      // Ignore
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const userStr = localStorage.getItem("user")
        const user = userStr ? JSON.parse(userStr) : null

        if (!user?.id) {
          setBorrowedBooks([])
          setHoldQueue([])
          setFines([])
          setBorrowHistory([])
          return
        }

        // Simulate API call to fetch full dashboard data
        const res = await fetch(`${apiBaseUrl}/api/dashboard?userId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setBorrowedBooks(data.borrowedBooks || [])
          setHoldQueue(data.holdQueue || [])
          setFines(data.fines || [])
          setBorrowHistory(data.borrowHistory || [])
        } else {
          // Fallback empty states
          setBorrowedBooks([])
          setHoldQueue([])
          setFines([])
          setBorrowHistory([])
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const handleSignOut = () => {
    localStorage.setItem("isLoggedIn", "false")
    localStorage.removeItem("user")
    navigate("/")
  }

  const handlePayFines = (amount) => {
    navigate("/payment", {
      state: {
        amount,
        type: "fine",
      },
    })
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "borrowed", label: "Borrowed", icon: BookOpen },
    { id: "holds", label: "Holds", icon: BookMarked },
    { id: "fines", label: "Fines", icon: AlertCircle },
    { id: "history", label: "History", icon: Clock },
  ]

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
            <div className="inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-md bg-primary px-2 text-[12px] font-bold whitespace-nowrap text-primary-foreground ring-1 ring-border">
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
              <button className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shadow-md transition-opacity outline-none hover:opacity-90">
                <Avatar className="h-9 w-9 bg-transparent">
                  <AvatarFallback className="bg-transparent text-sm font-bold text-white">
                    {userData.avatarInitials}
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
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-lg font-bold text-white shadow-md">
              {userData.avatarInitials}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Hello, {userData.name.split(" ")[0]}
              </h1>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            Loading dashboard...
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
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
                  <BorrowedBooks borrowedBooks={borrowedBooks} />
                  <div className="space-y-6">
                    <HoldQueue holdQueue={holdQueue} />
                    <FinesPanel fines={fines} onPayClick={handlePayFines} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="borrowed">
              <div className="space-y-4">
                <BorrowedBooks borrowedBooks={borrowedBooks} />
              </div>
            </TabsContent>

            <TabsContent value="holds">
              <div className="space-y-4">
                <HoldQueue holdQueue={holdQueue} />
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
                <BorrowHistory borrowHistory={borrowHistory} />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
