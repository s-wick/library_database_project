import React, { use, useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export default function PaymentPage() {
  const { setTheme, theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showPurchase, setShowPurchase] = useState(false)
  const [fines, setFines] = useState([])

  // Force light mode for the payment page
  useEffect(() => {
    const previous = theme
    setTheme("light")
    return () => setTheme(previous)
  }, [])

  // Get amount
  const amount = location.state?.amount || 0

  // Handle form submission but going to add error handling
  const handleSubmit = (e) => {
    e.preventDefault()
    setShowConfirmation(true)
  }
  // needed to confirm the purchase and update the users account balance
  const confirmPurchase = () => {
    setShowConfirmation(false)
    setShowPurchase(true)
  }

  useEffect(() => {
    // Fetch fines from the backend
    fetch()
      .then((res) => res.json())
      .then((data) => setFines(data.fines))
  }, [])

  // add error contraints for the * fields

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
                maxLength={28}
                className="rounded-1g w-1/2 border bg-background p-3 text-sm"
              />

              <input
                type="text"
                placeholder="Last Name*"
                maxLength={28}
                className="rounded-1g w-1/2 border bg-background p-3 text-sm"
              />
            </div>

            <input
              type="text"
              placeholder="ID Number*"
              maxLength={4}
              className="rounded-1g w-full border bg-background p-3 text-sm"
            />

            <input
              type="email"
              placeholder="Email Address"
              maxLength={50}
              className="rounded-1g w-full border bg-background p-3 text-sm"
            />

            <input
              type="text"
              placeholder="Phone Number"
              maxLength={10}
              className="rounded-1g w-full border bg-background p-3 text-sm"
            />
          </div>

          {/* Card information section */}
          <h2 className="mt-6 mb-6 text-2xl font-semibold">Card Information</h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Card Number*"
              maxLength={19}
              className="rounded-1g w-full border bg-background p-3 text-sm"
            />

            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Expiry Date (MM/YY)*"
                maxLength={5}
                className="rounded-1g w-1/2 border bg-background p-3 text-sm"
              />

              <input
                type="text"
                placeholder="CVV*"
                maxLength={3}
                className="rounded-1g w-1/2 border bg-background p-3 text-sm"
              />
            </div>

            <input
              type="text"
              placeholder="Cardholder Name*"
              maxLength={50}
              className="rounded-1g w-full border bg-background p-3 text-sm"
            />

            <button
              onClick={handleSubmit}
              className="mt-4 w-full rounded-full bg-chart-3 py-3 text-white transition hover:bg-chart-3/80"
            >
              Pay ${amount.toFixed(2)}
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
          <h3 className="mb-4 text-lg font-semibold"> Order Summary </h3>

          {/* add the fines */}
          <div className="mb-2 flex justify-between text-sm">
            <h2> Fines </h2>
            {fines.map((fine, index) => (
              <div key={index} className="flex justify-between">
                <span> Name: {fine.name} </span>
                <span> Amount: ${fine.amount.toFixed(2)} </span>
              </div>
            ))}
          </div>

          <div className="my-3 border-t"></div>

          <div className="flex justify-between text-lg font-semibold">
            <span> Total </span>
            <span> ${amount.toFixed(2)} </span>
          </div>
        </div>
      </div>

      {/* Confirmation */}
      {showConfirmation && (
        <div className="bg-opacity-25 fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-lg border border-black bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Confirm Purchase</h3>

            <p className="mb-6 text-gray-600">
              Are you sure you want to proceed with this payment of $
              {amount.toFixed(2)}?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmPurchase}
                className="flex-1 rounded-md bg-chart-3 px-4 py-2 text-white transition hover:bg-chart-3/80"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showPurchase && (
        <div className="bg-opacity-25 fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-lg border border-black bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Payment Successful</h3>

            <p className="mb-6 text-gray-600">
              Your payment of ${amount.toFixed(2)} has been processed
              successfully.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="rounded-md bg-chart-3 px-4 py-2 text-white transition hover:bg-chart-3/80"
            >
              Return
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
