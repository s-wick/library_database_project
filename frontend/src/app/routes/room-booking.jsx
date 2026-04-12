import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, XCircle, DoorOpen } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { API_BASE_URL } from "@/lib/api-config"

const BOOKING_WINDOW_HOURS = 24
const SLOT_INTERVAL_MINUTES = 30
const SLOT_INTERVAL_MS = SLOT_INTERVAL_MINUTES * 60 * 1000

function formatDateLabel(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatTimeLabel(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function toDateValue(date) {
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function roundUpToNextSlot(date) {
  const rounded = new Date(date)
  rounded.setSeconds(0, 0)

  const remainder = rounded.getMinutes() % SLOT_INTERVAL_MINUTES
  if (remainder !== 0) {
    rounded.setMinutes(rounded.getMinutes() + SLOT_INTERVAL_MINUTES - remainder)
  }

  if (rounded.getTime() <= date.getTime()) {
    rounded.setMinutes(rounded.getMinutes() + SLOT_INTERVAL_MINUTES)
  }

  return rounded
}

function overlaps(startTime, endTime, booking) {
  const bookingStart = new Date(booking.startTime).getTime()
  const bookingEnd = new Date(booking.endTime).getTime()
  return startTime < bookingEnd && endTime > bookingStart
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
  const [roomBookings, setRoomBookings] = useState([])
  const [activeBooking, setActiveBooking] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState("")
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedStartAt, setSelectedStartAt] = useState("")
  const [loading, setLoading] = useState(true)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedRoomDetails = useMemo(
    () => rooms.find((room) => room.roomNumber === selectedRoom) || null,
    [rooms, selectedRoom]
  )

  const openedAt = useMemo(() => new Date(), [])
  const bookingWindowStart = useMemo(
    () => roundUpToNextSlot(openedAt),
    [openedAt]
  )
  const bookingWindowEnd = useMemo(
    () => new Date(openedAt.getTime() + BOOKING_WINDOW_HOURS * 60 * 60 * 1000),
    [openedAt]
  )

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user")
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
      setRoomBookings([])
      return
    }

    let ignore = false

    const fetchAvailability = async () => {
      setAvailabilityLoading(true)

      try {
        const params = new URLSearchParams({
          roomNumber: selectedRoom,
          startTime: bookingWindowStart.toISOString(),
          endTime: bookingWindowEnd.toISOString(),
        })
        const res = await fetch(
          `${apiBaseUrl}/api/rooms/availability?${params}`
        )
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(data.message || "Failed to load room availability")
        }

        if (!ignore) {
          setRoomBookings(data.bookings || [])
        }
      } catch (err) {
        if (!ignore) {
          setRoomBookings([])
          setError(err.message || "Failed to load room availability")
        }
      } finally {
        if (!ignore) {
          setAvailabilityLoading(false)
        }
      }
    }

    fetchAvailability()

    return () => {
      ignore = true
    }
  }, [apiBaseUrl, bookingWindowEnd, bookingWindowStart, selectedRoom])

  const availableSlots = useMemo(() => {
    const slots = []
    const durationMs = durationMinutes * 60 * 1000

    for (
      let slotTime = bookingWindowStart.getTime();
      slotTime + durationMs <= bookingWindowEnd.getTime();
      slotTime += SLOT_INTERVAL_MS
    ) {
      const slotEnd = slotTime + durationMs
      const isBlocked = roomBookings.some((booking) =>
        overlaps(slotTime, slotEnd, booking)
      )

      if (!isBlocked) {
        const slotDate = new Date(slotTime)
        slots.push({
          value: slotDate.toISOString(),
          dateValue: toDateValue(slotDate),
          dateLabel: formatDateLabel(slotDate),
          timeLabel: formatTimeLabel(slotDate),
        })
      }
    }

    return slots
  }, [bookingWindowEnd, bookingWindowStart, durationMinutes, roomBookings])

  const availableDates = useMemo(() => {
    const seen = new Set()
    return availableSlots.filter((slot) => {
      if (seen.has(slot.dateValue)) {
        return false
      }

      seen.add(slot.dateValue)
      return true
    })
  }, [availableSlots])

  const timeOptions = useMemo(
    () => availableSlots.filter((slot) => slot.dateValue === selectedDate),
    [availableSlots, selectedDate]
  )

  useEffect(() => {
    if (availableDates.length === 0) {
      if (selectedDate !== "") {
        setSelectedDate("")
      }
      return
    }

    if (!availableDates.some((slot) => slot.dateValue === selectedDate)) {
      setSelectedDate(availableDates[0].dateValue)
    }
  }, [availableDates, selectedDate])

  useEffect(() => {
    if (timeOptions.length === 0) {
      if (selectedStartAt !== "") {
        setSelectedStartAt("")
      }
      return
    }

    if (!timeOptions.some((slot) => slot.value === selectedStartAt)) {
      setSelectedStartAt(timeOptions[0].value)
    }
  }, [selectedStartAt, timeOptions])

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

    if (!selectedStartAt) {
      setError("No available time slot for the selected room and duration.")
      return
    }

    const start = new Date(selectedStartAt)
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
    } catch (err) {
      setError(err.message || "Failed to book room")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveBooking = async () => {
    setError("")
    setSuccess("")

    if (!user?.id) {
      setError("Please sign in to manage your room booking.")
      return
    }

    if (!activeBooking) {
      setError("No active room booking found.")
      return
    }

    setCancelling(true)
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/rooms/my-booking?userId=${user.id}`,
        {
          method: "DELETE",
        }
      )

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.message || "Failed to remove room booking")
      }

      setSuccess("Room booking removed successfully.")
      await fetchData()
    } catch (err) {
      setError(err.message || "Failed to remove room booking")
    } finally {
      setCancelling(false)
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
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Room {activeBooking.roomNumber} from{" "}
                {new Date(activeBooking.startTime).toLocaleString()} to{" "}
                {new Date(activeBooking.endTime).toLocaleString()}
              </p>
              <Button
                variant="outline"
                onClick={handleRemoveBooking}
                disabled={cancelling}
              >
                {cancelling ? "Removing booking..." : "Remove booking"}
              </Button>
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

            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Date</span>
              <select
                className="h-10 w-full rounded-md border px-3"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={availabilityLoading || availableDates.length === 0}
              >
                {availableDates.length === 0 ? (
                  <option value="">No dates available</option>
                ) : (
                  availableDates.map((slot) => (
                    <option key={slot.dateValue} value={slot.dateValue}>
                      {slot.dateLabel}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">
                Start time
              </span>
              <select
                className="h-10 w-full rounded-md border px-3"
                value={selectedStartAt}
                onChange={(e) => setSelectedStartAt(e.target.value)}
                disabled={availabilityLoading || timeOptions.length === 0}
              >
                {timeOptions.length === 0 ? (
                  <option value="">No times available</option>
                ) : (
                  timeOptions.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.timeLabel}
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
              >
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={150}>2.5 hours</option>
                <option value={180}>3 hours</option>
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
          <CardContent className="pt-0 text-sm text-muted-foreground">
            {availabilityLoading
              ? "Checking available 30-minute slots..."
              : availableSlots.length > 0
                ? `Showing available slots from ${formatDateLabel(bookingWindowStart)} through ${formatDateLabel(bookingWindowEnd)}.`
                : "No bookable 30-minute slots remain in the next 24 hours for this room and duration."}
          </CardContent>
          <CardContent className="pt-0">
            <Button
              onClick={handleBookRoom}
              disabled={
                submitting ||
                cancelling ||
                !selectedRoom ||
                !!activeBooking ||
                availabilityLoading ||
                !selectedStartAt
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
