import React, { useState, useEffect } from "react"
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
import { Moon, Sun, LayoutDashboard, Image as ImageIcon } from "lucide-react"

// Background image import
import bgImage from "@/assets/library-hero.png"

export default function LandingSearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { theme, setTheme } = useTheme()

  const [allLibraryItems, setAllLibraryItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Track login state in local storage to simulate authentication
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // For demo purposes, if unset let's show logged in initially, else use the setting.
    const stored = localStorage.getItem("isLoggedIn")
    return stored === null ? true : stored === "true"
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"

  // Fetch all items from the API to keep state synchronized without dummy data
  useEffect(() => {
    const fetchAllItems = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${apiBaseUrl}/api/items/all`)
        if (res.ok) {
          const data = await res.json()
          setAllLibraryItems(data.items || [])
        } else {
          setAllLibraryItems([])
        }
      } catch (err) {
        console.error("Failed to fetch library items", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAllItems()
  }, [])

  let avatarInitials = "U"
  try {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      if (parsed.firstName && parsed.lastName) {
        avatarInitials =
          `${parsed.firstName[0]}${parsed.lastName[0]}`.toUpperCase()
      } else if (parsed.email) {
        avatarInitials = parsed.email[0].toUpperCase()
      }
    }
  } catch (err) {
    // Ignore error
  }

  const handleSignOut = () => {
    localStorage.setItem("isLoggedIn", "false")
    localStorage.removeItem("user")
    setIsLoggedIn(false)
    setDropdownOpen(false)
  }

  // Grouped filtered items
  const filteredItems = (allLibraryItems || []).filter((item) => {
    const lowerCaseQuery = searchQuery.toLowerCase()
    return (
      item.title?.toLowerCase().includes(lowerCaseQuery) ||
      item.creator?.toLowerCase().includes(lowerCaseQuery) ||
      item.tag?.toLowerCase().includes(lowerCaseQuery) ||
      item.standard_type?.toLowerCase().includes(lowerCaseQuery)
    )
  })

  const filteredBooks = filteredItems.filter((i) => i.standard_type === "Book")
  const filteredAudios = filteredItems.filter(
    (i) => i.standard_type === "Audiobook"
  )
  const filteredVideos = filteredItems.filter(
    (i) => i.standard_type === "Video"
  )
  const filteredEquipments = filteredItems.filter(
    (i) => i.standard_type === "Equipment"
  )

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
          <p className="mb-4 text-lg text-slate-200">
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
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {searchQuery ? `Books matching "${searchQuery}"` : "Books"}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {filteredBooks.length}{" "}
                {filteredBooks.length === 1 ? "result" : "results"}
              </p>
            </div>
            {!searchQuery && <Button variant="ghost">View all</Button>}
          </div>

          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBooks.map((item) => (
                <ItemCard key={item.item_id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-slate-50 py-12 text-center dark:bg-slate-900">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                No books found
              </h3>
            </div>
          )}
        </section>

        {/* Audiobooks Section */}
        {(!searchQuery || filteredAudios.length > 0) && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Audiobooks
                </h2>
                <p className="mt-1 text-muted-foreground">Listen on the go</p>
              </div>
              {!searchQuery && <Button variant="ghost">View all</Button>}
            </div>

            {filteredAudios.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAudios.map((item) => (
                  <ItemCard key={item.item_id} item={item} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-slate-50 py-12 text-center dark:bg-slate-900">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  New Audiobooks Coming Soon
                </h3>
              </div>
            )}
          </section>
        )}

        {/* Videos Section */}
        {(!searchQuery || filteredVideos.length > 0) && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Videos
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Watch movies, documentaries, and courses
                </p>
              </div>
              {!searchQuery && <Button variant="ghost">View all</Button>}
            </div>

            {filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredVideos.map((item) => (
                  <ItemCard key={item.item_id} item={item} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-slate-50 py-12 text-center dark:bg-slate-900">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  New Videos Coming Soon
                </h3>
              </div>
            )}
          </section>
        )}

        {/* Equipment Section */}
        {(!searchQuery || filteredEquipments.length > 0) && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Equipment
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Tech rentals for students and faculty
                </p>
              </div>
              {!searchQuery && <Button variant="ghost">View all</Button>}
            </div>

            {filteredEquipments.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredEquipments.map((item) => (
                  <ItemCard key={item.item_id} item={item} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-slate-50 py-12 text-center dark:bg-slate-900">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  No Equipment Found
                </h3>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function ItemCard({ item }) {
  // Use a generic id instead of only book.id so item.jsx can fetch properly based on params,
  // however item.jsx only searches books right now. We map routing correctly using item_id.
  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden p-0">
      <div className="p-3 pb-0">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
          {item.thumbnail_image ? (
            <img
              src={item.thumbnail_image}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                backgroundColor: item.coverColor || "#e2e8f0",
              }}
            >
              <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                <ImageIcon className="mb-2 h-10 w-10" />
                <span className="text-xs font-medium">No Image</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <CardHeader className="p-3 pb-2">
          <div className="mb-2 flex items-start justify-between gap-2">
            <Badge
              variant={
                item.availability === "Available" ? "default" : "secondary"
              }
            >
              {item.availability}
            </Badge>
            <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {item.tag}
            </span>
          </div>
          <CardTitle className="line-clamp-2 text-lg leading-tight">
            {item.title}
          </CardTitle>
          <CardDescription className="line-clamp-1">
            {item.creator ? `by ${item.creator}` : item.standard_type}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-4 pt-2">
          <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
            {item.description}
          </p>
        </CardContent>
        <CardFooter className="mt-auto px-4 pt-0 pb-3">
          <Button variant="outline" className="w-full" asChild>
            <Link
              to={`/item/${item.id}?type=${item.standard_type.toLowerCase()}`}
            >
              {item.availability === "Available" ? "Borrow" : "Place Hold"}
            </Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  )
}
