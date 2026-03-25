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
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { ItemCard } from "@/components/item-card"
import { LayoutDashboard, Image as ImageIcon, Filter } from "lucide-react"

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

  const [books, setBooks] = useState([])
  const [audios, setAudios] = useState([])
  const [videos, setVideos] = useState([])
  const [equipments, setEquipments] = useState([])
  const [loading, setLoading] = useState(true)

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
      <Navbar showBack={false} />

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
