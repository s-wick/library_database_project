import React, { useState } from "react"
import { Search } from "lucide-react"
import { Link } from "react-router-dom"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, LayoutDashboard } from "lucide-react"

// Background image import
import bgImage from "@/assets/library-hero.png"
import { books, borrows, holds, studentUsers } from "@/data/dummy-data"

export default function LandingSearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { theme, setTheme } = useTheme()

  // Track login state in local storage to simulate authentication
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // For demo purposes, if unset let's show logged in initially, else use the setting.
    const stored = localStorage.getItem("isLoggedIn")
    return stored === null ? true : stored === "true"
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const activeUser = studentUsers[0]
  const avatarInitials = `${activeUser.first_name[0]}${activeUser.last_name[0]}`

  const handleSignOut = () => {
    localStorage.setItem("isLoggedIn", "false")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    localStorage.removeItem("userRoleGroup")
    localStorage.removeItem("userTypeCode")
    setIsLoggedIn(false)
    setDropdownOpen(false)
  }

  // Compute availability dynamically from borrowing entities
  const libraryBooks = books.map((book) => {
    const activeBorrowsCount = borrows.filter(
      (b) => b.item_id === book.item_id && b.return_date === null
    ).length
    const activeHoldsCount = holds.filter(
      (h) => h.item_id === book.item_id && h.hold_status === "active"
    ).length

    // If fully borrowed and holds exist: Waitlist. If borrowed but no holds: Checked Out.
    let availability = "Available"
    if (activeBorrowsCount >= book.books_in_stock) {
      availability = activeHoldsCount > 0 ? "Waitlist" : "Checked Out"
    }

    return {
      ...book,
      id: book.book_id,
      availability,
    }
  })

  const filteredBooks = libraryBooks.filter((book) => {
    const lowerCaseQuery = searchQuery.toLowerCase()
    return (
      book.title.toLowerCase().includes(lowerCaseQuery) ||
      book.author.toLowerCase().includes(lowerCaseQuery) ||
      book.genre.toLowerCase().includes(lowerCaseQuery)
    )
  })

  return (
    <div>
      {/* ── Top Navigation Bar ── */}
      <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-6">
        {/* Logo Placeholder */}
        <Link
          to="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
          aria-label="Back to home"
        >
          <div className="inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-md bg-primary px-2 text-[12px] font-bold whitespace-nowrap text-primary-foreground ring-1 ring-border">
            LIBRARY LOGO HERE
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
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
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User Dropdown or Sign in */}
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shadow-md transition-opacity outline-none hover:opacity-90">
                  <Avatar className="h-9 w-9 bg-transparent">
                    <AvatarFallback className="bg-transparent text-sm font-bold text-white">
                      {avatarInitials}
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
          ) : (
            <Button asChild variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Hero Section ── */}
      <div
        className="relative flex h-[400px] items-center justify-center p-6"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 z-0 bg-black/60" />

        <div className="relative z-10 w-full max-w-2xl px-4 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Browse the Catalog
          </h1>
          <p className="mb-8 text-lg text-slate-200">
            Search books, audiobooks, and resources in our library.
          </p>

          <div className="relative mx-auto flex max-w-xl items-center overflow-hidden rounded-md bg-background shadow-lg">
            <InputGroup>
              <InputGroupInput
                placeholder="Search by title, author, or genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </div>

      {/* ── Main Content / Results ── */}
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-16 p-6 md:p-10">
        {/* Books Section */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : "Featured Books"}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {filteredBooks.length}{" "}
              {filteredBooks.length === 1 ? "book" : "books"} found
            </p>
          </div>

          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBooks.map((book) => (
                <Card key={book.id} className="flex flex-col">
                  <CardHeader>
                    <div className="mb-2 flex items-start justify-between">
                      <Badge
                        variant={
                          book.availability === "Available"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {book.availability}
                      </Badge>
                      <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        {book.genre}
                      </span>
                    </div>
                    <CardTitle className="mb-1 text-xl leading-tight">
                      {book.title}
                    </CardTitle>
                    <CardDescription>by {book.author}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {book.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      {book.availability === "Available"
                        ? "Borrow"
                        : "Place Hold"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-slate-50 py-20 text-center dark:bg-slate-900">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                No items found
              </h3>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your search terms or browsing our categories.
              </p>
            </div>
          )}
        </section>

        {/* Audiobooks Section */}
        {!searchQuery && (
          <section>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Audiobooks
                </h2>
                <p className="mt-1 text-muted-foreground">Listen on the go</p>
              </div>
              <Button variant="ghost">View all</Button>
            </div>
            <div className="rounded-lg border border-dashed bg-slate-50 py-12 text-center dark:bg-slate-900">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                New Audiobooks Coming Soon
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We are currently expanding our digital audio catalog.
              </p>
            </div>
          </section>
        )}

        {/* Videos Section */}
        {!searchQuery && (
          <section>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Videos
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Watch movies, documentaries, and courses
                </p>
              </div>
              <Button variant="ghost">View all</Button>
            </div>
            <div className="rounded-lg border border-dashed bg-slate-50 py-12 text-center dark:bg-slate-900">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                New Videos Coming Soon
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We are currently expanding our digital video catalog.
              </p>
            </div>
          </section>
        )}

        {/* Equipment & Devices Section */}
        {!searchQuery && (
          <section>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Equipment & Devices
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Tech rentals for students and faculty
                </p>
              </div>
              <Button variant="ghost">View all</Button>
            </div>
            <div className="rounded-lg border border-dashed bg-slate-50 py-12 text-center dark:bg-slate-900">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Laptops, Tablets & Accessories
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Check device availability at the front desk.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
