import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Trash2, CheckCircle, AlertTriangle, X } from "lucide-react"
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

// ── Borrow Limit Progress Visual ──────────────────────────────────────────────
function BorrowLimitBadge({ isFaculty, borrowLimit, borrowDays }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        isFaculty
          ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
          : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
      }`}
    >
      {isFaculty ? "Faculty" : "Student"} · Up to {borrowLimit} items ·{" "}
      {borrowDays}-day loans
    </div>
  )
}

function BorrowLimitBar({ activeCount, cartCount, borrowLimit }) {
  const used = activeCount
  const inCart = Math.min(cartCount, Math.max(borrowLimit - used, 0))
  const overflow = Math.max(activeCount + cartCount - borrowLimit, 0)
  const free = Math.max(borrowLimit - used - inCart, 0)

  const pctUsed = (used / borrowLimit) * 100
  const pctCart = (inCart / borrowLimit) * 100
  const pctOverflow = (overflow / borrowLimit) * 100
  const pctFree = (free / borrowLimit) * 100

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Borrow allowance</span>
        <span>
          {activeCount} borrowed + {cartCount} in cart / {borrowLimit} max
        </span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {/* Already borrowed */}
        {pctUsed > 0 && (
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${pctUsed}%` }}
          />
        )}
        {/* Items in cart (within limit) */}
        {pctCart > 0 && (
          <div
            className="h-full bg-blue-300 transition-all"
            style={{ width: `${pctCart}%` }}
          />
        )}
        {/* Overflow (exceeds limit) */}
        {pctOverflow > 0 && (
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${pctOverflow}%` }}
          />
        )}
        {/* Free slots */}
        {pctFree > 0 && <div className="h-full flex-1" />}
      </div>
      <div className="flex gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          Borrowed
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-300" />
          In cart
        </span>
        {overflow > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            Over limit ({overflow})
          </span>
        )}
      </div>
    </div>
  )
}

// ── Limit Exceeded Modal ──────────────────────────────────────────────────────
function LimitExceededModal({
  open,
  onClose,
  activeCount,
  borrowLimit,
  isFaculty,
}) {
  if (!open) return null
  const remaining = Math.max(borrowLimit - activeCount, 0)
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
        <h2 className="mb-2 text-lg font-bold">Borrow Limit Exceeded</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          As a <strong>{isFaculty ? "faculty" : "student"}</strong> member, you
          can have at most <strong>{borrowLimit} items</strong> borrowed at a
          time. You currently have <strong>{activeCount}</strong> active borrow
          {activeCount !== 1 ? "s" : ""}, so you can add{" "}
          <strong>{remaining}</strong> more item{remaining !== 1 ? "s" : ""} to
          your checkout.
        </p>
        <p className="mb-5 text-sm text-muted-foreground">
          Please remove items from your cart until the total fits within your
          allowance.
        </p>
        <Button className="w-full" onClick={onClose}>
          Got it — I'll adjust my cart
        </Button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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
  const [showLimitModal, setShowLimitModal] = useState(false)

  // Borrow status from API
  const [borrowStatus, setBorrowStatus] = useState(null)

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) return
    const user = JSON.parse(userStr)
    if (!user?.id) return

    fetch(`${apiBaseUrl}/api/borrow-status?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setBorrowStatus(data)
      })
      .catch(() => {})
  }, [cartItems])

  // Derived limits
  const borrowLimit =
    borrowStatus?.borrowLimit ?? (borrowStatus?.isFaculty ? 6 : 3)
  const borrowDays = borrowStatus?.borrowDays ?? 7
  const isFaculty = borrowStatus?.isFaculty ?? false
  const activeCount = borrowStatus?.activeCount ?? 0
  const remaining = Math.max(borrowLimit - activeCount, 0)
  const wouldExceedLimit = activeCount + cartItems.length > borrowLimit

  const handleCheckout = async () => {
    if (cartItems.length === 0) return

    if (wouldExceedLimit) {
      setShowLimitModal(true)
      return
    }

    try {
      setIsCheckingOut(true)

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
        if (
          error.activeCount !== undefined ||
          error.borrowLimit !== undefined
        ) {
          setShowLimitModal(true)
        } else {
          alert(error.message || "Checkout failed")
        }
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

      <LimitExceededModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        activeCount={activeCount}
        borrowLimit={borrowLimit}
        isFaculty={isFaculty}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-6 md:px-10 md:py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Your Cart</h2>
            <p className="text-sm text-muted-foreground">
              {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in
              cart
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

        {/* Borrow Limit Info */}
        {borrowStatus && (
          <div className="mb-6 space-y-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">
                Your borrowing privileges
              </span>
              <BorrowLimitBadge
                isFaculty={isFaculty}
                borrowLimit={borrowLimit}
                borrowDays={borrowDays}
              />
            </div>
            <BorrowLimitBar
              activeCount={activeCount}
              cartCount={cartItems.length}
              borrowLimit={borrowLimit}
            />
          </div>
        )}

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
                    <span className="text-muted-foreground">In cart</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Already borrowed
                    </span>
                    <span>{activeCount}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">
                      Total after checkout
                    </span>
                    <span className={wouldExceedLimit ? "text-red-600" : ""}>
                      {activeCount + cartItems.length} / {borrowLimit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loan period</span>
                    <span>{borrowDays} days</span>
                  </div>
                  {wouldExceedLimit && (
                    <div className="mt-4 flex items-start gap-2 rounded-md bg-destructive/15 p-3 text-xs text-destructive">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Exceeds your {isFaculty ? "faculty" : "student"} limit
                        of {borrowLimit}. Remove{" "}
                        {activeCount + cartItems.length - borrowLimit} item
                        {activeCount + cartItems.length - borrowLimit !== 1
                          ? "s"
                          : ""}{" "}
                        to proceed.
                      </span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isCheckingOut || cartItems.length === 0}
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
