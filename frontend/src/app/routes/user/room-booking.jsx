import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, XCircle, DoorOpen } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { API_BASE_URL } from "@/lib/api-config"

const SLOT_INTERVAL_MINUTES = 30
const SLOT_INTERVAL_MS = SLOT_INTERVAL_MINUTES * 60 * 1000
const MAX_BOOKING_MINUTES = 180
const ADVANCE_WINDOW_MS = 24 * 60 * 60 * 1000

function roundUpToNextSlot(date) {
  const next = new Date(date)
  next.setSeconds(0, 0)

  const remainder = next.getMinutes() % SLOT_INTERVAL_MINUTES
  if (remainder !== 0) {
    next.setMinutes(next.getMinutes() + (SLOT_INTERVAL_MINUTES - remainder))
  }

  return next
}

function formatSlotLabel(value) {
  return new Date(value).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function FeatureRow({ label, enabled }) {
  return (
    <li className="flex items-center gap-2 text-sm text-muted-foreground">
      {enabled ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      ) : (
        <XCircle className="h-4 w-4 text-rose-500" />
      )}
      <span>{label}</span>
    </li>
  )
}

export default function RoomBookingPage() {
  const apiBaseUrl = API_BASE_URL

  const [rooms, setRooms] = useState([])
  const [activeBooking, setActiveBooking] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState("")
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [startAt, setStartAt] = useState("")
  const [availability, setAvailability] = useState({
    bookings: [],
    windowStart: "",
    windowEnd: "",
  })
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [availabilityError, setAvailabilityError] = useState("")

  const selectedRoomDetails = useMemo(
    () => rooms.find((room) => room.roomNumber === selectedRoom) || null,
    [rooms, selectedRoom]
  )

  const user = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("user")
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError("")

    try {
      const roomRes = await fetch(`${apiBaseUrl}/api/rooms`)
      if (!roomRes.ok) throw new Error("Failed to load rooms")
      const roomData = await roomRes.json()
      const nextRooms = roomData.rooms || []
      setRooms(nextRooms)

      if (user?.id) {
        const bookingRes = await fetch(
          `${apiBaseUrl}/api/rooms/my-booking?userId=${user.id}`
        )
        if (bookingRes.ok) {
          const bookingData = await bookingRes.json()
          setActiveBooking(bookingData.booking || null)
        }
      }

      if (nextRooms.length === 0) {
        setSelectedRoom("")
      } else if (
        !selectedRoom ||
        !nextRooms.some((room) => room.roomNumber === selectedRoom)
      ) {
        setSelectedRoom(nextRooms[0].roomNumber)
      }
    } catch (err) {
      setError(err.message || "Failed to load room booking data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedRoom) {
      setAvailability({ bookings: [], windowStart: "", windowEnd: "" })
      setAvailabilityError("")
      return
    }

    let cancelled = false

    const fetchAvailability = async () => {
      setAvailabilityLoading(true)
      setAvailabilityError("")

      try {
        const res = await fetch(
          `${apiBaseUrl}/api/rooms/availability?roomNumber=${encodeURIComponent(selectedRoom)}`
        )
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(data.message || "Failed to load room availability")
        }

        if (!cancelled) {
          setAvailability({
            bookings: data.bookings || [],
            windowStart: data.windowStart || "",
            windowEnd: data.windowEnd || "",
          })
        }
      } catch (err) {
        if (!cancelled) {
          setAvailability({ bookings: [], windowStart: "", windowEnd: "" })
          setAvailabilityError(
            err.message || "Failed to load room availability"
          )
        }
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false)
        }
      }
    }

    fetchAvailability()

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, availabilityRefreshKey, selectedRoom])

  const availableStartSlots = useMemo(() => {
    if (!selectedRoom || availabilityError) return []

    const fallbackStart = new Date(Date.now())
    const fallbackEnd = new Date(Date.now() + ADVANCE_WINDOW_MS)
    const windowStart = availability.windowStart
      ? new Date(availability.windowStart)
      : fallbackStart
    const windowEnd = availability.windowEnd
      ? new Date(availability.windowEnd)
      : fallbackEnd

    if (
      Number.isNaN(windowStart.getTime()) ||
      Number.isNaN(windowEnd.getTime()) ||
      windowStart >= windowEnd
    ) {
      return []
    }

    const bookings = availability.bookings
      .map((booking) => ({
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
      }))
      .filter(
        (booking) =>
          !Number.isNaN(booking.start.getTime()) &&
          !Number.isNaN(booking.end.getTime())
      )

    const earliestCandidate = new Date(
      Math.max(windowStart.getTime(), Date.now() + 60 * 1000)
    )
    const firstSlot = roundUpToNextSlot(earliestCandidate)
    const slots = []

    for (
      let cursor = firstSlot.getTime();
      cursor + SLOT_INTERVAL_MS <= windowEnd.getTime();
      cursor += SLOT_INTERVAL_MS
    ) {
      const slotStart = new Date(cursor)
      const slotEnd = new Date(cursor + SLOT_INTERVAL_MS)
      const overlaps = bookings.some(
        (booking) => booking.start < slotEnd && booking.end > slotStart
      )

      if (!overlaps) {
        slots.push({
          value: slotStart.toISOString(),
          label: formatSlotLabel(slotStart),
        })
      }
    }

    return slots
  }, [
    availability.bookings,
    availability.windowEnd,
    availability.windowStart,
    availabilityError,
    selectedRoom,
  ])

  const durationOptions = useMemo(() => {
    if (!startAt) return []

    const start = new Date(startAt)
    if (Number.isNaN(start.getTime())) return []

    const windowEnd = availability.windowEnd
      ? new Date(availability.windowEnd)
      : new Date(Date.now() + ADVANCE_WINDOW_MS)

    const nextBooking = availability.bookings
      .map((booking) => ({
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
      }))
      .filter(
        (booking) =>
          !Number.isNaN(booking.start.getTime()) &&
          !Number.isNaN(booking.end.getTime()) &&
          booking.start > start
      )
      .sort((left, right) => left.start - right.start)[0]

    const maxEndTime = Math.min(
      start.getTime() + MAX_BOOKING_MINUTES * 60 * 1000,
      windowEnd.getTime(),
      nextBooking ? nextBooking.start.getTime() : Number.POSITIVE_INFINITY
    )

    const maxMinutes = Math.floor((maxEndTime - start.getTime()) / SLOT_INTERVAL_MS) * SLOT_INTERVAL_MINUTES
    const options = []

    for (
      let minutes = SLOT_INTERVAL_MINUTES;
      minutes <= maxMinutes;
      minutes += SLOT_INTERVAL_MINUTES
    ) {
      const label = minutes < 60
        ? `${minutes} min`
        : minutes % 60 === 0
          ? `${minutes / 60} hour${minutes === 60 ? "" : "s"}`
          : `${Math.floor(minutes / 60)}.5 hours`

      options.push({ value: minutes, label })
    }

    return options
  }, [availability.bookings, availability.windowEnd, startAt])

  useEffect(() => {
    if (availableStartSlots.length === 0) {
      setStartAt("")
      return
    }

    const hasCurrentSelection = availableStartSlots.some(
      (slot) => slot.value === startAt
    )

    if (!hasCurrentSelection) {
      setStartAt(availableStartSlots[0].value)
    }
  }, [availableStartSlots, startAt])

  useEffect(() => {
    if (durationOptions.length === 0) {
      return
    }

    const hasCurrentSelection = durationOptions.some(
      (option) => option.value === durationMinutes
    )

    if (!hasCurrentSelection) {
      setDurationMinutes(durationOptions[0].value)
    }
  }, [durationMinutes, durationOptions])

  const handleBookRoom = async () => {
    setError("")
    setSuccess("")

    if (!user?.id) {
      setError("Please sign in to book a room.")
      return
    }

    if (activeBooking) {
      setError("You already have an active room booking.")
      return
    }

    const start = new Date(startAt)
    if (Number.isNaN(start.getTime())) {
      setError("Please choose a valid start date/time.")
      return
    }

    const end = new Date(start.getTime() + Number(durationMinutes) * 60 * 1000)

    setSubmitting(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/rooms/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          roomNumber: selectedRoom,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || "Failed to book room")

      setSuccess("Room booked successfully.")
      await fetchData()
      setAvailabilityRefreshKey((current) => current + 1)
    } catch (err) {
      setError(err.message || "Failed to book room")
      setAvailabilityRefreshKey((current) => current + 1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Navbar showBack={true} />
      <main className="mx-auto w-full max-w-6xl space-y-8 p-6 md:p-10">
        <section className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Room Booking</h1>
          <p className="text-muted-foreground">
            Book a study room with clear limits: up to 1 day in advance, only
            one active room booking, and a maximum of 3 hours.
          </p>
        </section>

        {activeBooking && (
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="text-lg">Your Active Booking</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Room {activeBooking.roomNumber} from{" "}
              {new Date(activeBooking.startTime).toLocaleString()} to{" "}
              {new Date(activeBooking.endTime).toLocaleString()}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Book a Room</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Room</span>
              <select
                className="h-10 w-full rounded-md border px-3"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                {rooms.map((room) => (
                  <option key={room.roomNumber} value={room.roomNumber}>
                    Room {room.roomNumber} (Floor {room.floor})
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-muted-foreground">
                Start time
              </span>
              <select
                className="h-10 w-full rounded-md border px-3"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                disabled={availabilityLoading || availableStartSlots.length === 0}
              >
                {availableStartSlots.length === 0 ? (
                  <option value="">No times available in the next 24 hours</option>
                ) : (
                  availableStartSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Duration</span>
              <select
                className="h-10 w-full rounded-md border px-3"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                disabled={durationOptions.length === 0}
              >
                {durationOptions.length === 0 ? (
                  <option value={durationMinutes}>No valid duration</option>
                ) : (
                  durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                )}
              </select>
            </label>
          </CardContent>
          {selectedRoomDetails && (
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Room {selectedRoomDetails.roomNumber} fits up to{" "}
              {selectedRoomDetails.capacity} people. Projector:{" "}
              {selectedRoomDetails.features.hasProjector ? "Yes" : "No"}.{" "}
              Whiteboard:{" "}
              {selectedRoomDetails.features.hasWhiteboard ? "Yes" : "No"}.
            </CardContent>
          )}
          <CardContent className="pt-0">
            {!!availabilityError && (
              <p className="mb-2 text-sm text-rose-600">{availabilityError}</p>
            )}
            {availableStartSlots.length > 0 && !availabilityLoading && (
              <p className="mb-2 text-sm text-muted-foreground">
                Choose from 30-minute slots available within the next 24 hours.
              </p>
            )}
            <Button
              onClick={handleBookRoom}
              disabled={
                submitting ||
                !selectedRoom ||
                !startAt ||
                durationOptions.length === 0 ||
                !!activeBooking
              }
            >
              {submitting ? "Booking..." : "Book Room"}
            </Button>
            {!!error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
            {!!success && (
              <p className="mt-2 text-sm text-emerald-600">{success}</p>
            )}
          </CardContent>
        </Card>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Rooms by Floor
              </h2>
              <p className="mt-1 text-muted-foreground">
                Browse room capacity and features before booking.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/">Back to catalog</Link>
            </Button>
          </div>

          {loading ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
              Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
              No rooms available.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card key={room.roomNumber} className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <DoorOpen className="h-5 w-5" /> Room {room.roomNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Floor {room.floor} | Capacity {room.capacity}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <FeatureRow
                        label="Contains TV"
                        enabled={room.features.hasTv}
                      />
                      <FeatureRow
                        label="Contains projector"
                        enabled={room.features.hasProjector}
                      />
                      <FeatureRow
                        label="Contains whiteboard"
                        enabled={room.features.hasWhiteboard}
                      />
                      <FeatureRow
                        label="Wi-Fi available"
                        enabled={room.features.hasWifi}
                      />
                      <FeatureRow
                        label="Power outlets"
                        enabled={room.features.hasPowerOutlets}
                      />
                      <FeatureRow
                        label="Quiet-zone friendly"
                        enabled={room.features.quietZone}
                      />
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
