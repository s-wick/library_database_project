import React, { useState } from "react"
import { Link } from "react-router-dom"
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
  const { cartItems, addToCart } = useCart()
  const [open, setOpen] = useState(false)

  const isAvailable = item.availability === "Available"
  const inCart = cartItems.some(
    (i) => i.item_id === item.item_id && i.standard_type === item.standard_type
  )

  const handleAddToCart = () => {
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
              <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {item.tag}
              </span>
            </div>
            <CardTitle className="line-clamp-2 text-lg leading-tight">
              {item.title}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {item.creator ? `by ${item.creator}` : item.standard_type}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-4 pt-2">
            <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
              {item.description}
            </p>
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
              <h4 className="mb-1 font-medium">Details</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {item.publication && <p>Publication: {item.publication}</p>}
                {item.edition && <p>Edition: {item.edition}</p>}
                {item.duration && <p>Duration: {item.duration} mins</p>}
                {item.model && <p>Model: {item.model}</p>}
              </div>
            </div>
            <div>
              <h4 className="mb-1 font-medium">Description</h4>
              <p className="line-clamp-6 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
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
