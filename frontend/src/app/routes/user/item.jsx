import React, { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/api-config"

export default function ItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState("Available")
  const [activeHoldsCount, setActiveHoldsCount] = useState(0)
  const [actionError, setActionError] = useState("")
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [hasOutstandingFines, setHasOutstandingFines] = useState(false)
  const [finesMessage, setFinesMessage] = useState("")

  const isFaculty = false // Change according to user type logic if needed
  const borrowDuration = isFaculty ? 14 : 7 // days
  const apiBaseUrl = API_BASE_URL

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${apiBaseUrl}/api/items/${id}`)
        if (res.ok) {
          const data = await res.json()
          setBook(data.item)
          setAvailability(
            data.availability ||
              (Number(data?.item?.stock || 0) > 0
                ? "Available"
                : "Not Available")
          )
          setActiveHoldsCount(data.activeHoldsCount || 0)
        } else {
          setBook(null)
        }
      } catch (err) {
        console.error("Failed to fetch item", err)
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [id])

  useEffect(() => {
    const userStr = sessionStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null

    if (!user?.id) {
      setHasOutstandingFines(false)
      setFinesMessage("")
      return
    }

    fetch(`${apiBaseUrl}/api/borrow-status?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data?.ok) return

        const blocked = Boolean(data.hasOutstandingFines)
        setHasOutstandingFines(blocked)
        setFinesMessage(
          blocked
            ? data.finesMessage ||
                "Borrowing is blocked until all outstanding fines are paid."
            : ""
        )
      })
      .catch(() => {
        setHasOutstandingFines(false)
        setFinesMessage("")
      })
  }, [apiBaseUrl])

  // Formatting helpers based on missing standard field keys
  const getCreator = () =>
    book?.author || book?.director || book?.brand || "Unknown"
  const getTag = () => book?.genre || book?.category || "Misc"

  const handleAction = async () => {
    setActionError("")

    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true"
    if (!isLoggedIn) {
      navigate(
        `/auth?returnTo=${encodeURIComponent(
          location.pathname + location.search
        )}&userOnly=true`
      )
      return
    }

    try {
      setIsSubmittingAction(true)

      const userStr = sessionStorage.getItem("user")
      const user = userStr ? JSON.parse(userStr) : null
      if (!user?.id) {
        navigate(
          `/auth?returnTo=${encodeURIComponent(
            location.pathname + location.search
          )}`
        )
        return
      }

      if (availability === "Available") {
        if (hasOutstandingFines) {
          setActionError(
            finesMessage ||
              "Borrowing is blocked until all outstanding fines are paid."
          )
          return
        }

        const res = await fetch(`${apiBaseUrl}/api/borrow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: book.item_id,
            userId: user.id,
          }),
        })

        if (!res.ok) {
          let payload = {}
          try {
            payload = await res.json()
          } catch {
            payload = {}
          }

          setActionError(payload.message || "Unable to borrow item.")
          return
        }

        alert("Item successfully borrowed!")
      } else {
        const res = await fetch(`${apiBaseUrl}/api/hold`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: book.item_id,
            userId: user.id,
          }),
        })

        if (!res.ok) {
          let payload = {}
          try {
            payload = await res.json()
          } catch {
            payload = {}
          }

          setActionError(payload.message || "Unable to place hold.")
          return
        }

        alert("Hold placed successfully!")
      }
      navigate("/user-dashboard")
    } catch (err) {
      console.error("Action failed", err)
      setActionError("An error occurred.")
    } finally {
      setIsSubmittingAction(false)
    }
  }

  if (loading) {
    return <div className="p-20 text-center">Loading...</div>
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <h2 className="text-2xl font-bold">Item not found</h2>
        <Button variant="link" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Thumbnail Section */}
        <div className="flex justify-center md:col-span-1">
          {book.thumbnail_image ? (
            <img
              src={book.thumbnail_image}
              alt={book.title}
              className="aspect-square h-auto w-full max-w-[250px] rounded-lg object-cover shadow-md"
            />
          ) : (
            <div
              className="flex aspect-square w-full max-w-[250px] items-center justify-center rounded-lg shadow-md"
              style={{ backgroundColor: book.coverColor || "#e2e8f0" }}
            >
              <div className="text-center text-white/70">
                <ImageIcon className="mx-auto mb-2 h-12 w-12" />
                <span>No Image</span>
              </div>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-6 md:col-span-2">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge
                variant={availability === "Available" ? "default" : "secondary"}
              >
                {availability}
              </Badge>
              <span className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                {getTag()}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
            <p className="text-lg text-muted-foreground">by {getCreator()}</p>
          </div>

          <Card>
            <CardHeader className="px-4 py-3 pb-2">
              <CardTitle className="text-lg text-primary">
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 px-4 pt-0 pb-4 text-sm sm:grid-cols-2">
              {book.publication && (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Publication:
                  </span>
                  <p>{book.publication}</p>
                </div>
              )}
              {book.release_date ? (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Release Date:
                  </span>
                  <p>{new Date(book.release_date).toLocaleDateString()}</p>
                </div>
              ) : book.publication_date ? (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Publication Date:
                  </span>
                  <p>{new Date(book.publication_date).toLocaleDateString()}</p>
                </div>
              ) : null}
              {book.standard_type === "Audiobook" && book.narrator && (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Narrator:
                  </span>
                  <p>{book.narrator}</p>
                </div>
              )}
              {(book.standard_type === "Audiobook" ||
                book.standard_type === "Video") &&
                book.duration && (
                  <div>
                    <span className="font-semibold text-muted-foreground">
                      Duration:
                    </span>
                    <p>{book.duration} minutes</p>
                  </div>
                )}
              {book.standard_type === "Equipment" && book.model && (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Model:
                  </span>
                  <p>{book.model}</p>
                </div>
              )}
              {book.standard_type === "Equipment" && book.serial_number && (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Serial Number:
                  </span>
                  <p>{book.serial_number}</p>
                </div>
              )}
              {book.standard_type === "Book" && (
                <div>
                  <span className="font-semibold text-muted-foreground">
                    Edition:
                  </span>
                  <p>{book.edition || "N/A"}</p>
                </div>
              )}
              <div>
                <span className="font-semibold text-muted-foreground">
                  Stock:
                </span>
                <p>{book.stock}</p>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">
                  Inventory:
                </span>
                <p>{book.inventory}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="font-semibold text-muted-foreground">
                  Description:
                </span>
                <p className="mt-1">{book.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed bg-slate-50 dark:bg-slate-900">
            <CardContent className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
              <div className="space-y-0.5 text-center sm:text-left">
                <h3 className="font-semibold">Borrowing Rules</h3>
                <p className="text-sm text-muted-foreground">
                  You can borrow this item for up to{" "}
                  <span className="font-medium text-foreground">
                    {borrowDuration} days
                  </span>
                  .
                </p>
                {availability !== "Available" && (
                  <p className="text-sm text-muted-foreground">
                    Current waitlist: {activeHoldsCount} people
                  </p>
                )}
                {availability === "Available" && hasOutstandingFines ? (
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {finesMessage ||
                      "Borrowing is blocked until all outstanding fines are paid."}
                  </p>
                ) : null}
                {actionError ? (
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {actionError}
                  </p>
                ) : null}
              </div>
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleAction}
                disabled={
                  isSubmittingAction ||
                  (availability === "Available" && hasOutstandingFines)
                }
              >
                {isSubmittingAction
                  ? availability === "Available"
                    ? "Borrowing..."
                    : "Placing hold..."
                  : availability === "Available"
                    ? "Borrow Item"
                    : "Place Hold"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
