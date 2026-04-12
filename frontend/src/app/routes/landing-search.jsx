import React, { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Navbar } from "@/components/navbar"
import { ItemCard } from "@/components/item-card"
import { Filter } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"

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
  const [audioRange, setAudioRange] = useState([0, 1500])
  const [videoRange, setVideoRange] = useState([0, 360])
  const [inStockOnly, setInStockOnly] = useState(false)

  const [books, setBooks] = useState([])
  const [audios, setAudios] = useState([])
  const [videos, setVideos] = useState([])
  const [equipments, setEquipments] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  const apiBaseUrl = API_BASE_URL

  const formatMinutes = (minutes) => {
    if (!Number.isFinite(minutes) || minutes <= 0) return "0 min"
    const hours = Math.floor(minutes / 60)
    const remaining = minutes % 60
    if (hours <= 0) return `${minutes} min`
    if (remaining === 0) return `${hours} hr`
    return `${hours} hr ${remaining} min`
  }

  const formatRange = (range, maxValue) => {
    const [min, max] = range
    if (min <= 0 && max >= maxValue) return "Any length"
    return `${formatMinutes(min)} to ${formatMinutes(max)}`
  }

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

      try {
        const roomsRes = await fetch(`${apiBaseUrl}/api/rooms`)
        if (roomsRes.ok) {
          const roomData = await roomsRes.json()
          setRooms(roomData.rooms || [])
        }
      } catch (err) {
        console.error("Failed to fetch rooms", err)
      }

      setLoading(false)
    }

    fetchAll()
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (selectedType && selectedType !== "All") params.set("type", selectedType)

    if (inStockOnly) params.set("minStock", "1")

    if (selectedType === "Book") {
      if (bookGenre) params.set("bookGenre", bookGenre)
      if (bookAuthor) params.set("bookAuthor", bookAuthor)
      if (bookPubDate) params.set("bookPubDate", bookPubDate)
      if (bookEdition) params.set("bookEdition", bookEdition)
    }

    if (selectedType === "Audiobook") {
      if (audioRange[0] > 0) params.set("audioMin", String(audioRange[0]))
      if (audioRange[1] < 1500) params.set("audioMax", String(audioRange[1]))
    }

    if (selectedType === "Video") {
      if (videoRange[0] > 0) params.set("videoMin", String(videoRange[0]))
      if (videoRange[1] < 360) params.set("videoMax", String(videoRange[1]))
    }

    navigate(`/search?${params.toString()}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div>
      <Navbar showBack={false} />

      {/* ── Hero Section ── */}
      <div className="relative flex h-[400px] items-center justify-center overflow-visible p-6">
        {/* Blurred background image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(3px)",
              transform: "scale(1.05)", // Prevents edge transparency from blur
            }}
          />
        </div>
        {/* Overlay for darkening */}
        <div className="absolute inset-0 z-10 bg-black/60" />

        {/* Content stays sharp */}
        <div className="relative z-20 w-full max-w-2xl px-4 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Browse the Catalog
          </h1>
          <p className="mb-4 text-lg text-slate-200">
            Search books, audiobooks, and resources in our library.
          </p>

          <div className="backdrop-blur-medium relative flex max-w-3xl flex-col items-center overflow-visible rounded-md bg-background/95 p-2 shadow-lg">
            <div className="relative z-20 flex w-full items-center">
              <Field className="flex-1" orientation="horizontal">
                <Input
                  type="search"
                  placeholder="Search by title, author, or genre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-12 text-lg"
                />
                <Button onClick={handleSearch} className="h-12 px-6">
                  <Search className="h-5 w-5" />
                </Button>
              </Field>
              <Button
                variant="outline"
                className="ml-2 h-12 px-4"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Expando Filters */}
            {showFilters && (
              <div className="absolute top-full left-0 z-40 mt-2 grid w-full grid-cols-1 gap-4 rounded-md border bg-background p-4 shadow-xl sm:grid-cols-2 md:grid-cols-3">
                {/* Global Filters */}
                <div className="flex flex-col gap-2 text-left sm:col-span-2 md:col-span-3">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex min-w-[180px] flex-1 flex-col gap-1">
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
                    <label className="flex items-center gap-3 pr-4 pb-2 text-base text-muted-foreground">
                      <Checkbox
                        className="size-5"
                        checked={inStockOnly}
                        onCheckedChange={(checked) =>
                          setInStockOnly(Boolean(checked))
                        }
                      />
                      In stock only
                    </label>
                  </div>
                </div>
                {selectedType === "Audiobook" && (
                  <div className="flex flex-col gap-3 text-left sm:col-span-2 md:col-span-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Length
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {formatRange(audioRange, 1500)}
                      </span>
                    </div>
                    <Slider
                      value={audioRange}
                      min={0}
                      max={1500}
                      step={60}
                      minStepsBetweenThumbs={1}
                      onValueChange={setAudioRange}
                      className="py-4 [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-track]]:h-2"
                    />
                  </div>
                )}

                {selectedType === "Video" && (
                  <div className="flex flex-col gap-3 text-left sm:col-span-2 md:col-span-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Length
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {formatRange(videoRange, 360)}
                      </span>
                    </div>
                    <Slider
                      value={videoRange}
                      min={0}
                      max={360}
                      step={60}
                      minStepsBetweenThumbs={1}
                      onValueChange={setVideoRange}
                      className="py-4 [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-track]]:h-2"
                    />
                  </div>
                )}

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
          loading={loading}
          emptyMessage="No books found"
          viewAllLink="/search?type=Book"
        />

        <CategorySection
          title="Audiobooks"
          description="Listen on the go"
          items={audios}
          loading={loading}
          emptyMessage="New Audiobooks Coming Soon"
          viewAllLink="/search?type=Audiobook"
        />

        <CategorySection
          title="Videos"
          description="Watch movies, documentaries, and courses"
          items={videos}
          loading={loading}
          emptyMessage="New Videos Coming Soon"
          viewAllLink="/search?type=Video"
        />

        <CategorySection
          title="Equipment"
          description="Tech rentals for students and faculty"
          items={equipments}
          loading={loading}
          emptyMessage="No Equipment Found"
          viewAllLink="/search?type=Equipment"
        />

        <RoomBookingSection rooms={rooms} loading={loading} />
      </main>
    </div>
  )
}

function RoomBookingSection({ rooms = [], loading = false }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Study Rooms</h2>
          <p className="mt-1 text-muted-foreground">
            Reserve rooms up to 1 day in advance, one room at a time, max 3
            hours.
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link to="/rooms">View all</Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card
              key={`room-skeleton-${index}`}
              className="flex h-full flex-col"
            >
              <CardHeader>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-2 h-4 w-32" />
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : rooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.slice(0, 4).map((room) => (
            <Card key={room.roomNumber} className="flex h-full flex-col">
              <CardHeader>
                <CardTitle>Room {room.roomNumber}</CardTitle>
                <CardDescription>
                  Floor {room.floor} | Capacity {room.capacity}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 text-sm text-muted-foreground">
                <ul className="space-y-1">
                  <li>TV: {room.features?.hasTv ? "Yes" : "No"}</li>
                  <li>
                    Whiteboard: {room.features?.hasWhiteboard ? "Yes" : "No"}
                  </li>
                  <li>
                    Projector: {room.features?.hasProjector ? "Yes" : "No"}
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to="/rooms">Book This Room</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-slate-50 py-12 text-center dark:bg-slate-900">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Room booking coming soon
          </h3>
        </div>
      )}
    </section>
  )
}

function CategorySection({
  title,
  description,
  items,
  loading = false,
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

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`item-skeleton-${index}`} className="overflow-hidden">
              <div className="space-y-3 p-4">
                <Skeleton className="h-40 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : items.length > 0 ? (
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
