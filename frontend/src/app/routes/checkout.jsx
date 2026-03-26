import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Trash2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { useCart } from "@/app/cart-provider"

export default function CheckoutPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userStr = localStorage.getItem("user")
    const user = userStr ? JSON.parse(userStr) : null
    const isStaff =
      user?.accountType === "staff" || user?.roleGroup === "adminStaff"

    if (!isLoggedIn) {
      navigate("/")
      return
    }

    if (isStaff) {
      navigate("/management-dashboard")
    }
  }, [navigate])

  const { cartItems, removeFromCart, clearCart } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const maxItems = 5 // Imposing standard limit scaffold

  const handleCheckout = async () => {
    if (cartItems.length === 0) return
    if (cartItems.length > maxItems) {
      alert(`You can only borrow up to ${maxItems} items at once.`)
      return
    }

    try {
      setIsCheckingOut(true)
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"

      const userStr = localStorage.getItem("user")
      if (!userStr) {
        alert("You must be logged in to checkout.")
        setIsCheckingOut(false)
        return
      }
      const user = JSON.parse(userStr)

      const res = await fetch(`${apiBaseUrl}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          items: cartItems.map((i) => ({
            itemId: i.item_id,
          })),
        }),
      })

      if (res.ok) {
        alert("Checkout successful!")
        clearCart()
        navigate("/user-dashboard")
      } else {
        const error = await res.json()
        alert(error.message || "Checkout failed")
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred during checkout.")
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar showBack={true} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-6 md:px-10 md:py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Your Cart</h2>
            <p className="text-sm text-muted-foreground">
              {cartItems.length} {cartItems.length === 1 ? "item" : "items"}{" "}
              (Max {maxItems})
            </p>
          </div>
          {cartItems.length > 0 && (
            <Button
              variant="outline"
              onClick={clearCart}
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Empty Cart
            </Button>
          )}
        </div>

        {cartItems.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4 md:col-span-2">
              {cartItems.map((item) => (
                <Card
                  key={`${item.item_id}-${item.standard_type}`}
                  className="flex flex-col overflow-hidden sm:flex-row"
                >
                  <div className="relative aspect-[4/3] w-full flex-shrink-0 bg-muted sm:aspect-[3/4] sm:w-32">
                    {item.thumbnail_image ? (
                      <img
                        src={item.thumbnail_image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-200 dark:bg-slate-800" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.creator
                          ? `by ${item.creator}`
                          : item.standard_type}
                      </p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeFromCart(item.item_id, item.standard_type)
                        }
                        className="text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="md:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Limit</span>
                    <span>{maxItems}</span>
                  </div>
                  {cartItems.length > maxItems && (
                    <div className="mt-4 rounded-md bg-destructive/15 p-3 text-destructive">
                      You have exceeded the checkout limit of {maxItems} items.
                      Please remove some items.
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={
                      isCheckingOut ||
                      cartItems.length === 0 ||
                      cartItems.length > maxItems
                    }
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isCheckingOut ? "Checking out..." : "Confirm Checkout"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Trash2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Your cart is empty</h3>
            <p className="mb-6 text-muted-foreground">
              Add items to your cart to proceed with checkout.
            </p>
            <Button asChild>
              <Link to="/">Browse Items</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
