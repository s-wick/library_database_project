import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    itemsInStock: values.itemsInStock,
    thumbnailImage: values.thumbnailImage,
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
    itemsInStock: item.in_stock ?? item.items_in_stock ?? "",
    author: item.author || "",
    edition: item.edition || "",
    publication: item.publication || "",
    publicationDate: item.publication_date
      ? String(item.publication_date).slice(0, 10)
      : "",
    videoLengthSeconds: item.video_length_seconds || "",
    audioLengthSeconds: item.audio_length_seconds || "",
    thumbnailImage: "",
  }
}

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
    } catch {
      setError("Unable to connect to server.")
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems("")
  }, [])

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
            {mode === "remove" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-md border p-3">
                  {(items || []).map((item) => (
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
                        {item.standard_type} • Stock: {item.in_stock}
                      </p>
                    </button>
                  ))}
                  {!items.length && (
                    <p className="text-sm text-muted-foreground">
                      No items found.
                    </p>
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
                          <span className="font-medium">In stock:</span>{" "}
                          {selected.in_stock}
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
                  {(items || []).map((item) => (
                    <button
                      key={item.item_id}
                      type="button"
                      onClick={() => {
                        setSelected(item)
                        setForm(getInitialForm(item))
                      }}
                      className={`w-full rounded-md border px-3 py-2 text-left transition hover:bg-muted/30 ${
                        selected?.item_id === item.item_id
                          ? "border-primary"
                          : ""
                      }`}
                    >
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.standard_type} • Stock: {item.in_stock}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="rounded-md border p-3">
                  {!selected ? (
                    <p className="text-sm text-muted-foreground">
                      Select an item to edit.
                    </p>
                  ) : (
                    <form className="space-y-3" onSubmit={handleUpdate}>
                      {selected.thumbnail_image ? (
                        <img
                          src={selected.thumbnail_image}
                          alt={selected.title}
                          className="h-24 w-24 rounded object-cover"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded bg-muted" />
                      )}

                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          const dataUrl = await fileToDataUrl(file)
                          setForm((prev) => ({
                            ...prev,
                            thumbnailImage: dataUrl,
                          }))
                        }}
                      />

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
                      <Input
                        type="number"
                        value={form.itemsInStock || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            itemsInStock: e.target.value,
                          }))
                        }
                        placeholder="Items in stock"
                      />

                      {selected.item_type_code === 1 && (
                        <>
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
                          <Input
                            type="date"
                            value={form.publicationDate || ""}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                publicationDate: e.target.value,
                              }))
                            }
                          />
                        </>
                      )}

                      {selected.item_type_code === 2 && (
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
                      )}

                      {selected.item_type_code === 3 && (
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
