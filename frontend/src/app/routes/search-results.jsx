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
import { API_BASE_URL } from "@/lib/api-config"

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [selectedType, setSelectedType] = useState(
    searchParams.get("type") || "All"
  )
  const [comboboxOpen, setComboboxOpen] = useState(false)

  const [showFilters, setShowFilters] = useState(false)
  const [bookGenre, setBookGenre] = useState(
    searchParams.get("bookGenre") || ""
  )
  const [bookAuthor, setBookAuthor] = useState(
    searchParams.get("bookAuthor") || ""
  )
  const [bookPubDate, setBookPubDate] = useState(
    searchParams.get("bookPubDate") || ""
  )
  const [bookEdition, setBookEdition] = useState(
    searchParams.get("bookEdition") || ""
  )
  const [audioLength, setAudioLength] = useState(
    searchParams.get("audioLength") || ""
  )
  const [videoLength, setVideoLength] = useState(
    searchParams.get("videoLength") || ""
  )
  const [minStock, setMinStock] = useState(searchParams.get("minStock") || "")

  const itemTypes = [
    { value: "All", label: "All Types" },
    { value: "Book", label: "Books" },
    { value: "Audiobook", label: "Audiobooks" },
    { value: "Video", label: "Videos" },
    { value: "Equipment", label: "Equipment" },
  ]

  const [allLibraryItems, setAllLibraryItems] = useState([])
  const [loading, setLoading] = useState(true)

  const apiBaseUrl = API_BASE_URL

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

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "")
    setSelectedType(searchParams.get("type") || "All")
    setBookGenre(searchParams.get("bookGenre") || "")
    setBookAuthor(searchParams.get("bookAuthor") || "")
    setBookPubDate(searchParams.get("bookPubDate") || "")
    setBookEdition(searchParams.get("bookEdition") || "")
    setAudioLength(searchParams.get("audioLength") || "")
    setVideoLength(searchParams.get("videoLength") || "")
    setMinStock(searchParams.get("minStock") || "")
  }, [searchParams])

  // Update URL params when filters change
  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (selectedType && selectedType !== "All") params.set("type", selectedType)

    if (minStock) params.set("minStock", minStock)

    if (selectedType === "Book") {
      if (bookGenre) params.set("bookGenre", bookGenre)
      if (bookAuthor) params.set("bookAuthor", bookAuthor)
      if (bookPubDate) params.set("bookPubDate", bookPubDate)
      if (bookEdition) params.set("bookEdition", bookEdition)
    }

    if (selectedType === "Audiobook" && audioLength) {
      params.set("audioLength", audioLength)
    }

    if (selectedType === "Video" && videoLength) {
      params.set("videoLength", videoLength)
    }

    setSearchParams(params, { replace: true })
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const parseDurationToSeconds = (value) => {
    const raw = String(value || "")
      .trim()
      .toLowerCase()
    if (!raw) return null

    const match = raw.match(
      /^(\d+(?:\.\d+)?)(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)?$/
    )
    if (!match) {
      const fallback = Number(raw)
      return Number.isFinite(fallback) ? fallback : null
    }

    const amount = Number(match[1])
    const unit = match[2] || "s"

    if (["h", "hr", "hrs", "hour", "hours"].includes(unit)) {
      return Math.round(amount * 3600)
    }
    if (["m", "min", "mins", "minute", "minutes"].includes(unit)) {
      return Math.round(amount * 60)
    }
    return Math.round(amount)
  }

  const parseMinutesToSeconds = (value) => {
    const minutes = Number(String(value || "").trim())
    if (!Number.isFinite(minutes) || minutes < 0) return null
    return Math.round(minutes * 60)
  }

  const containsCI = (value, needle) =>
    String(value || "")
      .toLowerCase()
      .includes(
        String(needle || "")
          .trim()
          .toLowerCase()
      )

  const arrayContainsCI = (values, needle) => {
    const normalizedNeedle = String(needle || "")
      .trim()
      .toLowerCase()
    if (!normalizedNeedle) return true
    if (!Array.isArray(values)) return false
    return values.some((entry) =>
      String(entry || "")
        .toLowerCase()
        .includes(normalizedNeedle)
    )
  }

  const filteredItems = (allLibraryItems || []).filter((item) => {
    if (minStock) {
      const min = Number(minStock)
      if (Number.isFinite(min) && Number(item.in_stock || 0) < min) return false
    }

    if (selectedType === "Book") {
      if (bookAuthor && !containsCI(item.author, bookAuthor)) return false
      if (bookEdition && !containsCI(item.edition, bookEdition)) return false
      if (bookPubDate && !containsCI(item.publication_date, bookPubDate))
        return false
      if (bookGenre && !arrayContainsCI(item.genres, bookGenre)) return false
    }

    if (selectedType === "Audiobook" && audioLength) {
      const wanted = parseDurationToSeconds(audioLength)
      const actual = Number(item.audio_length_seconds || item.duration || 0)
      if (Number.isFinite(wanted) && wanted > 0 && actual < wanted) return false
    }

    if (selectedType === "Video" && videoLength) {
      const wanted = parseMinutesToSeconds(videoLength)
      const actual = Number(item.video_length_seconds || item.duration || 0)
      if (Number.isFinite(wanted) && wanted > 0 && actual < wanted) return false
    }

    return true
  })

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
                    const nextType = e.target.value
                    setSelectedType(nextType)
                    const params = new URLSearchParams()
                    if (searchQuery) params.set("q", searchQuery)

                    if (nextType && nextType !== "All") {
                      params.set("type", nextType)
                    }

                    if (minStock) params.set("minStock", minStock)

                    if (nextType === "Book") {
                      if (bookGenre) params.set("bookGenre", bookGenre)
                      if (bookAuthor) params.set("bookAuthor", bookAuthor)
                      if (bookPubDate) params.set("bookPubDate", bookPubDate)
                      if (bookEdition) params.set("bookEdition", bookEdition)
                    }

                    if (nextType === "Audiobook" && audioLength) {
                      params.set("audioLength", audioLength)
                    }

                    if (nextType === "Video" && videoLength) {
                      params.set("videoLength", videoLength)
                    }

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
                  onChange={(e) => {
                    const value = e.target.value
                    setMinStock(value)
                    const params = new URLSearchParams(searchParams)
                    if (value) params.set("minStock", value)
                    else params.delete("minStock")
                    setSearchParams(params, { replace: true })
                  }}
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
                      onChange={(e) => {
                        const value = e.target.value
                        setBookGenre(value)
                        const params = new URLSearchParams(searchParams)
                        if (value) params.set("bookGenre", value)
                        else params.delete("bookGenre")
                        setSearchParams(params, { replace: true })
                      }}
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
                      onChange={(e) => {
                        const value = e.target.value
                        setBookAuthor(value)
                        const params = new URLSearchParams(searchParams)
                        if (value) params.set("bookAuthor", value)
                        else params.delete("bookAuthor")
                        setSearchParams(params, { replace: true })
                      }}
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
                      onChange={(e) => {
                        const value = e.target.value
                        setBookPubDate(value)
                        const params = new URLSearchParams(searchParams)
                        if (value) params.set("bookPubDate", value)
                        else params.delete("bookPubDate")
                        setSearchParams(params, { replace: true })
                      }}
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
                      onChange={(e) => {
                        const value = e.target.value
                        setBookEdition(value)
                        const params = new URLSearchParams(searchParams)
                        if (value) params.set("bookEdition", value)
                        else params.delete("bookEdition")
                        setSearchParams(params, { replace: true })
                      }}
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
                    onChange={(e) => {
                      const value = e.target.value
                      setAudioLength(value)
                      const params = new URLSearchParams(searchParams)
                      if (value) params.set("audioLength", value)
                      else params.delete("audioLength")
                      setSearchParams(params, { replace: true })
                    }}
                  />
                </div>
              )}

              {/* Video Filters */}
              {selectedType === "Video" && (
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Length (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 120"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                    value={videoLength}
                    onChange={(e) => {
                      const value = e.target.value
                      setVideoLength(value)
                      const params = new URLSearchParams(searchParams)
                      if (value) params.set("videoLength", value)
                      else params.delete("videoLength")
                      setSearchParams(params, { replace: true })
                    }}
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
