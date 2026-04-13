import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Calendar as CalendarIcon, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
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
    {
      name: "inventory",
      label: "Inventory (total copies)",
      type: "number",
    },
  ],
  VIDEO: [
    { name: "videoName", label: "Video name", required: true },
    { name: "thumbnailImage", label: "Thumbnail image", type: "file" },
    {
      name: "videoLengthSeconds",
      label: "Video length seconds",
      type: "number",
    },
    {
      name: "monetaryValue",
      label: "Monetary value",
      type: "number",
      step: "0.01",
    },
    {
      name: "inventory",
      label: "Inventory (total copies)",
      type: "number",
    },
  ],
  AUDIO: [
    { name: "audioName", label: "Audio name", required: true },
    { name: "thumbnailImage", label: "Thumbnail image", type: "file" },
    {
      name: "audioLengthSeconds",
      label: "Audio length seconds",
      type: "number",
    },
    {
      name: "monetaryValue",
      label: "Monetary value",
      type: "number",
      step: "0.01",
    },
    {
      name: "inventory",
      label: "Inventory (total copies)",
      type: "number",
    },
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
    {
      name: "inventory",
      label: "Inventory (total copies)",
      type: "number",
    },
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

function formatPickerDate(value) {
  if (!value) return "Select a date"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function parseDateValue(value) {
  if (!value) return undefined
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toDateValue(date) {
  if (!date) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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
  const supportsGenres =
    itemType === "BOOK" || itemType === "AUDIO" || itemType === "VIDEO"

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

    fetch(`${apiBaseUrl}/api/genres/search?q=`)
      .then((response) => response.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.genres)) {
          setGenres(data.genres)
        }
      })
      .catch(() => {
        setGenres([])
      })
  }, [apiBaseUrl])

  function onTypeChange(event) {
    const nextType = event.target.value
    setItemType(nextType)
    setForm({
      ...defaultForm(nextType),
      genres:
        nextType === "BOOK" || nextType === "AUDIO" || nextType === "VIDEO"
          ? []
          : ["NOT_APPLICABLE"],
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
      if (field.required && !String(form[field.name] || "").trim()) {
        nextErrors[field.name] = `${field.label} is required.`
      }
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
          genres: supportsGenres ? form.genres : ["NOT_APPLICABLE"],
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

      if (supportsGenres) {
        const nextGenreList = [...(genres || [])]
        const existing = new Set(
          nextGenreList.map((genre) => String(genre).toLowerCase())
        )
        ;(form.genres || []).forEach((genre) => {
          const normalized = String(genre || "").trim()
          if (!normalized) return
          const key = normalized.toLowerCase()
          if (!existing.has(key)) {
            existing.add(key)
            nextGenreList.push(normalized)
          }
        })
        setGenres(nextGenreList)
      }

      setSuccess("Item added successfully.")
      setForm({
        ...defaultForm(itemType),
        genres: supportsGenres ? [] : ["NOT_APPLICABLE"],
      })
      setFileNames({})
      setFileResetKey((prev) => prev + 1)
    } catch {
      setError("Unable to connect to server.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function onMonetaryBlur(event) {
    const { name, value } = event.target
    const trimmed = String(value || "").trim()
    if (!trimmed) return

    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) return

    setForm((prev) => ({
      ...prev,
      [name]: parsed.toFixed(2),
    }))
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
              <Field data-invalid={!!fieldErrors.genres}>
                <FieldLabel>Genres</FieldLabel>
                {!supportsGenres ? (
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
                      {genreInput.trim() && genres.length > 0 && (
                        <div className="absolute top-full left-0 z-10 mt-1 flex max-h-40 w-full flex-col gap-1 overflow-auto rounded-md border bg-background p-1 shadow-md">
                          {genres
                            .filter(
                              (genre) =>
                                genre
                                  .toLowerCase()
                                  .includes(genreInput.trim().toLowerCase()) &&
                                !(form.genres || []).includes(genre)
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
                                .includes(genreInput.trim().toLowerCase()) &&
                              !(form.genres || []).includes(genre)
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
                    <div className="space-y-2 rounded-md border border-input p-2">
                      <input
                        key={`${field.name}-${fileResetKey}-${itemType}`}
                        id={field.name}
                        name={field.name}
                        type="file"
                        onChange={onChange}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <Button asChild type="button" variant="default">
                          <label
                            htmlFor={field.name}
                            className="cursor-pointer"
                          >
                            Browse file
                          </label>
                        </Button>
                        <Input
                          value={fileNames[field.name] || "No file selected"}
                          readOnly
                          className="h-10"
                        />
                      </div>
                    </div>
                  ) : field.name === "monetaryValue" ? (
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>$</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        type="number"
                        step={field.step || "0.01"}
                        min="0"
                        value={form[field.name] ?? ""}
                        onChange={onChange}
                        onBlur={onMonetaryBlur}
                        aria-invalid={!!fieldErrors[field.name]}
                      />
                    </InputGroup>
                  ) : field.type === "date" ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={`h-9 w-full justify-start text-left font-normal ${!form[field.name] ? "text-muted-foreground" : ""}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formatPickerDate(form[field.name])}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parseDateValue(form[field.name])}
                          onSelect={(date) =>
                            setForm((prev) => ({
                              ...prev,
                              [field.name]: toDateValue(date),
                            }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
