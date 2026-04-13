import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowLeft, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { API_BASE_URL } from "@/lib/api-config"

function getEditPayload(item, values) {
  const base = {
    title: values.title,
    monetaryValue: values.monetaryValue,
    inventory: values.inventory,
    genres: values.genres,
  }

  if (values.thumbnailImage) {
    base.thumbnailImage = values.thumbnailImage
  }

  if (item.item_type_code === 1) {
    return {
      ...base,
      author: values.author,
      edition: values.edition,
      publication: values.publication,
      publicationDate: values.publicationDate,
    }
  }

  if (item.item_type_code === 2) {
    return {
      ...base,
      videoLengthSeconds: values.videoLengthSeconds,
    }
  }

  if (item.item_type_code === 3) {
    return {
      ...base,
      audioLengthSeconds: values.audioLengthSeconds,
    }
  }

  return base
}

function getInitialForm(item) {
  return {
    title: item.title || "",
    monetaryValue: item.monetary_value ?? item.monetaryValue ?? "",
    inventory: item.inventory ?? "",
    stock: item.stock ?? "",
    author: item.author || "",
    edition: item.edition || "",
    publication: item.publication || "",
    publicationDate: item.publication_date
      ? String(item.publication_date).slice(0, 10)
      : "",
    videoLengthSeconds: item.video_length_seconds || "",
    audioLengthSeconds: item.audio_length_seconds || "",
    genres: Array.isArray(item.genres) ? item.genres : [],
    thumbnailImage: "",
  }
}

function toDateInputValue(value) {
  if (!value) return ""
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const todayDate = new Date().toISOString().slice(0, 10)

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ManageItemsPage() {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get("mode") === "remove" ? "remove" : "edit"

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedImageName, setSelectedImageName] = useState("")
  const [genreInput, setGenreInput] = useState("")
  const [genres, setGenres] = useState([])

  const pageSize = 8
  const skeletonRows = Array.from({ length: pageSize }, (_, index) => index)

  async function loadItems(search = "") {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/items/search?q=${encodeURIComponent(search)}&type=All`
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.message || "Failed to load items.")
        setItems([])
        return
      }
      setItems(data.items || [])
      setCurrentPage(1)
    } catch {
      setError("Unable to connect to server.")
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems("")

    fetch(`${API_BASE_URL}/api/genres/search?q=`)
      .then((response) => response.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.genres)) {
          setGenres(data.genres)
        }
      })
      .catch(() => {
        setGenres([])
      })
  }, [])

  const totalPages = Math.max(1, Math.ceil((items || []).length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const pagedItems = (items || []).slice(startIndex, startIndex + pageSize)

  async function handleDelete(itemId) {
    setIsSubmitting(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
        method: "DELETE",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.message || "Failed to remove item.")
        return
      }

      setSuccess("Item removed successfully.")
      if (selected?.item_id === itemId) {
        setSelected(null)
        setForm({})
      }
      await loadItems(query)
    } catch {
      setError("Unable to connect to server.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate(event) {
    event.preventDefault()
    if (!selected) return

    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const payload = getEditPayload(selected, form)
      const response = await fetch(
        `${API_BASE_URL}/api/items/${selected.item_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.message || "Failed to update item.")
        return
      }

      setSuccess("Item updated successfully.")
      await loadItems(query)
    } catch {
      setError("Unable to connect to server.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSelectEditItem(item) {
    setSelected(item)
    setForm(getInitialForm(item))
    setSelectedImageName("")
    setGenreInput("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${item.item_id}`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.item) return

      setSelected(data.item)
      setForm(getInitialForm(data.item))
    } catch {
      // Keep base list item details loaded if detail request fails.
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Button asChild variant="outline">
          <Link to="/management-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "remove" ? "Remove items" : "Edit items"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search items..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Button onClick={() => loadItems(query)} disabled={loading}>
                {loading ? "Loading..." : "Search"}
              </Button>
            </div>
            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                {success}
              </p>
            )}
            {mode === "remove" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-md border p-3">
                  {loading
                    ? skeletonRows.map((row) => (
                        <div
                          key={`skeleton-${row}`}
                          className="space-y-2 rounded-md border px-3 py-2"
                        >
                          <Skeleton className="h-4 w-4/5" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      ))
                    : pagedItems.map((item) => (
                        <button
                          key={item.item_id}
                          type="button"
                          onClick={() => setSelected(item)}
                          className={`w-full rounded-md border px-3 py-2 text-left transition hover:bg-muted/30 ${
                            selected?.item_id === item.item_id
                              ? "border-primary"
                              : ""
                          }`}
                        >
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.standard_type} • Stock: {item.stock}
                          </p>
                        </button>
                      ))}
                  {!pagedItems.length && (
                    <p className="text-sm text-muted-foreground">
                      No items found.
                    </p>
                  )}
                  {!!items.length && (
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage <= 1}
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage >= totalPages}
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            )
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-md border p-3">
                  {!selected ? (
                    <p className="text-sm text-muted-foreground">
                      Select an item to review details and remove.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selected.thumbnail_image ? (
                        <img
                          src={selected.thumbnail_image}
                          alt={selected.title}
                          className="h-28 w-28 rounded object-cover"
                        />
                      ) : (
                        <div className="h-28 w-28 rounded bg-muted" />
                      )}

                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Title:</span>{" "}
                          {selected.title}
                        </p>
                        <p>
                          <span className="font-medium">Type:</span>{" "}
                          {selected.standard_type}
                        </p>
                        <p>
                          <span className="font-medium">Stock:</span>{" "}
                          {selected.stock}
                        </p>
                        <p>
                          <span className="font-medium">Inventory:</span>{" "}
                          {selected.inventory}
                        </p>
                        <p>
                          <span className="font-medium">Value:</span>{" "}
                          {selected.monetary_value}
                        </p>

                        {selected.item_type_code === 1 && (
                          <>
                            <p>
                              <span className="font-medium">Author:</span>{" "}
                              {selected.author || "-"}
                            </p>
                            <p>
                              <span className="font-medium">Edition:</span>{" "}
                              {selected.edition || "-"}
                            </p>
                            <p>
                              <span className="font-medium">Publication:</span>{" "}
                              {selected.publication || "-"}
                            </p>
                            <p>
                              <span className="font-medium">
                                Publication date:
                              </span>{" "}
                              {selected.publication_date
                                ? String(selected.publication_date).slice(0, 10)
                                : "-"}
                            </p>
                          </>
                        )}

                        {selected.item_type_code === 2 && (
                          <p>
                            <span className="font-medium">Video length:</span>{" "}
                            {selected.video_length_seconds || 0} seconds
                          </p>
                        )}

                        {selected.item_type_code === 3 && (
                          <p>
                            <span className="font-medium">Audio length:</span>{" "}
                            {selected.audio_length_seconds || 0} seconds
                          </p>
                        )}
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" disabled={isSubmitting}>
                            Remove item
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete item</DialogTitle>
                            <DialogDescription>
                              Remove "{selected.title}" from the catalog? This
                              action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="destructive"
                              onClick={() => handleDelete(selected.item_id)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? "Deleting..." : "Confirm delete"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-md border p-3">
                  {loading
                    ? skeletonRows.map((row) => (
                        <div
                          key={`skeleton-${row}`}
                          className="space-y-2 rounded-md border px-3 py-2"
                        >
                          <Skeleton className="h-4 w-4/5" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      ))
                    : pagedItems.map((item) => (
                        <button
                          key={item.item_id}
                          type="button"
                          onClick={() => handleSelectEditItem(item)}
                          className={`w-full rounded-md border px-3 py-2 text-left transition hover:bg-muted/30 ${
                            selected?.item_id === item.item_id
                              ? "border-primary"
                              : ""
                          }`}
                        >
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.standard_type} • Stock: {item.stock}
                          </p>
                        </button>
                      ))}
                  {!pagedItems.length && (
                    <p className="text-sm text-muted-foreground">
                      No items found.
                    </p>
                  )}
                  {!!items.length && (
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage <= 1}
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage >= totalPages}
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            )
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-md border p-3">
                  {!selected ? (
                    <p className="text-sm text-muted-foreground">
                      Select an item to edit.
                    </p>
                  ) : (
                    <form className="space-y-3" onSubmit={handleUpdate}>
                      {form.thumbnailImage || selected.thumbnail_image ? (
                        <img
                          src={form.thumbnailImage || selected.thumbnail_image}
                          alt={selected.title}
                          className="h-24 w-24 rounded object-cover"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded bg-muted" />
                      )}

                      <div className="space-y-2">
                        <input
                          id="item-thumbnail-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (event) => {
                            const file = event.target.files?.[0]
                            if (!file) return
                            try {
                              const dataUrl = await fileToDataUrl(file)
                              setForm((prev) => ({
                                ...prev,
                                thumbnailImage: dataUrl,
                              }))
                              setSelectedImageName(file.name)
                            } catch {
                              setError("Failed to load image preview.")
                            }
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="item-thumbnail-upload"
                            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                          >
                            Browse image
                          </label>
                          <div className="flex-1 rounded-md border border-input px-3 py-2 text-sm text-muted-foreground">
                            {selectedImageName ||
                              (selected.thumbnail_image
                                ? "Using current image"
                                : "No file selected")}
                          </div>
                        </div>
                      </div>

                      <Field>
                        <FieldLabel>Title</FieldLabel>
                        <Input
                          value={form.title || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Title"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Monetary value</FieldLabel>
                        <Input
                          type="number"
                          value={form.monetaryValue || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              monetaryValue: e.target.value,
                            }))
                          }
                          placeholder="Monetary value"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Computed stock</FieldLabel>
                        <Input
                          value={String(form.stock ?? "")}
                          readOnly
                          disabled
                          placeholder="Computed stock"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Inventory (total copies)</FieldLabel>
                        <Input
                          type="number"
                          min="0"
                          max="255"
                          value={form.inventory || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              inventory: e.target.value,
                            }))
                          }
                          placeholder="Inventory (total copies)"
                        />
                      </Field>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {(form.genres || []).map((genre) => (
                            <Badge
                              key={genre}
                              variant="secondary"
                              className="px-2 py-1"
                            >
                              {genre}
                              <button
                                type="button"
                                className="ml-2 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    genres: (prev.genres || []).filter(
                                      (entry) => entry !== genre
                                    ),
                                  }))
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="relative">
                          <Input
                            value={genreInput}
                            onChange={(e) => setGenreInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                const value = genreInput.trim()
                                if (
                                  value &&
                                  !(form.genres || []).includes(value)
                                ) {
                                  setForm((prev) => ({
                                    ...prev,
                                    genres: [...(prev.genres || []), value],
                                  }))
                                  setGenreInput("")
                                }
                              }
                            }}
                            placeholder="Type a genre and press Enter..."
                          />
                          {genreInput.trim() && genres.length > 0 && (
                            <div className="absolute top-full left-0 z-10 mt-1 flex max-h-40 w-full flex-col gap-1 overflow-auto rounded-md border bg-card p-1 shadow-md">
                              {genres
                                .filter(
                                  (genre) =>
                                    genre
                                      .toLowerCase()
                                      .includes(
                                        genreInput.trim().toLowerCase()
                                      ) && !(form.genres || []).includes(genre)
                                )
                                .map((genre) => (
                                  <button
                                    key={genre}
                                    type="button"
                                    className="rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                                    onClick={() => {
                                      setForm((prev) => ({
                                        ...prev,
                                        genres: [...(prev.genres || []), genre],
                                      }))
                                      setGenreInput("")
                                    }}
                                  >
                                    {genre}
                                  </button>
                                ))}
                              {genres.filter(
                                (genre) =>
                                  genre
                                    .toLowerCase()
                                    .includes(
                                      genreInput.trim().toLowerCase()
                                    ) && !(form.genres || []).includes(genre)
                              ).length === 0 && (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  Press enter to add "{genreInput.trim()}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {selected.item_type_code === 1 && (
                        <>
                          <Field>
                            <FieldLabel>Author</FieldLabel>
                            <Input
                              value={form.author || ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  author: e.target.value,
                                }))
                              }
                              placeholder="Author"
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Edition</FieldLabel>
                            <Input
                              value={form.edition || ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  edition: e.target.value,
                                }))
                              }
                              placeholder="Edition"
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Publication</FieldLabel>
                            <Input
                              value={form.publication || ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  publication: e.target.value,
                                }))
                              }
                              placeholder="Publication"
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Publication date</FieldLabel>
                            <Input
                              type="date"
                              value={toDateInputValue(form.publicationDate)}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  publicationDate: e.target.value,
                                }))
                              }
                              max={todayDate}
                            />
                          </Field>
                        </>
                      )}

                      {selected.item_type_code === 2 && (
                        <Field>
                          <FieldLabel>Video length (seconds)</FieldLabel>
                          <Input
                            type="number"
                            value={form.videoLengthSeconds || ""}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                videoLengthSeconds: e.target.value,
                              }))
                            }
                            placeholder="Video length (seconds)"
                          />
                        </Field>
                      )}

                      {selected.item_type_code === 3 && (
                        <Field>
                          <FieldLabel>Audio length (seconds)</FieldLabel>
                          <Input
                            type="number"
                            value={form.audioLengthSeconds || ""}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                audioLengthSeconds: e.target.value,
                              }))
                            }
                            placeholder="Audio length (seconds)"
                          />
                        </Field>
                      )}

                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save changes"}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
