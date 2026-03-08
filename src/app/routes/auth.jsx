import { useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const roles = [
  { id: "admin", label: "Admin / Staff" },
  { id: "student", label: "Student & Faculty" },
]

const emptyForm = {
  email: "",
  password: "",
  confirmPassword: "",
}

export default function AuthPage() {
  const [selectedRole, setSelectedRole] = useState("admin")
  const [mode, setMode] = useState("signin")
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const isSignUp = mode === "signup"

  const submitLabel = useMemo(() => {
    if (isSignUp) return "Create account"
    return "Sign in"
  }, [isSignUp])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setError("")
    setSuccess("")
    setForm(emptyForm)
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!form.email.trim()) {
      setError("Email is required.")
      return
    }

    if (!form.password.trim()) {
      setError("Password is required.")
      return
    }

    if (isSignUp) {
      if (!form.confirmPassword.trim()) {
        setError("Retype password is required.")
        return
      }

      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.")
        return
      }
    }

    const roleLabel =
      selectedRole === "admin" ? "Admin / Staff" : "Student & Faculty"
    const action = isSignUp ? "Account created" : "Signed in"
    setSuccess(`${action} for ${roleLabel}.`)
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="rounded-4xl border bg-card py-8 sm:py-10">
          <CardHeader className="px-6 sm:px-12">
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-2 text-2xl text-primary hover:opacity-90"
            >
              <ArrowLeft className="size-6" />
              <span>Back to home</span>
            </Link>
            <CardTitle className="text-5xl font-semibold tracking-tight">
              {isSignUp ? "Sign up" : "Sign in"}
            </CardTitle>
            <p className="mt-1 text-3xl text-muted-foreground">
              University Library
            </p>
          </CardHeader>

          <CardContent className="space-y-6 px-6 sm:px-12">
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
              {roles.map((role) => {
                const isActive = selectedRole === role.id
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`h-12 text-lg font-medium transition ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {role.label}
                  </button>
                )
              })}
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-2xl font-medium" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={form.email}
                  onChange={handleChange}
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-2xl font-medium" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  className="h-12 text-lg"
                />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label
                    className="text-2xl font-medium"
                    htmlFor="confirmPassword"
                  >
                    Retype password
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Retype your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="h-12 text-lg"
                  />
                </div>
              )}

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

              <Button type="submit" className="h-12 w-full text-2xl">
                {submitLabel}
              </Button>
            </form>

            <div className="text-center text-base text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(isSignUp ? "signin" : "signup")}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {isSignUp ? "Sign in" : "Create an account"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
