import { Link, useNavigate } from "react-router-dom"
import {
  Users,
  PackagePlus,
  FileBarChart2,
  ArrowLeft,
  LogOut,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const actions = [
  {
    title: "Add librarian",
    description: "Create librarian account with email, password and phone.",
    to: "/management-dashboard/add-librarian",
    icon: Users,
  },
  {
    title: "Add item",
    description: "Add catalog items by type from the database list.",
    to: "/management-dashboard/add-item",
    icon: PackagePlus,
  },
  {
    title: "Reports page",
    description: "Open reports tools and analytics.",
    to: "/management-dashboard/reports",
    icon: FileBarChart2,
  },
]

export default function ManagementDashboardPage() {
  const navigate = useNavigate()
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}")
  const visibleActions =
    authUser.role === "admin"
      ? actions.filter(
          (action) => action.to !== "/management-dashboard/add-item"
        )
      : actions.filter(
          (action) => action.to !== "/management-dashboard/add-librarian"
        )

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              localStorage.setItem("isLoggedIn", "false")
              localStorage.removeItem("authToken")
              localStorage.removeItem("authUser")
              navigate("/")
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Management dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {visibleActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.title}
                    to={action.to}
                    className="rounded-lg border bg-card p-4 transition hover:bg-muted/30"
                  >
                    <Icon className="mb-3 h-5 w-5 text-primary" />
                    <p className="font-semibold">{action.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
