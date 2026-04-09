import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, XCircle, DoorOpen } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { API_BASE_URL } from "@/lib/api-config"

function formatDateTimeLocal(date) {
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
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
  const [startAt, setStartAt] = useState(() => {
    const initial = new Date(Date.now() + 60 * 60 * 1000)
    return formatDateTimeLocal(initial)
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedRoomDetails = useMemo(
    () => rooms.find((room) => room.roomNumber === selectedRoom) || null,
    [rooms, selectedRoom]
  )

  const now = useMemo(() => new Date(), [])
  const minStart = useMemo(
    () => formatDateTimeLocal(new Date(now.getTime() + 5 * 60 * 1000)),
    [now]
  )
  const maxStart = useMemo(
    () => formatDateTimeLocal(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    [now]
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
    } catch (err) {
      setError(err.message || "Failed to book room")
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
              <input
                type="datetime-local"
                className="h-10 w-full rounded-md border px-3"
                value={startAt}
                min={minStart}
                max={maxStart}
                onChange={(e) => setStartAt(e.target.value)}
              />
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
          <CardContent className="pt-0">
            <Button
              onClick={handleBookRoom}
              disabled={submitting || !selectedRoom || !!activeBooking}
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
