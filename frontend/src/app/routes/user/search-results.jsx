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
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"

import { Navbar } from "@/components/navbar"
import { ItemCard } from "@/components/item-card"
import { API_BASE_URL } from "@/lib/api-config"

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const AUDIO_RANGE_MAX = 1500
  const VIDEO_RANGE_MAX = 360

  const clampRange = (minValue, maxValue, maxLimit) => {
    const min = Number.isFinite(Number(minValue)) ? Number(minValue) : 0
    const max = Number.isFinite(Number(maxValue)) ? Number(maxValue) : maxLimit
    const safeMin = Math.min(Math.max(min, 0), maxLimit)
    const safeMax = Math.min(Math.max(max, safeMin), maxLimit)
    return [safeMin, safeMax]
  }

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
  const [audioRange, setAudioRange] = useState(() =>
    clampRange(
      searchParams.get("audioMin"),
      searchParams.get("audioMax"),
      AUDIO_RANGE_MAX
    )
  )
  const [videoRange, setVideoRange] = useState(() =>
    clampRange(
      searchParams.get("videoMin"),
      searchParams.get("videoMax"),
      VIDEO_RANGE_MAX
    )
  )
  const [inStockOnly, setInStockOnly] = useState(
    searchParams.get("minStock") === "1"
  )

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
    setAudioRange(
      clampRange(
        searchParams.get("audioMin"),
        searchParams.get("audioMax"),
        AUDIO_RANGE_MAX
      )
    )
    setVideoRange(
      clampRange(
        searchParams.get("videoMin"),
        searchParams.get("videoMax"),
        VIDEO_RANGE_MAX
      )
    )
    setInStockOnly(searchParams.get("minStock") === "1")
  }, [searchParams])

  // Update URL params when filters change
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
      if (audioRange[1] < AUDIO_RANGE_MAX)
        params.set("audioMax", String(audioRange[1]))
    }

    if (selectedType === "Video") {
      if (videoRange[0] > 0) params.set("videoMin", String(videoRange[0]))
      if (videoRange[1] < VIDEO_RANGE_MAX)
        params.set("videoMax", String(videoRange[1]))
    }

    setSearchParams(params, { replace: true })
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const resolveDurationMinutes = (item, type) => {
    const seconds = Number(
      type === "Audiobook"
        ? item.audio_length_seconds
        : item.video_length_seconds
    )
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.round(seconds / 60)
    }
    const minutes = Number(item.duration)
    return Number.isFinite(minutes) ? minutes : 0
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
    if (inStockOnly) {
      if (Number(item.stock || 0) < 1) return false
    }

    if (selectedType === "Book") {
      if (bookAuthor && !containsCI(item.author, bookAuthor)) return false
      if (bookEdition && !containsCI(item.edition, bookEdition)) return false
      if (bookPubDate && !containsCI(item.publication_date, bookPubDate))
        return false
      if (bookGenre && !arrayContainsCI(item.genres, bookGenre)) return false
    }

    if (selectedType === "Audiobook") {
      const [minMinutes, maxMinutes] = audioRange
      const actualMinutes = resolveDurationMinutes(item, "Audiobook")
      if (actualMinutes < minMinutes || actualMinutes > maxMinutes) return false
    }

    if (selectedType === "Video") {
      const [minMinutes, maxMinutes] = videoRange
      const actualMinutes = resolveDurationMinutes(item, "Video")
      if (actualMinutes < minMinutes || actualMinutes > maxMinutes) return false
    }

    return true
  })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

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
              <div className="flex flex-col gap-2 text-left sm:col-span-2 md:col-span-3">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex min-w-[180px] flex-1 flex-col gap-1">
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

                        if (inStockOnly) params.set("minStock", "1")

                        if (nextType === "Book") {
                          if (bookGenre) params.set("bookGenre", bookGenre)
                          if (bookAuthor) params.set("bookAuthor", bookAuthor)
                          if (bookPubDate)
                            params.set("bookPubDate", bookPubDate)
                          if (bookEdition)
                            params.set("bookEdition", bookEdition)
                        }

                        if (nextType === "Audiobook") {
                          if (audioRange[0] > 0)
                            params.set("audioMin", String(audioRange[0]))
                          if (audioRange[1] < AUDIO_RANGE_MAX)
                            params.set("audioMax", String(audioRange[1]))
                        }

                        if (nextType === "Video") {
                          if (videoRange[0] > 0)
                            params.set("videoMin", String(videoRange[0]))
                          if (videoRange[1] < VIDEO_RANGE_MAX)
                            params.set("videoMax", String(videoRange[1]))
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
                  <label className="flex items-center gap-3 pr-4 pb-2 text-base text-muted-foreground">
                    <Checkbox
                      className="size-5"
                      checked={inStockOnly}
                      onCheckedChange={(checked) => {
                        const nextValue = Boolean(checked)
                        setInStockOnly(nextValue)
                        const params = new URLSearchParams(searchParams)
                        if (nextValue) params.set("minStock", "1")
                        else params.delete("minStock")
                        setSearchParams(params, { replace: true })
                      }}
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
                      {formatRange(audioRange, AUDIO_RANGE_MAX)}
                    </span>
                  </div>
                  <Slider
                    value={audioRange}
                    min={0}
                    max={AUDIO_RANGE_MAX}
                    step={60}
                    minStepsBetweenThumbs={1}
                    onValueChange={(value) => {
                      setAudioRange(value)
                      const params = new URLSearchParams(searchParams)
                      params.delete("audioLength")
                      if (value[0] > 0) params.set("audioMin", String(value[0]))
                      else params.delete("audioMin")
                      if (value[1] < AUDIO_RANGE_MAX)
                        params.set("audioMax", String(value[1]))
                      else params.delete("audioMax")
                      setSearchParams(params, { replace: true })
                    }}
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
                      {formatRange(videoRange, VIDEO_RANGE_MAX)}
                    </span>
                  </div>
                  <Slider
                    value={videoRange}
                    min={0}
                    max={VIDEO_RANGE_MAX}
                    step={60}
                    minStepsBetweenThumbs={1}
                    onValueChange={(value) => {
                      setVideoRange(value)
                      const params = new URLSearchParams(searchParams)
                      params.delete("videoLength")
                      if (value[0] > 0) params.set("videoMin", String(value[0]))
                      else params.delete("videoMin")
                      if (value[1] < VIDEO_RANGE_MAX)
                        params.set("videoMax", String(value[1]))
                      else params.delete("videoMax")
                      setSearchParams(params, { replace: true })
                    }}
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
