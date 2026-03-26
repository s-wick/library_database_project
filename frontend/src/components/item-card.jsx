import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Image as ImageIcon } from "lucide-react"
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

export function ItemCard({ item }) {
  const navigate = useNavigate()
  const { cartItems, addToCart } = useCart()
  const [open, setOpen] = useState(false)

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
    Number.isFinite(Number(item.in_stock))
      ? `In stock: ${item.in_stock}`
      : null,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                <p>In Stock: {item.in_stock}</p>
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
              ) : (
                <Button
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                >
                  {isAvailable ? "Add to Cart" : "Currently Unavailable"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
