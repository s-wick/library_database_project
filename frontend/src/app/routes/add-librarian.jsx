import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"

export default function AddLibrarianPage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
  const [form, setForm] = useState({
    email: "",
    password: "",
    phoneNumber: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function onChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/management/librarians`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          phoneNumber: form.phoneNumber.trim(),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.message || "Failed to add librarian.")
        return
      }
      setSuccess("Librarian added successfully.")
      setForm({ email: "", password: "", phoneNumber: "" })
    } catch {
      setError("Unable to connect to server.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Button asChild variant="outline">
          <Link to="/management-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Add librarian</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phoneNumber">Phone number</FieldLabel>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  value={form.phoneNumber}
                  onChange={onChange}
                />
              </Field>

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                  {success}
                </p>
              )}

              <Button type="submit" disabled={isSubmitting}>
                Add librarian
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
