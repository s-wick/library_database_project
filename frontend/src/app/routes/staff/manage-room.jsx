import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  CheckCircle2,
  DoorOpen,
  Pencil,
  X,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { API_BASE_URL } from "@/lib/api-config"

function FeaturePill({ label, enabled }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
      {enabled ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-rose-500" />
      )}
      {label}
    </span>
  )
}

const emptyForm = {
  roomNumber: "",
  capacity: "",
  hasProjector: false,
  hasWhiteboard: false,
  hasTv: false,
}

export default function RoomManagePage() {
  const apiBaseUrl = API_BASE_URL
  const authUser = JSON.parse(sessionStorage.getItem("authUser") || "{}")
  const [rooms, setRooms] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingRoomNumber, setEditingRoomNumber] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingRoomNumber, setDeletingRoomNumber] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const isEditing = Boolean(editingRoomNumber)

  const roomCountLabel = useMemo(() => {
    if (rooms.length === 1) return "1 room available for booking"
    return `${rooms.length} rooms available for booking`
  }, [rooms.length])

  async function fetchRooms() {
    setLoading(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/rooms`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "Failed to load rooms.")
      }
      setRooms(data.rooms || [])
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load rooms.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  if (authUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <Button asChild variant="outline">
            <Link to="/management-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Access denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Only system administrators can manage room inventory.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setFieldErrors((prev) => ({ ...prev, [name]: "" }))
    setError("")
    setSuccess("")

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingRoomNumber("")
    setFieldErrors({})
  }

  function handleEditRoom(room) {
    setEditingRoomNumber(room.roomNumber)
    setForm({
      roomNumber: room.roomNumber,
      capacity: String(room.capacity),
      hasProjector: Boolean(room.features?.hasProjector),
      hasWhiteboard: Boolean(room.features?.hasWhiteboard),
      hasTv: Boolean(room.features?.hasTv),
    })
    setFieldErrors({})
    setError("")
    setSuccess("")
  }

  function handleCancelEdit() {
    resetForm()
    setError("")
    setSuccess("")
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFieldErrors({})
    setError("")
    setSuccess("")

    const nextErrors = {}
    const normalizedRoomNumber = String(form.roomNumber || "").trim()
    const capacityValue = Number(form.capacity)

    if (!normalizedRoomNumber) {
      nextErrors.roomNumber = "Room number is required."
    }

    if (!Number.isInteger(capacityValue) || capacityValue <= 0) {
      nextErrors.capacity = "Capacity must be a positive whole number."
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return
    }

    setSubmitting(true)
    try {
      const targetRoomNumber = encodeURIComponent(editingRoomNumber)
      const response = await fetch(
        isEditing
          ? `${apiBaseUrl}/api/rooms/${targetRoomNumber}`
          : `${apiBaseUrl}/api/rooms`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomNumber: normalizedRoomNumber,
            capacity: capacityValue,
            hasProjector: form.hasProjector,
            hasWhiteboard: form.hasWhiteboard,
            hasTv: form.hasTv,
          }),
        }
      )

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (response.status === 409) {
          setFieldErrors({
            roomNumber:
              data.message || "A room with this number already exists.",
          })
          return
        }

        setError(
          data.message ||
            (isEditing ? "Failed to update room." : "Failed to create room.")
        )
        return
      }

      setSuccess(
        isEditing ? "Room updated successfully." : "Room added successfully."
      )
      resetForm()
      await fetchRooms()
    } catch {
      setError("Unable to connect to server.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteRoom(roomNumber) {
    const shouldDelete = window.confirm(
      `Delete room ${roomNumber}? This cannot be undone.`
    )
    if (!shouldDelete) {
      return
    }

    setDeletingRoomNumber(roomNumber)
    setError("")
    setSuccess("")
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/rooms/${encodeURIComponent(roomNumber)}`,
        {
          method: "DELETE",
        }
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.message || "Failed to delete room.")
        return
      }

      if (editingRoomNumber === roomNumber) {
        resetForm()
      }

      setSuccess("Room deleted successfully.")
      await fetchRooms()
    } catch {
      setError("Unable to connect to server.")
    } finally {
      setDeletingRoomNumber("")
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Button asChild variant="outline">
          <Link to="/management-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "Edit room" : "Manage rooms"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {isEditing
                  ? "Update room details, then save them back to the booking catalog."
                  : "Add study rooms for the booking page. New rooms become available to users as soon as they are saved."}
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <Field data-invalid={!!fieldErrors.roomNumber}>
                  <FieldLabel htmlFor="roomNumber">Room number</FieldLabel>
                  <Input
                    id="roomNumber"
                    name="roomNumber"
                    type="text"
                    value={form.roomNumber}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.roomNumber}
                    required
                  />
                  <FieldError>{fieldErrors.roomNumber}</FieldError>
                </Field>

                <Field data-invalid={!!fieldErrors.capacity}>
                  <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    step="1"
                    value={form.capacity}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.capacity}
                    required
                  />
                  <FieldError>{fieldErrors.capacity}</FieldError>
                </Field>

                <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                  <input
                    name="hasProjector"
                    type="checkbox"
                    checked={form.hasProjector}
                    onChange={handleChange}
                  />
                  <span>Has projector</span>
                </label>

                <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                  <input
                    name="hasWhiteboard"
                    type="checkbox"
                    checked={form.hasWhiteboard}
                    onChange={handleChange}
                  />
                  <span>Has whiteboard</span>
                </label>

                <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                  <input
                    name="hasTv"
                    type="checkbox"
                    checked={form.hasTv}
                    onChange={handleChange}
                  />
                  <span>Has TV</span>
                </label>

                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? isEditing
                      ? "Saving changes..."
                      : "Saving room..."
                    : isEditing
                      ? "Save changes"
                      : "Add room"}
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}

                {!!error && <p className="text-sm text-rose-600">{error}</p>}
                {!!success && (
                  <p className="text-sm text-emerald-600">{success}</p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current rooms</CardTitle>
              <p className="text-sm text-muted-foreground">{roomCountLabel}</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                  Loading rooms...
                </div>
              ) : rooms.length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                  No rooms are configured yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map((room) => (
                    <div
                      key={room.roomNumber}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="flex items-center gap-2 font-semibold">
                            <DoorOpen className="h-4 w-4 text-primary" />
                            Room {room.roomNumber}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Floor {room.floor} | Capacity {room.capacity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handleEditRoom(room)}
                            disabled={
                              submitting ||
                              deletingRoomNumber === room.roomNumber
                            }
                            aria-label={`Edit room ${room.roomNumber}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => handleDeleteRoom(room.roomNumber)}
                            disabled={
                              deletingRoomNumber === room.roomNumber ||
                              submitting
                            }
                            aria-label={`Delete room ${room.roomNumber}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <FeaturePill label="TV" enabled={room.features.hasTv} />
                        <FeaturePill
                          label="Projector"
                          enabled={room.features.hasProjector}
                        />
                        <FeaturePill
                          label="Whiteboard"
                          enabled={room.features.hasWhiteboard}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
