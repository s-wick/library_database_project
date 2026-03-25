import React, { useState, useEffect } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { Search as SearchIcon, Filter, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
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

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [selectedType, setSelectedType] = useState(
    searchParams.get("type") || "All"
  )
  const [comboboxOpen, setComboboxOpen] = useState(false)

  const [showFilters, setShowFilters] = useState(false)
  const [bookGenre, setBookGenre] = useState("")
  const [bookAuthor, setBookAuthor] = useState("")
  const [bookPubDate, setBookPubDate] = useState("")
  const [bookEdition, setBookEdition] = useState("")
  const [audioLength, setAudioLength] = useState("")
  const [videoLength, setVideoLength] = useState("")
  const [minStock, setMinStock] = useState("")

  const itemTypes = [
    { value: "All", label: "All Types" },
    { value: "Book", label: "Books" },
    { value: "Audiobook", label: "Audiobooks" },
    { value: "Video", label: "Videos" },
    { value: "Equipment", label: "Equipment" },
  ]

  const [allLibraryItems, setAllLibraryItems] = useState([])
  const [loading, setLoading] = useState(true)

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"

  const fetchItems = async () => {
    try {
      setLoading(true)
      const q = searchParams.get("q") || ""
      const type = searchParams.get("type") || "All"
      const res = await fetch(
        `${apiBaseUrl}/api/items/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`
      )
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

  useEffect(() => {
    fetchItems()
  }, [searchParams])

  // Update URL params when filters change
  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (selectedType && selectedType !== "All") params.set("type", selectedType)
    setSearchParams(params, { replace: true })
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const filteredItems = allLibraryItems || []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar showBack={true} />

      <div className="border-b bg-slate-50 py-6 dark:bg-slate-900/50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 md:px-10">
          <div className="relative z-20 flex w-full flex-col items-center gap-4 md:flex-row">
            <Field className="flex-1" orientation="horizontal">
              <Input
                type="search"
                placeholder="Search by title, author, or genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 text-base"
              />
              <Button onClick={handleSearch} className="h-12 px-6">
                <SearchIcon className="h-5 w-5" />
              </Button>
            </Field>

            <Button
              variant={showFilters ? "secondary" : "ghost"}
              className="h-12 shrink-0 px-4 shadow-none hover:bg-muted"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="z-30 grid w-full grid-cols-1 gap-4 rounded-md border bg-background p-4 shadow-sm sm:grid-cols-2 md:grid-cols-3">
              {/* Global Filters */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Item Type
                </label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value)
                    const params = new URLSearchParams()
                    if (searchQuery) params.set("q", searchQuery)
                    if (e.target.value && e.target.value !== "All")
                      params.set("type", e.target.value)
                    setSearchParams(params, { replace: true })
                  }}
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

      {/* Results */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6 md:px-10 md:py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Search Results
          </h2>
          <p className="text-muted-foreground">
            {loading ? "Loading..." : `${filteredItems.length} items found`}
          </p>
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <ItemCard key={item.item_id} item={item} />
            ))}
          </div>
        ) : (
          !loading && (
            <div className="rounded-lg border border-dashed bg-slate-50 py-16 text-center dark:bg-slate-900">
              <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                No items found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query.
              </p>
            </div>
          )
        )}
      </main>
    </div>
  )
}



