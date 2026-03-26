import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"

const initialForm = {
  firstName: "",
  lastName: "",
  idNumber: "",
  email: "",
  phoneNumber: "",
  cardNumber: "",
  expiryDate: "",
  cvv: "",
  cardholderName: "",
}

export default function PaymentPage() {
  const { setTheme, theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState("")

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

  function getFieldError(name, value, currentForm) {
    if (name === "firstName" && !String(value || "").trim()) {
      return "First name is required."
    }
    if (name === "lastName" && !String(value || "").trim()) {
      return "Last name is required."
    }
    if (name === "idNumber" && !String(value || "").trim()) {
      return "ID number is required."
    }
    if (name === "cardNumber") {
      const digits = String(value || "").replace(/\D/g, "")
      if (digits.length < 16) return "Card number must be 16 digits."
    }
    if (name === "expiryDate") {
      const raw = String(value || "").trim()
      if (!raw) return "Expiry date is required."
      if (!/^\d{2}\/\d{2}$/.test(raw)) return "Use MM/YY format."
      const month = Number(raw.slice(0, 2))
      if (month < 1 || month > 12) return "Month must be 01-12."
    }
    if (name === "cvv") {
      const digits = String(value || "").replace(/\D/g, "")
      if (digits.length < 3) return "CVV must be 3 digits."
    }
    if (name === "cardholderName" && !String(value || "").trim()) {
      return "Cardholder name is required."
    }

    if (name === "email") {
      const email = String(value || "").trim()
      if (!email) return ""
      if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email."
    }

    const phone = String(currentForm.phoneNumber || "").trim()
    if (name === "phoneNumber" && phone) {
      const digits = phone.replace(/\D/g, "")
      if (digits.length < 10) return "Phone number must have 10 digits."
    }

    return ""
  }

  function formatCardNumber(value = "") {
    const digits = String(value).replace(/\D/g, "").slice(0, 16)
    return digits.replace(/(.{4})/g, "$1 ").trim()
  }

  function formatExpiry(value = "") {
    const digits = String(value).replace(/\D/g, "").slice(0, 4)
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  function onChange(event) {
    const { name, value } = event.target
    setFieldErrors((prev) => ({ ...prev, [name]: "" }))
    setSuccess("")

    if (name === "cardNumber") {
      setForm((prev) => ({ ...prev, [name]: formatCardNumber(value) }))
      return
    }

    if (name === "expiryDate") {
      setForm((prev) => ({ ...prev, [name]: formatExpiry(value) }))
      return
    }

    if (name === "cvv") {
      setForm((prev) => ({
        ...prev,
        [name]: String(value || "")
          .replace(/\D/g, "")
          .slice(0, 3),
      }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function onBlur(event) {
    const { name, value } = event.target
    const message = getFieldError(name, value, form)
    if (!message) return
    setFieldErrors((prev) => ({ ...prev, [name]: message }))
  }

  function onSubmit(event) {
    event.preventDefault()
    setSuccess("")

    const nextErrors = {
      firstName: getFieldError("firstName", form.firstName, form),
      lastName: getFieldError("lastName", form.lastName, form),
      idNumber: getFieldError("idNumber", form.idNumber, form),
      email: getFieldError("email", form.email, form),
      phoneNumber: getFieldError("phoneNumber", form.phoneNumber, form),
      cardNumber: getFieldError("cardNumber", form.cardNumber, form),
      expiryDate: getFieldError("expiryDate", form.expiryDate, form),
      cvv: getFieldError("cvv", form.cvv, form),
      cardholderName: getFieldError(
        "cardholderName",
        form.cardholderName,
        form
      ),
    }

    const hasErrors = Object.values(nextErrors).some(Boolean)
    if (hasErrors) {
      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})
    setSuccess(`Payment of $${total.toFixed(2)} submitted successfully.`)
  }

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

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-10 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Personal Information</h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!fieldErrors.firstName}>
                    <FieldLabel htmlFor="firstName">First name</FieldLabel>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={form.firstName}
                      onChange={onChange}
                      onBlur={onBlur}
                      aria-invalid={!!fieldErrors.firstName}
                      placeholder="First Name*"
                    />
                    <FieldError>{fieldErrors.firstName}</FieldError>
                  </Field>

                  <Field data-invalid={!!fieldErrors.lastName}>
                    <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={form.lastName}
                      onChange={onChange}
                      onBlur={onBlur}
                      aria-invalid={!!fieldErrors.lastName}
                      placeholder="Last Name*"
                    />
                    <FieldError>{fieldErrors.lastName}</FieldError>
                  </Field>
                </div>

                <Field data-invalid={!!fieldErrors.idNumber}>
                  <FieldLabel htmlFor="idNumber">ID number</FieldLabel>
                  <Input
                    id="idNumber"
                    name="idNumber"
                    value={form.idNumber}
                    onChange={onChange}
                    onBlur={onBlur}
                    aria-invalid={!!fieldErrors.idNumber}
                    placeholder="ID Number*"
                  />
                  <FieldError>{fieldErrors.idNumber}</FieldError>
                </Field>

                <Field data-invalid={!!fieldErrors.email}>
                  <FieldLabel htmlFor="email">Email (optional)</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    onBlur={onBlur}
                    aria-invalid={!!fieldErrors.email}
                    placeholder="Email Address"
                  />
                  <FieldError>{fieldErrors.email}</FieldError>
                </Field>

                <Field data-invalid={!!fieldErrors.phoneNumber}>
                  <FieldLabel htmlFor="phoneNumber">
                    Phone number (optional)
                  </FieldLabel>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={onChange}
                    onBlur={onBlur}
                    aria-invalid={!!fieldErrors.phoneNumber}
                    placeholder="Phone Number"
                  />
                  <FieldError>{fieldErrors.phoneNumber}</FieldError>
                </Field>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Card Information</h2>

                <Field data-invalid={!!fieldErrors.cardNumber}>
                  <FieldLabel htmlFor="cardNumber">Card number</FieldLabel>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    value={form.cardNumber}
                    onChange={onChange}
                    onBlur={onBlur}
                    aria-invalid={!!fieldErrors.cardNumber}
                    placeholder="Card Number*"
                    inputMode="numeric"
                  />
                  <FieldError>{fieldErrors.cardNumber}</FieldError>
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!fieldErrors.expiryDate}>
                    <FieldLabel htmlFor="expiryDate">Expiry date</FieldLabel>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      value={form.expiryDate}
                      onChange={onChange}
                      onBlur={onBlur}
                      aria-invalid={!!fieldErrors.expiryDate}
                      placeholder="MM/YY*"
                    />
                    <FieldError>{fieldErrors.expiryDate}</FieldError>
                  </Field>

                  <Field data-invalid={!!fieldErrors.cvv}>
                    <FieldLabel htmlFor="cvv">CVV</FieldLabel>
                    <Input
                      id="cvv"
                      name="cvv"
                      value={form.cvv}
                      onChange={onChange}
                      onBlur={onBlur}
                      aria-invalid={!!fieldErrors.cvv}
                      placeholder="CVV*"
                      inputMode="numeric"
                    />
                    <FieldError>{fieldErrors.cvv}</FieldError>
                  </Field>
                </div>

                <Field data-invalid={!!fieldErrors.cardholderName}>
                  <FieldLabel htmlFor="cardholderName">
                    Cardholder name
                  </FieldLabel>
                  <Input
                    id="cardholderName"
                    name="cardholderName"
                    value={form.cardholderName}
                    onChange={onChange}
                    onBlur={onBlur}
                    aria-invalid={!!fieldErrors.cardholderName}
                    placeholder="Cardholder Name*"
                  />
                  <FieldError>{fieldErrors.cardholderName}</FieldError>
                </Field>
              </div>

              {success && (
                <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                  {success}
                </p>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full bg-red-600 text-white hover:bg-red-700"
                >
                  Pay ${total.toFixed(2)}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
