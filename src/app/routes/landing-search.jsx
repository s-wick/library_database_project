import React, { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
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

// Background image import
import bgImage from "@/assets/library-hero.png"

// Placeholder library data
const libraryBooks = [
  {
    id: 1,
    title: "The Silent Cosmos",
    author: "Elena Vance",
    genre: "Science Fiction",
    description:
      "A profound journey to the edge of the known universe, questioning what lies beyond.",
    availability: "Available",
  },
  {
    id: 2,
    title: "Echoes of the Past",
    author: "Julian Thorne",
    genre: "Historical Fiction",
    description:
      "A haunting tale set during the twilight years of the Roman Empire.",
    availability: "Checked Out",
  },
  {
    id: 3,
    title: "Algorithms in Nature",
    author: "Dr. Maya Lin",
    genre: "Non-Fiction",
    description:
      "Discovering computational patterns in biological ecosystems and plant growth.",
    availability: "Available",
  },
  {
    id: 4,
    title: "Whispers in the Dark",
    author: "Arthur Pendelton",
    genre: "Mystery",
    description:
      "A small-town detective uncovers secrets that the locals would rather keep buried.",
    availability: "Available",
  },
  {
    id: 5,
    title: "Mastering React",
    author: "Jordan Walke",
    genre: "Education",
    description:
      "An advanced guide to building scalable single page applications.",
    availability: "Waitlist",
  },
  {
    id: 6,
    title: "The Last Horizon",
    author: "Sarah Jenkins",
    genre: "Fantasy",
    description:
      "In a world where magic is fading, one young mage must find the source of the draining power.",
    availability: "Available",
  },
]

export default function LandingSearchPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter books based on title, author, or genre
  const filteredBooks = libraryBooks.filter((book) => {
    const lowerCaseQuery = searchQuery.toLowerCase()
    return (
      book.title.toLowerCase().includes(lowerCaseQuery) ||
      book.author.toLowerCase().includes(lowerCaseQuery) ||
      book.genre.toLowerCase().includes(lowerCaseQuery)
    )
  })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section with Background Image */}
      <div
        className="relative flex h-[400px] items-center justify-center p-6"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 z-0 bg-black/60"></div>

        <div className="relative z-10 w-full max-w-2xl px-4 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Discover Your Next Read
          </h1>
          <p className="mb-8 text-lg text-slate-200">
            Search books, audiobooks, and resources in our catalog.
          </p>

          {/* Search Bar */}
          <div className="relative mx-auto flex max-w-xl items-center overflow-hidden rounded-md shadow-lg">
            <div className="absolute left-3 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <Input
              type="text"
              placeholder="Search by title, author, or genre..."
              className="text-md h-14 w-full rounded-r-none border-0 bg-white pl-10 text-black focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button className="text-md h-14 rounded-l-none px-8 font-semibold">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content / Results */}
      <main className="mx-auto w-full max-w-6xl flex-1 p-6 md:p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            {searchQuery
              ? `Search Results for "${searchQuery}"`
              : "Featured Titles"}
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
              No books found
            </h3>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your search terms or browsing our categories.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
