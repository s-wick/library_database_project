import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AlertTriangle, Image as ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useCart } from "@/app/cart-provider"
import { API_BASE_URL } from "@/lib/api-config"

function HoldBlockedModal({ open, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-background p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mb-2 text-lg font-bold">Holds Temporarily Blocked</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          You cannot place a hold while your account has outstanding fines.
          Please pay your fines to enable holds again.
        </p>
        <Button className="w-full" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  )
}

export function ItemCard({ item }) {
  const navigate = useNavigate()
  const { cartItems, addToCart } = useCart()
  const [open, setOpen] = useState(false)
  const [isPlacingHold, setIsPlacingHold] = useState(false)
  const [holdBlocked, setHoldBlocked] = useState(false)
  const [showHoldBlockedModal, setShowHoldBlockedModal] = useState(false)

  const isAvailable = item.availability === "Available"
  const inCart = cartItems.some(
    (i) => i.item_id === item.item_id && i.standard_type === item.standard_type
  )
  const genres = Array.isArray(item.genres) ? item.genres : []

  const metadata = [
    genres.length ? `Genre: ${genres.slice(0, 2).join(", ")}` : null,
    item.author ? `Author: ${item.author}` : null,
    item.edition ? `Edition: ${item.edition}` : null,
    item.publication_date
      ? `Published: ${String(item.publication_date).slice(0, 10)}`
      : null,
    Number.isFinite(Number(item.stock)) ? `Stock: ${item.stock}` : null,
  ]
    .filter(Boolean)
    .slice(0, 3)

  const handleAddToCart = () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    if (!isLoggedIn) {
      navigate("/auth")
      return
    }
    addToCart(item)
    setOpen(false)
  }

  const handlePlaceHold = async () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    if (!isLoggedIn) {
      navigate("/auth")
      return
    }

    const userStr = localStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    if (!user?.id) {
      navigate("/auth")
      return
    }

    try {
      setIsPlacingHold(true)
      const res = await fetch(`${API_BASE_URL}/api/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.item_id,
          userId: user.id,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        if (res.status === 403) {
          setHoldBlocked(true)
          setShowHoldBlockedModal(true)
          return
        }
        throw new Error(payload?.message || "Unable to place hold.")
      }

      alert("Hold placed successfully!")
      setOpen(false)
    } catch (error) {
      alert(error.message || "Unable to place hold.")
    } finally {
      setIsPlacingHold(false)
    }
  }

  useEffect(() => {
    if (!open) {
      setShowHoldBlockedModal(false)
      return
    }

    const userStr = localStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    if (!user?.id) {
      setHoldBlocked(false)
      return
    }

    fetch(`${API_BASE_URL}/api/borrow-status?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const blocked = Boolean(data?.hasOutstandingFines)
        setHoldBlocked(blocked)
        if (blocked) {
          setShowHoldBlockedModal(true)
        }
      })
      .catch(() => {})
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <HoldBlockedModal
        open={showHoldBlockedModal}
        onClose={() => setShowHoldBlockedModal(false)}
      />
      <Card className="flex h-full flex-col gap-0 overflow-hidden p-0">
        <div className="p-3 pb-0">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
            {item.thumbnail_image ? (
              <img
                src={item.thumbnail_image}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ backgroundColor: item.coverColor || "#e2e8f0" }}
              >
                <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                  <ImageIcon className="mb-2 h-10 w-10" />
                  <span className="text-xs font-medium">No Image</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <CardHeader className="p-3 pb-2">
            <div className="mb-2 flex items-start justify-between gap-2">
              <Badge variant={isAvailable ? "default" : "secondary"}>
                {item.availability}
              </Badge>
            </div>
            <CardTitle className="line-clamp-2 text-lg leading-tight">
              {item.title}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {item.creator ? `by ${item.creator}` : item.standard_type}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-4 pt-2">
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {metadata.map((line) => (
                <p key={line} className="line-clamp-1">
                  {line}
                </p>
              ))}
            </div>
          </CardContent>
          <CardFooter className="mt-auto px-4 pt-0 pb-3">
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </DialogTrigger>
          </CardFooter>
        </div>
      </Card>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>
            {item.creator ? `by ${item.creator}` : item.standard_type}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 md:grid-cols-2">
          <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-md bg-muted">
            {item.thumbnail_image ? (
              <img
                src={item.thumbnail_image}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="mb-1 font-medium">{item.standard_type} Details</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {item.creator && (
                  <p>
                    {item.standard_type === "Book" ? "Author:" : "Creator:"}{" "}
                    {item.creator}
                  </p>
                )}
                {genres.length > 0 && <p>Genres: {genres.join(", ")}</p>}
                {item.edition && <p>Edition: {item.edition}</p>}
                {item.publication && <p>Publisher: {item.publication}</p>}
                {item.publication_date && (
                  <p>Published: {String(item.publication_date).slice(0, 10)}</p>
                )}
                <p>Stock: {item.stock}</p>
                <p>Inventory: {item.inventory}</p>
              </div>
            </div>
            {item.description && (
              <div>
                <h4 className="mb-1 font-medium">Description</h4>
                <p className="line-clamp-6 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            )}
            <div className="mt-auto pt-4">
              {inCart ? (
                <Button className="w-full" asChild variant="secondary">
                  <Link to="/checkout" onClick={() => setOpen(false)}>
                    View in Cart
                  </Link>
                </Button>
              ) : isAvailable ? (
                <Button className="w-full" onClick={handleAddToCart}>
                  Add to Cart
                </Button>
              ) : (
                <>
                  {holdBlocked && (
                    <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      Please pay your outstanding fines to place a hold.
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={handlePlaceHold}
                    disabled={isPlacingHold || holdBlocked}
                  >
                    {holdBlocked
                      ? "Hold Unavailable"
                      : isPlacingHold
                        ? "Placing Hold..."
                        : "Place Hold"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
