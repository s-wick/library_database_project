import React, { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"

export default function PaymentPage() {
  const { setTheme, theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showPurchase, setShowPurchase] = useState(false)
  const [fines, setFines] = useState([])
  const [finesError, setFinesError] = useState("")
  const [isLoadingFines, setIsLoadingFines] = useState(true)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    emailAddress: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  })
  const [errors, setErrors] = useState({})

  const requiredFieldMessages = {
    firstName: "First Name is required.",
    lastName: "Last Name is required.",
    idNumber: "ID Number is required.",
    emailAddress: "Email Address is required.",
    cardNumber: "Card Number is required.",
    expiryDate: "Expiry Date is required.",
    cvv: "CVV is required.",
    cardholderName: "Cardholder Name is required.",
  }

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"

  // Force light mode for the payment page
  useEffect(() => {
    const previous = theme
    setTheme("light")
    return () => setTheme(previous)
  }, [])

  const amount =
    fines.reduce(
      (sum, fine) => sum + (fine.isPaid ? 0 : Number(fine.amount || 0)),
      0
    ) ||
    location.state?.amount ||
    0

  //error
  const handleInputChange = (e) => {
    if (
      e.target.name === "idNumber" ||
      e.target.name === "cardNumber" ||
      e.target.name === "cvv" ||
      e.target.name === "phoneNumber"
    ) {
      const numericValue = e.target.value.replace(/\D/g, "")
      if (numericValue.length <= e.target.maxLength) {
        setFormData((prev) => ({
          ...prev,
          [e.target.name]: numericValue,
        }))
        if (errors[e.target.name]) {
          setErrors((prev) => ({
            ...prev,
            [e.target.name]: "",
          }))
        }
      }
      return
    }

    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateRequiredFields = () => {
    const nextErrors = {}

    Object.keys(requiredFieldMessages).forEach((fieldName) => {
      if (!String(formData[fieldName] || "").trim()) {
        nextErrors[fieldName] = requiredFieldMessages[fieldName]
      }
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  // Handle form submission but going to add error handling
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateRequiredFields()) return
    setShowConfirmation(true)
  }

  // needed to confirm the purchase and update the users account balance
  const confirmPurchase = () => {
    setShowConfirmation(false)
    setShowPurchase(true)
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser")

    if (!storedUser) {
      setFines([])
      setFinesError("Sign in to load your fines.")
      setIsLoadingFines(false)
      return
    }

    let authUser
    try {
      authUser = JSON.parse(storedUser)
    } catch {
      setFines([])
      setFinesError("Unable to read the signed-in user.")
      setIsLoadingFines(false)
      return
    }

    const params = new URLSearchParams({
      userId: String(authUser.id || ""),
      roleGroup: String(authUser.roleGroup || ""),
      role: String(authUser.role || ""),
    })

    async function loadFines() {
      try {
        setIsLoadingFines(true)
        setFinesError("")
        const response = await fetch(`${apiBaseUrl}/api/fines?${params}`)
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          setFines([])
          setFinesError(data.message || "Unable to load fines.")
          return
        }

        setFines(Array.isArray(data.fines) ? data.fines : [])
      } catch {
        setFines([])
        setFinesError("Unable to connect to server.")
      } finally {
        setIsLoadingFines(false)
      }
    }

    loadFines()
  }, [apiBaseUrl])

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
              <div className="w-1/2">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name*"
                  maxLength={28}
                  className={`rounded-1g w-full border bg-background p-3 text-sm ${errors.firstName ? "border-red-500" : ""}`}
                />

                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="w-1/2">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name*"
                  maxLength={28}
                  className={`rounded-1g w-full border bg-background p-3 text-sm ${errors.lastName ? "border-red-500" : ""}`}
                />

                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                inputMode="numeric"
                placeholder="ID Number*"
                maxLength={4}
                className={`rounded-1g w-full border bg-background p-3 text-sm ${errors.idNumber ? "border-red-500" : ""}`}
              />

              {errors.idNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.idNumber}</p>
              )}
            </div>

            <div>
              <input
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleInputChange}
                placeholder="Email Address"
                maxLength={50}
                className={`rounded-1g w-full border bg-background p-3 text-sm ${errors.emailAddress ? "border-red-500" : ""}`}
              />

              {errors.emailAddress && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.emailAddress}
                </p>
              )}
            </div>

            <input
              type="text"
              placeholder="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              inputMode="numeric"
              maxLength={10}
              className="rounded-1g w-full border bg-background p-3 text-sm"
            />
          </div>

          {/* Card information section */}
          <h2 className="mt-6 mb-6 text-2xl font-semibold">Card Information</h2>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                inputMode="numeric"
                placeholder="Card Number*"
                maxLength={19}
                className={`rounded-1g w-full border bg-background p-3 text-sm ${errors.cardNumber ? "border-red-500" : ""}`}
              />

              {errors.cardNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.cardNumber}</p>
              )}
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  inputMode="numeric"
                  placeholder="Expiry Date (MM/YY)*"
                  maxLength={5}
                  className={`rounded-1g w-full border bg-background p-3 text-sm ${errors.expiryDate ? "border-red-500" : ""}`}
                />

                {errors.expiryDate && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.expiryDate}
                  </p>
                )}
              </div>

              <div className="w-1/2">
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  inputMode="numeric"
                  placeholder="CVV*"
                  maxLength={3}
                  className={`rounded-1g w-full border bg-background p-3 text-sm ${errors.cvv ? "border-red-500" : ""}`}
                />

                {errors.cvv && (
                  <p className="mt-1 text-xs text-red-600">{errors.cvv}</p>
                )}
              </div>
            </div>

            <div>
              <input
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleInputChange}
                placeholder="Cardholder Name*"
                maxLength={50}
                className={`rounded-1g w-full border bg-background p-3 text-sm ${errors.cardholderName ? "border-red-500" : ""}`}
              />

              {errors.cardholderName && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.cardholderName}
                </p>
              )}
            </div>

            {/* Pay button and go back button */}
            <button
              onClick={handleSubmit}
              disabled={isLoadingFines || amount <= 0}
              className="mt-4 w-full rounded-full bg-chart-3 py-3 text-white transition hover:bg-chart-3/80"
            >
              Pay ${amount.toFixed(2)}
            </button>

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
          <div className="mb-2 text-sm">
            <h2 className="mb-3 font-medium">Fines</h2>

            {isLoadingFines && (
              <p className="text-muted-foreground">Loading fines...</p>
            )}

            {!isLoadingFines && finesError && (
              <p className="text-red-600">{finesError}</p>
            )}

            {!isLoadingFines && !finesError && fines.length === 0 && (
              <p className="text-muted-foreground">No unpaid fines found.</p>
            )}

            {!isLoadingFines && !finesError && fines.length > 0 && (
              <div className="space-y-3">
                {fines
                  .filter((fine) => !fine.isPaid)
                  .map((fine) => (
                    <div key={fine.id} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        {fine.reason}
                      </span>
                      <span>${Number(fine.amount || 0).toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            )}
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

      {/* Purchase successful */}
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
