import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/api-config"

const itemFields = {
  BOOK: [
    { name: "title", label: "Title", required: true },
    { name: "author", label: "Author", required: true },
    { name: "edition", label: "Edition" },
    { name: "publication", label: "Publication" },
    { name: "publicationDate", label: "Publication date", type: "date" },
    { name: "thumbnailImage", label: "Thumbnail image", type: "file" },
    {
      name: "monetaryValue",
      label: "Monetary value",
      type: "number",
      step: "0.01",
    },
    { name: "booksInStock", label: "Books in stock", type: "number" },
  ],
  VIDEO: [
    { name: "videoName", label: "Video name", required: true },
    { name: "thumbnailImage", label: "Thumbnail image", type: "file" },
    {
      name: "videoLengthSeconds",
      label: "Video length seconds",
      type: "number",
    },
    { name: "videoFile", label: "Video file", type: "file" },
    {
      name: "monetaryValue",
      label: "Monetary value",
      type: "number",
      step: "0.01",
    },
    { name: "videosInStock", label: "Videos in stock", type: "number" },
  ],
  AUDIO: [
    { name: "audioName", label: "Audio name", required: true },
    { name: "thumbnailImage", label: "Thumbnail image", type: "file" },
    {
      name: "audioLengthSeconds",
      label: "Audio length seconds",
      type: "number",
    },
    { name: "audioFile", label: "Audio file", type: "file" },
    {
      name: "monetaryValue",
      label: "Monetary value",
      type: "number",
      step: "0.01",
    },
    { name: "audiosInStock", label: "Audios in stock", type: "number" },
  ],
  RENTAL_EQUIPMENT: [
    { name: "rentalName", label: "Rental name", required: true },
    { name: "thumbnailImage", label: "Thumbnail image", type: "file" },
    {
      name: "monetaryValue",
      label: "Monetary value",
      type: "number",
      step: "0.01",
    },
    { name: "equipmentInStock", label: "Equipment in stock", type: "number" },
  ],
}

function defaultForm(type) {
  const fields = itemFields[type] || []
  const next = {}
  fields.forEach((field) => {
    next[field.name] = ""
  })
  return next
}

function formatItemTypeLabel(value = "") {
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default function AddItemPage() {
  const apiBaseUrl = API_BASE_URL
  const [itemTypes, setItemTypes] = useState([])
  const [genres, setGenres] = useState([])
  const [itemType, setItemType] = useState("")
  const [form, setForm] = useState({})
  const [genreInput, setGenreInput] = useState("")
  const [fileNames, setFileNames] = useState({})
  const [fileResetKey, setFileResetKey] = useState(0)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const fields = useMemo(() => itemFields[itemType] || [], [itemType])
  const isBook = itemType === "BOOK"

  useEffect(() => {
    const types = [
      { itemCode: 1, itemType: "BOOK" },
      { itemCode: 2, itemType: "VIDEO" },
      { itemCode: 3, itemType: "AUDIO" },
      { itemCode: 4, itemType: "RENTAL_EQUIPMENT" },
    ]

    setItemTypes(types)
    setGenres([])
    setItemType(types[0].itemType)
    setForm({
      ...defaultForm(types[0].itemType),
      genres: [],
    })
  }, [apiBaseUrl])

  function onTypeChange(event) {
    const nextType = event.target.value
    setItemType(nextType)
    setForm({
      ...defaultForm(nextType),
      genres: nextType !== "BOOK" ? ["NOT_APPLICABLE"] : [],
    })
    setFieldErrors({})
    setFileNames({})
    setFileResetKey((prev) => prev + 1)
    setError("")
    setSuccess("")
  }

  async function onChange(event) {
    const { name, value, files, type } = event.target
    setFieldErrors((prev) => ({ ...prev, [name]: "" }))
    if (type === "file") {
      const file = files?.[0]
      if (!file) {
        setForm((prev) => ({ ...prev, [name]: "" }))
        setFileNames((prev) => ({ ...prev, [name]: "" }))
        return
      }
      setFileNames((prev) => ({ ...prev, [name]: file.name }))
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ""))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      setForm((prev) => ({ ...prev, [name]: dataUrl }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setFieldErrors({})
    setError("")
    setSuccess("")

    const nextErrors = {}
    for (const field of fields) {
      if (!String(form[field.name] || "").trim()) {
        nextErrors[field.name] = `${field.label} is required.`
      }
    }
    if (!!isBook && (!form.genres || form.genres.length === 0)) {
      nextErrors.genres = "Genre is required."
    }
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemType,
          createdAt: todayDate,
          ...form,
          genres: !isBook ? ["NOT_APPLICABLE"] : form.genres,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (response.status === 401) {
          setError("Unauthorized access. Please sign in again.")
          return
        }
        setError(data.message || "Failed to add item.")
        return
      }
      setSuccess("Item added successfully.")
      setForm({
        ...defaultForm(itemType),
        genres: !isBook ? ["NOT_APPLICABLE"] : [],
      })
      setFileNames({})
      setFileResetKey((prev) => prev + 1)
    } catch {
      setError("Unable to connect to server.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Button asChild variant="outline">
          <Link to="/management-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Add item</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <Field>
                <FieldLabel htmlFor="itemType">Item type</FieldLabel>
                <select
                  id="itemType"
                  value={itemType}
                  onChange={onTypeChange}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                >
                  {itemTypes.map((type) => (
                    <option key={type.itemCode} value={type.itemType}>
                      {formatItemTypeLabel(type.itemType)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="createdAt">Created at</FieldLabel>
                <Input
                  id="createdAt"
                  type="date"
                  value={todayDate}
                  readOnly
                  className="cursor-not-allowed bg-muted/40 text-muted-foreground"
                />
              </Field>
              <Field data-invalid={!!fieldErrors.genres}>
                <FieldLabel>Genres</FieldLabel>
                {!isBook ? (
                  <Input value="Not applicable" disabled className="h-9" />
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {(form.genres || []).map((g) => (
                        <Badge
                          key={g}
                          variant="secondary"
                          className="px-2 py-1"
                        >
                          {g}
                          <button
                            type="button"
                            className="ml-2 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                genres: (prev.genres || []).filter(
                                  (x) => x !== g
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
                            const val = genreInput.trim()
                            if (val && !(form.genres || []).includes(val)) {
                              setForm((prev) => ({
                                ...prev,
                                genres: [...(prev.genres || []), val],
                              }))
                              setGenreInput("")
                            }
                          }
                        }}
                        placeholder="Type a genre and press Enter..."
                      />
                      {genreInput.trim() && Object.keys(genres).length > 0 && (
                        <div className="absolute top-full left-0 z-10 mt-1 flex max-h-40 w-full flex-col gap-1 overflow-auto rounded-md border bg-background p-1 shadow-md">
                          {genres
                            .filter(
                              (g) =>
                                g.genreName
                                  .toLowerCase()
                                  .includes(genreInput.trim().toLowerCase()) &&
                                !(form.genres || []).includes(g.genreName)
                            )
                            .map((g) => (
                              <button
                                key={g.genreName}
                                type="button"
                                className="rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    genres: [
                                      ...(prev.genres || []),
                                      g.genreName,
                                    ],
                                  }))
                                  setGenreInput("")
                                }}
                              >
                                {g.genreName}
                              </button>
                            ))}
                          {genres.filter(
                            (g) =>
                              g.genreName
                                .toLowerCase()
                                .includes(genreInput.trim().toLowerCase()) &&
                              !(form.genres || []).includes(g.genreName)
                          ).length === 0 && (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              Press enter to add "{genreInput.trim()}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <FieldError>{fieldErrors.genres}</FieldError>
              </Field>

              {fields.map((field) => (
                <Field
                  key={field.name}
                  data-invalid={!!fieldErrors[field.name]}
                >
                  <FieldLabel htmlFor={field.name}>{field.label}</FieldLabel>
                  {field.type === "file" ? (
                    <div className="rounded-md border border-input p-2">
                      <input
                        key={`${field.name}-${fileResetKey}-${itemType}`}
                        id={field.name}
                        name={field.name}
                        type="file"
                        onChange={onChange}
                        className="w-full cursor-pointer text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      <p className="mt-2 truncate text-xs text-muted-foreground">
                        {fileNames[field.name] || "No file selected"}
                      </p>
                    </div>
                  ) : (
                    <Input
                      id={field.name}
                      name={field.name}
                      type={field.type || "text"}
                      step={field.step}
                      value={form[field.name] ?? ""}
                      onChange={onChange}
                      aria-invalid={!!fieldErrors[field.name]}
                      className={
                        field.name === "publicationDate" && !form[field.name]
                          ? "text-muted-foreground"
                          : ""
                      }
                    />
                  )}
                  <FieldError>{fieldErrors[field.name]}</FieldError>
                </Field>
              ))}

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

              <Button type="submit" disabled={isSubmitting || !itemType}>
                Add item
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
