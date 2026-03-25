import React, { useState, useEffect } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import {
  Search as SearchIcon,
  Filter,
  Moon,
  Sun,
  ArrowLeft,
  Image as ImageIcon,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/theme-provider"

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [selectedType, setSelectedType] = useState(
    searchParams.get("type") || "All"
  )
  const [comboboxOpen, setComboboxOpen] = useState(false)

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
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Link
            to="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
            aria-label="Back to home"
          >
            <div className="inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-md bg-primary px-2 text-[12px] font-bold whitespace-nowrap text-primary-foreground ring-1 ring-border">
              LIBRARY LOGO
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
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
        </div>
      </div>

      <div className="border-b bg-slate-50 p-6 md:px-10 dark:bg-slate-900/50">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 md:flex-row">
          <InputGroup className="flex-1 bg-background">
            <InputGroupInput
              placeholder="Search by title, author, or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-md h-12"
            />
            <Button onClick={handleSearch} className="h-12 rounded-l-none px-6">
              <SearchIcon className="h-5 w-5" />
            </Button>
          </InputGroup>
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={comboboxOpen}
                className="h-12 w-full justify-between font-normal md:w-56"
              >
                {selectedType
                  ? itemTypes.find((type) => type.value === selectedType)?.label
                  : "Select item type..."}
                <ChevronsUpDown className="ml-2 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 md:w-56">
              <Command>
                <CommandList>
                  <CommandEmpty>No type found.</CommandEmpty>
                  <CommandGroup>
                    {itemTypes.map((type) => (
                      <CommandItem
                        key={type.value}
                        value={type.value}
                        onSelect={(currentValue) => {
                          const matchedType = itemTypes.find(
                            (t) =>
                              t.value.toLowerCase() ===
                                currentValue.toLowerCase() ||
                              t.value === currentValue
                          )
                          const newType = matchedType
                            ? matchedType.value
                            : "All"
                          setSelectedType(newType)
                          setComboboxOpen(false)

                          // Auto trigger search on filter change
                          const params = new URLSearchParams()
                          if (searchQuery) params.set("q", searchQuery)
                          if (newType && newType !== "All")
                            params.set("type", newType)
                          setSearchParams(params, { replace: true })
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedType === type.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {type.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Results */}
      <main className="mx-auto w-full max-w-6xl flex-1 p-6 md:p-10">
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

function ItemCard({ item }) {
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
