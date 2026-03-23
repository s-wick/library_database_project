import React, { useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export default function PaymentPage() {
  const { setTheme, theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  // Force light mode for the payment page
  useEffect(() => {
    const previous = theme
    setTheme("light")
    return () => setTheme(previous)
  }, [])

  // added this for future to support purchase of books
  // Get amount and type from previous page
  const amount = location.state?.amount || 0
  const paymentType = location.state?.type || "purchase"

  // Calculate tax only for book purchases
  const taxRate = paymentType === "fine" ? 0 : 0.0825
  const tax = amount * taxRate
  const total = amount + tax

  // Main content
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
        {/* Logo Placeholder */}
        <Link
          to="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
          aria-label="Back to home"
        >
          <div className="inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-md bg-primary px-2 text-[12px] font-bold whitespace-nowrap text-primary-foreground ring-1 ring-border">
            LIBRARY LOGO HERE
          </div>
        </Link>
      </header>

      {/* Card information content */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-10 md:grid-cols-2">
        <div>
          {/*left side*/}

          {/* Personal information section */}
          <h2 className="mb-6 text-2xl font-semibold">Personal Information</h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="First Name*"
                className="rounded-1g w-1/2 border bg-background p-3 text-sm"
              />

              <input
                type="text"
                placeholder="Last Name*"
                className="rounded-1g w-1/2 border bg-background p-3 text-sm"
              />
            </div>

            <input
              type="text"
              placeholder="ID Number*"
              className="rounded-1g w-full border bg-background p-3 text-sm"
            />

            <input
              type="email"
              placeholder="Email Address"
              className="rounded-1g w-full border bg-background p-3 text-sm"
            />

            <input
              type="text"
              placeholder="Phone Number"
              className="rounded-1g w-full border bg-background p-3 text-sm"
            />
          </div>

          {/* Card information section */}
          <h2 className="mt-6 mb-6 text-2xl font-semibold">Card Information</h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Card Number*"
              className="rounded-1g w-full border bg-background p-3 text-sm"
            />

            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Expiry Date (MM/YY)*"
                className="rounded-1g w-1/2 border bg-background p-3 text-sm"
              />

              <input
                type="text"
                placeholder="CVV*"
                className="rounded-1g w-1/2 border bg-background p-3 text-sm"
              />
            </div>

            <input
              type="text"
              placeholder="Cardholder Name*"
              className="rounded-1g w-full border bg-background p-3 text-sm"
            />

            <button className="mt-4 w-full rounded-full bg-chart-3 py-3 text-white transition hover:bg-chart-3/80">
              Pay ${total.toFixed(2)}
            </button>

            {/* Go back button will take you to previous page you were on */}
            <button
              className="mx-auto mt-2 block py-3 text-chart-3 underline transition hover:text-black/600"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>

        {/* Right side with order summary */}
        <div className="h-fit rounded-xl border p-6">
          <h3 className="mb-4 text-lg font-semibold">Order Summary</h3>

          <div className="mb-2 flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${amount.toFixed(2)}</span>
          </div>

          <div className="mb-2 flex justify-between text-sm">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>

          <div className="my-3 border-t"></div>

          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
