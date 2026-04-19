import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { API_BASE_URL } from "@/lib/api-config"

import { useCart } from "@/app/cart-provider"

const emptyForm = {
  email: "",
  password: "",
}

export default function EmployeeAuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { syncCartWithServer } = useCart()

  const apiBaseUrl = API_BASE_URL
  const returnTo = new URLSearchParams(location.search).get("returnTo") || ""

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setSuccess("")
    const nextErrors = {}

    if (!form.email.trim()) {
      nextErrors.email = "Email is required."
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required."
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const payload = {
      accountType: "staff",
      email: form.email.trim(),
      password: form.password,
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (data.message) {
          setErrors({ general: data.message })
          return
        }
        if (response.status === 403) {
          setErrors({ general: "Account no longer exists." })
          return
        }
        if (response.status === 401) {
          setErrors({
            general: "Account does not exist. Contact your administrator.",
          })
          return
        }
        setErrors({ general: "Failed to sign in." })
        return
      }

      sessionStorage.setItem("isLoggedIn", "true")
      sessionStorage.setItem("authToken", data?.token || "")
      sessionStorage.setItem("authUser", JSON.stringify(data?.user || {}))
      sessionStorage.setItem("user", JSON.stringify(data?.user || {}))

      await syncCartWithServer()

      const destination =
        returnTo && returnTo.startsWith("/")
          ? returnTo
          : data?.user?.accountType === "staff" ||
              data?.user?.roleGroup === "adminStaff"
            ? "/management-dashboard"
            : "/"

      navigate(destination, { replace: true })
    } catch {
      setErrors({
        general: "Unable to connect to server.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <Card className="border bg-card">
          <CardHeader>
            <Link
              to="/auth"
              className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:opacity-90"
            >
              <ArrowLeft className="size-4" />
              <span>Back to sign in</span>
            </Link>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Employee Sign In
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              University Library Staff Portal
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field className="space-y-0">
                <FieldLabel htmlFor={errors.email ? "input-invalid" : "email"}>
                  Email
                </FieldLabel>
                <Input
                  id={errors.email ? "input-invalid" : "email"}
                  name="email"
                  type="email"
                  placeholder="staff@university.edu"
                  value={form.email}
                  onChange={handleChange}
                  aria-invalid={!!errors.email}
                  className={
                    errors.email
                      ? "border-destructive text-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {errors.email && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.email}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel
                  htmlFor={errors.password ? "input-invalid" : "password"}
                >
                  Password
                </FieldLabel>
                <Input
                  id={errors.password ? "input-invalid" : "password"}
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  aria-invalid={!!errors.password}
                  className={
                    errors.password
                      ? "border-destructive text-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {errors.password && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.password}
                  </p>
                )}
              </Field>

              {success && (
                <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                  {success}
                </p>
              )}
              {errors.general && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors.general}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
