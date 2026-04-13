import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, XCircle, DoorOpen } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { API_BASE_URL } from "@/lib/api-config"

const SLOT_INTERVAL_MINUTES = 60
const SLOT_INTERVAL_MS = SLOT_INTERVAL_MINUTES * 60 * 1000
const MAX_BOOKING_HOURS = 3
const ADVANCE_WINDOW_MS = 24 * 60 * 60 * 1000
const WEEKDAY_OPEN_HOUR = 9
const WEEKDAY_CLOSE_HOUR = 19
const WEEKEND_OPEN_HOUR = 9
const WEEKEND_CLOSE_HOUR = 17

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

function formatTimeLabel(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

function getDateKey(value) {
  return new Date(value).toDateString()
}

function isWholeHour(value) {
  const date = new Date(value)
  return date.getMinutes() === 0 && date.getSeconds() === 0
}

function getBookingEndTime(booking) {
  if (booking.endTime) return new Date(booking.endTime)
  const start = new Date(booking.startTime)
  const durationHours = Number(booking.durationHours || 0)
  return new Date(start.getTime() + durationHours * 60 * 60 * 1000)
}

function getDaySchedule(date) {
  const day = date.getDay()
  const isWeekend = day === 0 || day === 6
  return {
    openHour: isWeekend ? WEEKEND_OPEN_HOUR : WEEKDAY_OPEN_HOUR,
    closeHour: isWeekend ? WEEKEND_CLOSE_HOUR : WEEKDAY_CLOSE_HOUR,
  }
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

function CalendarWithTimeSlider({
  dayOption,
  onDayOptionChange,
  startAtLabel,
  timeSlots,
  selectedStartAt,
  onStartAtChange,
  durationHours,
  onDurationChange,
  maxDurationHours,
  availabilityLoading,
  availabilityError,
}) {
  const effectiveDurationHours = Math.min(
    durationHours,
    Math.max(1, maxDurationHours || 1)
  )

  return (
    <Card className="h-full">
      <CardContent className="grid gap-4">
        <Tabs value={dayOption} onValueChange={onDayOptionChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-col justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Start time</p>
            {availabilityLoading ? (
              <p className="mt-1 text-sm">Loading availability...</p>
            ) : availabilityError ? (
              <p className="mt-1 text-sm text-rose-600">{availabilityError}</p>
            ) : startAtLabel ? (
              <p className="mt-1 text-base font-medium">{startAtLabel}</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                No available times on this date.
              </p>
            )}
            {timeSlots.length > 0 && (
              <div className="mt-3 columns-2 sm:columns-3">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.value}
                    type="button"
                    className="mb-2 w-full break-inside-avoid"
                    variant={
                      slot.value === selectedStartAt ? "default" : "secondary"
                    }
                    onClick={() => onStartAtChange(slot.value)}
                  >
                    {slot.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <div className="mt-2 flex items-center gap-3">
              <Slider
                min={1}
                max={Math.max(1, maxDurationHours || 1)}
                step={1}
                value={[effectiveDurationHours]}
                onValueChange={(value) =>
                  onDurationChange(
                    Math.min(value[0], Math.max(1, maxDurationHours || 1))
                  )
                }
                disabled={maxDurationHours === 0}
              />
              <span className="w-20 text-sm font-medium">
                {effectiveDurationHours} hour
                {effectiveDurationHours === 1 ? "" : "s"}
              </span>
            </div>
            {maxDurationHours > 0 && maxDurationHours < 3 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Max {maxDurationHours} hour
                {maxDurationHours === 1 ? "" : "s"} based on availability.
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-card text-xs text-muted-foreground">
        Starts are aligned to the next whole hour when possible.
      </CardFooter>
    </Card>
  )
}

export default function RoomBookingPage() {
  const apiBaseUrl = API_BASE_URL

  const [rooms, setRooms] = useState([])
  const [activeBooking, setActiveBooking] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState("")
  const [durationHours, setDurationHours] = useState(1)
  const [startAt, setStartAt] = useState("")
  const [dayOption, setDayOption] = useState("today")
  const baseToday = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }, [])
  const selectedDate = useMemo(() => {
    const next = new Date(baseToday)
    if (dayOption === "tomorrow") {
      next.setDate(next.getDate() + 1)
    }
    return next
  }, [baseToday, dayOption])
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
        end: getBookingEndTime(booking),
      }))
      .filter(
        (booking) =>
          !Number.isNaN(booking.start.getTime()) &&
          !Number.isNaN(booking.end.getTime())
      )

    const earliestCandidate = new Date(
      Math.max(windowStart.getTime(), Date.now() + 60 * 1000)
    )
    const slots = []
    const cursorDay = new Date(earliestCandidate)
    cursorDay.setHours(0, 0, 0, 0)

    while (cursorDay.getTime() < windowEnd.getTime()) {
      const { openHour, closeHour } = getDaySchedule(cursorDay)
      const dayOpen = new Date(cursorDay)
      dayOpen.setHours(openHour, 0, 0, 0)
      const dayClose = new Date(cursorDay)
      dayClose.setHours(closeHour, 0, 0, 0)

      const dayStart = roundUpToNextSlot(
        new Date(
          Math.max(
            dayOpen.getTime(),
            earliestCandidate.getTime(),
            windowStart.getTime()
          )
        )
      )
      const dayEnd = Math.min(dayClose.getTime(), windowEnd.getTime())

      for (
        let cursor = dayStart.getTime();
        cursor + SLOT_INTERVAL_MS <= dayEnd;
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

      cursorDay.setDate(cursorDay.getDate() + 1)
    }

    return slots
  }, [
    availability.bookings,
    availability.windowEnd,
    availability.windowStart,
    availabilityError,
    selectedRoom,
  ])

  const availableSlotsDetailed = useMemo(() => {
    return availableStartSlots
      .map((slot) => ({
        ...slot,
        date: new Date(slot.value),
      }))
      .filter((slot) => !Number.isNaN(slot.date.getTime()))
  }, [availableStartSlots])

  const timeSlotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []

    const selectedKey = getDateKey(selectedDate)
    return availableSlotsDetailed
      .filter((slot) => getDateKey(slot.date) === selectedKey)
      .map((slot) => ({
        value: slot.value,
        label: formatTimeLabel(slot.date),
      }))
  }, [availableSlotsDetailed, selectedDate])

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    const selectedKey = getDateKey(selectedDate)
    return availableSlotsDetailed.filter(
      (slot) => getDateKey(slot.date) === selectedKey
    )
  }, [availableSlotsDetailed, selectedDate])

  const preferredSlotForSelectedDate = useMemo(() => {
    if (slotsForSelectedDate.length === 0) return null
    const wholeHourSlots = slotsForSelectedDate.filter((slot) =>
      isWholeHour(slot.date)
    )
    return wholeHourSlots[0] || slotsForSelectedDate[0]
  }, [slotsForSelectedDate])

  const maxDurationHours = useMemo(() => {
    if (!startAt) return 0

    const start = new Date(startAt)
    if (Number.isNaN(start.getTime())) return 0

    const { closeHour } = getDaySchedule(start)
    const dayClose = new Date(start)
    dayClose.setHours(closeHour, 0, 0, 0)

    const windowEnd = availability.windowEnd
      ? new Date(availability.windowEnd)
      : new Date(Date.now() + ADVANCE_WINDOW_MS)

    const nextBooking = availability.bookings
      .map((booking) => ({
        start: new Date(booking.startTime),
        end: getBookingEndTime(booking),
      }))
      .filter(
        (booking) =>
          !Number.isNaN(booking.start.getTime()) &&
          !Number.isNaN(booking.end.getTime()) &&
          booking.start > start
      )
      .sort((left, right) => left.start - right.start)[0]

    const maxEndTime = Math.min(
      start.getTime() + MAX_BOOKING_HOURS * 60 * 60 * 1000,
      dayClose.getTime(),
      windowEnd.getTime(),
      nextBooking ? nextBooking.start.getTime() : Number.POSITIVE_INFINITY
    )

    const maxHours = Math.floor(
      (maxEndTime - start.getTime()) / (60 * 60 * 1000)
    )

    return Math.max(0, Math.min(3, maxHours))
  }, [availability.bookings, availability.windowEnd, startAt])

  useEffect(() => {
    const selectedSlot = timeSlotsForSelectedDate.find(
      (slot) => slot.value === startAt
    )

    if (selectedSlot) {
      return
    }

    if (preferredSlotForSelectedDate) {
      setStartAt(preferredSlotForSelectedDate.value)
      return
    }

    setStartAt("")
  }, [preferredSlotForSelectedDate, startAt, timeSlotsForSelectedDate])

  useEffect(() => {
    if (maxDurationHours === 0) {
      return
    }

    if (durationHours > maxDurationHours) {
      setDurationHours(maxDurationHours)
    }
  }, [durationHours, maxDurationHours])

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

    setSubmitting(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/rooms/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          roomNumber: selectedRoom,
          startTime: start.toISOString(),
          durationHours,
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
      <Navbar />
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
          <CardContent className="grid gap-4 md:grid-cols-[minmax(0,220px)_1fr]">
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-hidden rounded-md border">
                <div className="max-h-96 space-y-2 overflow-y-auto p-3">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading rooms...
                    </p>
                  ) : rooms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No rooms available.
                    </p>
                  ) : (
                    rooms.map((room) => (
                      <React.Fragment key={room.roomNumber}>
                        <Button
                          type="button"
                          variant={
                            selectedRoom === room.roomNumber
                              ? "default"
                              : "secondary"
                          }
                          className="h-auto w-full justify-between px-3 py-2 text-left whitespace-normal"
                          onClick={() => setSelectedRoom(room.roomNumber)}
                        >
                          <span>
                            Room {room.roomNumber}
                            <span
                              className={`text-xs ${
                                selectedRoom === room.roomNumber
                                  ? "text-white/80"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {" "}
                              (Floor {room.floor})
                            </span>
                          </span>
                          <span
                            className={`text-xs ${
                              selectedRoom === room.roomNumber
                                ? "text-white/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {room.capacity} seats
                          </span>
                        </Button>
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div>
              <CalendarWithTimeSlider
                dayOption={dayOption}
                onDayOptionChange={setDayOption}
                startAtLabel={startAt ? formatSlotLabel(startAt) : ""}
                timeSlots={timeSlotsForSelectedDate}
                selectedStartAt={startAt}
                onStartAtChange={setStartAt}
                durationHours={durationHours}
                onDurationChange={setDurationHours}
                maxDurationHours={maxDurationHours}
                availabilityLoading={availabilityLoading}
                availabilityError={availabilityError}
              />
            </div>
          </CardContent>

          <CardContent className="pt-0">
            <Button
              onClick={handleBookRoom}
              disabled={
                submitting ||
                !selectedRoom ||
                !startAt ||
                maxDurationHours === 0 ||
                !!activeBooking
              }
            >
              {submitting ? "Booking..." : "Book Room"}
            </Button>
            {!!activeBooking && (
              <p className="mt-2 text-sm text-amber-600">
                You already have an active booking and cannot book another room.
              </p>
            )}
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
