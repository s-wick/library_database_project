import React, { useState } from "react"
import { Link } from "react-router-dom"
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

import {
  studentUsers,
  books,
  borrows,
  holds,
  fined_for,
} from "@/data/dummy-data"

// Computed Data Based on Entities
const activeUser = studentUsers[0]
const user = {
  name: `${activeUser.first_name} ${activeUser.last_name}`,
  email: activeUser.email,
  memberSince: new Date(activeUser.created_at).toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  }),
  avatarInitials: `${activeUser.first_name[0]}${activeUser.last_name[0]}`,
  cardNumber: activeUser.student_id,
}

const userBorrows = borrows.filter(
  (b) => b.borrower_id === activeUser.user_id && b.borrower_type === 1
)

const borrowedBooks = userBorrows
  .filter((b) => b.return_date === null)
  .map((b) => {
    const book = books.find((bk) => bk.item_id === b.item_id)
    const dueDate = new Date(b.due_date).toISOString().split("T")[0]
    const diff = new Date(b.due_date) - new Date()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    let status = "on_time"
    if (days < 0) status = "overdue"
    else if (days <= 3) status = "due_soon"

    return {
      id: b.borrow_transaction_id,
      title: book?.title || "Unknown",
      author: book?.author || "Unknown",
      genre: book?.genre || "Unknown",
      dueDate,
      status,
      coverColor: book?.coverColor || "#333",
    }
  })

const holdQueue = holds
  .filter((h) => h.user_id === activeUser.user_id && h.hold_status === "active")
  .map((h) => {
    const book = books.find((bk) => bk.item_id === h.item_id)
    return {
      id: h.hold_id,
      title: book?.title || "Unknown",
      author: book?.author || "Unknown",
      queuePosition: h.queue_position,
      estimatedWait: h.queue_position === 1 ? "Ready soon" : "~1 week",
    }
  })

const fines = fined_for
  .filter((f) => {
    const borrowRecord = borrows.find(
      (b) => b.borrow_transaction_id === f.borrow_transaction_id
    )
    return borrowRecord?.borrower_id === activeUser.user_id
  })
  .map((f) => {
    const borrowRecord = borrows.find(
      (b) => b.borrow_transaction_id === f.borrow_transaction_id
    )
    const book = books.find((bk) => bk.item_id === borrowRecord?.item_id)

    // Calculate days overdue based on assignment date vs due date
    const expectedDueDate = new Date(borrowRecord?.due_date)
    const activeDate = new Date(f.date_assigned)
    const daysOverdue = Math.max(
      1,
      Math.floor((activeDate - expectedDueDate) / (1000 * 60 * 60 * 24))
    )

    return {
      id: f.fine_id,
      book: book?.title || "Unknown",
      daysOverdue,
      amount: f.amount,
      status: f.is_paid ? "paid" : "unpaid",
    }
  })

const borrowHistory = userBorrows
  .filter((b) => b.return_date !== null)
  .map((b) => {
    const book = books.find((bk) => bk.item_id === b.item_id)
    return {
      id: b.borrow_transaction_id,
      title: book?.title || "Unknown",
      author: book?.author || "Unknown",
      returned: new Date(b.return_date).toISOString().split("T")[0],
    }
  })

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
function OverviewCards() {
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
      label: "Books Read (2026)",
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

function BorrowedBooks() {
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
              <Button variant="outline" size="sm" className="shrink-0 text-xs">
                Renew
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function HoldQueue() {
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

function FinesPanel() {
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
      <CardContent className="space-y-2">
        {fines.map((fine) => (
          <div
            key={fine.id}
            className="flex items-center justify-between rounded-lg p-2.5 text-sm"
          >
            <div>
              <p className="font-medium">{fine.book}</p>
              <p className="text-xs text-muted-foreground">
                {fine.daysOverdue} days overdue
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold ${
                  fine.status === "paid"
                    ? "text-muted-foreground line-through"
                    : "text-red-600"
                }`}
              >
                ${fine.amount.toFixed(2)}
              </span>
              {fine.status === "unpaid" ? (
                <Badge variant="destructive" className="text-xs">
                  Unpaid
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Paid
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      {total > 0 && (
        <CardFooter className="pt-0">
          <Button className="w-full bg-red-600 text-white hover:bg-red-700">
            <CreditCard className="mr-2 h-4 w-4" /> Pay ${total.toFixed(2)}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

function BorrowHistory() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Borrow History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {borrowHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3"
            >
              <div>
                <p className="leading-tight font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.author}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Returned</p>
                <p className="text-xs font-medium">{item.returned}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full text-xs">
          View Full History <ArrowUpRight className="ml-1 h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  )
}

// Main Dashboard
export default function UserDashboard() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("overview")

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
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Catalog</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Button>
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
          <Button variant="ghost" size="icon">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {/* Profile Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-lg font-bold text-white shadow-md">
              {user.avatarInitials}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome back, {user.name.split(" ")[0]}
              </h1>
              <p className="text-sm text-muted-foreground">
                Member since {user.memberSince} · Card {user.cardNumber}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 self-start sm:self-auto"
          >
            <User className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border bg-muted/40 p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <OverviewCards />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <BorrowedBooks />
              <div className="space-y-6">
                <HoldQueue />
                <FinesPanel />
              </div>
            </div>
          </div>
        )}

        {activeTab === "borrowed" && (
          <div className="space-y-4">
            <BorrowedBooks />
          </div>
        )}

        {activeTab === "holds" && (
          <div className="space-y-4">
            <HoldQueue />
          </div>
        )}

        {activeTab === "fines" && (
          <div className="max-w-lg space-y-4">
            <FinesPanel />
            <p className="text-center text-xs text-muted-foreground">
              Fines accrue at $0.25/day per overdue item.
            </p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-lg space-y-4">
            <BorrowHistory />
          </div>
        )}
      </div>
    </div>
  )
}
