import React, { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
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
import {
  Moon,
  Sun,
  LayoutDashboard,
  Image as ImageIcon,
  Filter,
} from "lucide-react"

// Background image import
import bgImage from "@/assets/library-hero.png"

export default function LandingSearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedType, setSelectedType] = useState("All")
  const [bookGenre, setBookGenre] = useState("")
  const [bookAuthor, setBookAuthor] = useState("")
  const [bookPubDate, setBookPubDate] = useState("")
  const [bookEdition, setBookEdition] = useState("")
  const [audioLength, setAudioLength] = useState("")
  const [videoLength, setVideoLength] = useState("")
  const [minStock, setMinStock] = useState("")

  const { theme, setTheme } = useTheme()

  const [books, setBooks] = useState([])
  const [audios, setAudios] = useState([])
  const [videos, setVideos] = useState([])
  const [equipments, setEquipments] = useState([])
  const [loading, setLoading] = useState(true)

  // Track login state in local storage to simulate authentication
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // For demo purposes, if unset let's show logged in initially, else use the setting.
    const stored = localStorage.getItem("isLoggedIn")
    return stored === null ? true : stored === "true"
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"

  // Fetch all items by type to populate the landing page categories
  useEffect(() => {
    const fetchCategory = async (type) => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/items/search?type=${type}`)
        if (res.ok) {
          const data = await res.json()
          return data.items || []
        }
      } catch (err) {
        console.error(`Failed to fetch ${type} items`, err)
      }
      return []
    }

    const fetchAll = async () => {
      setLoading(true)
      const [b, a, v, e] = await Promise.all([
        fetchCategory("Book"),
        fetchCategory("Audiobook"),
        fetchCategory("Video"),
        fetchCategory("Equipment"),
      ])
      setBooks(b)
      setAudios(a)
      setVideos(v)
      setEquipments(e)
      setLoading(false)
    }

    fetchAll()
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

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (selectedType && selectedType !== "All") params.set("type", selectedType)
    navigate(`/search?${params.toString()}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

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

          <div className="backdrop-blur-medium relative flex max-w-3xl flex-col items-center overflow-visible rounded-md bg-background/95 p-2 shadow-lg">
            <div className="relative z-20 flex w-full items-center">
              <InputGroup className="flex-1">
                <InputGroupInput
                  placeholder="Search by title, author, or genre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-12 rounded-r-none border-r-0 text-lg"
                />
                <Button
                  onClick={handleSearch}
                  className="h-12 rounded-l-none px-6"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </InputGroup>
              <Button
                variant={showFilters ? "secondary" : "ghost"}
                className="ml-2 h-12 px-4 shadow-none hover:bg-muted"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Expando Filters */}
            {showFilters && (
              <div className="absolute top-full left-0 z-30 mt-2 grid w-full grid-cols-1 gap-4 rounded-md border bg-background p-4 shadow-xl sm:grid-cols-2 md:grid-cols-3">
                {/* Global Filters */}
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Item Type
                  </label>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="All">All Types</option>
                    <option value="Book">Books</option>
                    <option value="Audiobook">Audiobooks</option>
                    <option value="Video">Videos</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Min Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                  />
                </div>

                {/* Book Filters */}
                {selectedType === "Book" && (
                  <>
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Genre
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Fiction"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        value={bookGenre}
                        onChange={(e) => setBookGenre(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Author
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Orwell"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        value={bookAuthor}
                        onChange={(e) => setBookAuthor(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Pub Date
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1949"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        value={bookPubDate}
                        onChange={(e) => setBookPubDate(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Edition
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. First"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        value={bookEdition}
                        onChange={(e) => setBookEdition(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Audiobook Filters */}
                {selectedType === "Audiobook" && (
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Length
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10h"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                      value={audioLength}
                      onChange={(e) => setAudioLength(e.target.value)}
                    />
                  </div>
                )}

                {/* Video Filters */}
                {selectedType === "Video" && (
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Length
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 120m"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                      value={videoLength}
                      onChange={(e) => setVideoLength(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content / Results ── */}
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-16 p-6 md:p-10">
        <CategorySection
          title="Books"
          description="Browse our collection"
          items={books}
          emptyMessage="No books found"
          viewAllLink="/search?type=Book"
        />

        <CategorySection
          title="Audiobooks"
          description="Listen on the go"
          items={audios}
          emptyMessage="New Audiobooks Coming Soon"
          viewAllLink="/search?type=Audiobook"
        />

        <CategorySection
          title="Videos"
          description="Watch movies, documentaries, and courses"
          items={videos}
          emptyMessage="New Videos Coming Soon"
          viewAllLink="/search?type=Video"
        />

        <CategorySection
          title="Equipment"
          description="Tech rentals for students and faculty"
          items={equipments}
          emptyMessage="No Equipment Found"
          viewAllLink="/search?type=Equipment"
        />
      </main>
    </div>
  )
}

function CategorySection({
  title,
  description,
  items,
  emptyMessage,
  viewAllLink,
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
        {viewAllLink && (
          <Button variant="ghost" asChild>
            <Link to={viewAllLink}>View all</Link>
          </Button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.slice(0, 4).map((item) => (
            <ItemCard key={item.item_id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-slate-50 py-12 text-center dark:bg-slate-900">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            {emptyMessage}
          </h3>
        </div>
      )}
    </section>
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
              to={`/item/${item.item_id}?type=${item.standard_type?.toLowerCase() || ""}`}
            >
              {item.availability === "Available" ? "Borrow" : "Place Hold"}
            </Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  )
}
