import { Link } from "react-router-dom"
import {
  Users,
  PackagePlus,
  Pencil,
  Trash2,
  FileBarChart2,
  DoorOpen,
  UserCheck,
  BookCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"

const actions = [
  {
    title: "Add librarian",
    description: "Create librarian account with email, password and phone.",
    to: "/management-dashboard/add-librarian",
    icon: Users,
    adminOnly: true,
    group: "People & access",
  },
  {
    title: "Add item",
    description: "Add catalog items by type from the database list.",
    to: "/management-dashboard/add-item",
    icon: PackagePlus,
    group: "Catalog items",
  },
  {
    title: "Edit librarian",
    description: "Update librarian details and retirement date.",
    to: "/management-dashboard/edit-librarian",
    icon: Pencil,
    adminOnly: true,
    group: "People & access",
  },
  {
    title: "Edit item",
    description: "Update existing catalog item details.",
    to: "/management-dashboard/manage-items?mode=edit",
    icon: Pencil,
    group: "Catalog items",
  },
  {
    title: "Remove item",
    description: "Delete catalog items that are no longer needed.",
    to: "/management-dashboard/manage-items?mode=remove",
    icon: Trash2,
    group: "Catalog items",
  },
  {
    title: "Reports page",
    description: "Open reports tools and analytics.",
    to: "/management-dashboard/reports",
    icon: FileBarChart2,
    group: "Operations & reporting",
  },
  {
    title: "Manage rooms",
    description: "Add and review study rooms for booking.",
    to: "/management-dashboard/room-manage",
    icon: DoorOpen,
    adminOnly: true,
    group: "Operations & reporting",
  },
  {
    title: "Mark faculty",
    description: "Mark or undo faculty status for user accounts.",
    to: "/management-dashboard/mark-faculty",
    icon: UserCheck,
    adminOnly: false,
    group: "User management",
  },

  {
    title: "Check in item",
    description: "Check in borrowed items.",
    to: "/management-dashboard/check-in",
    icon: BookCheck,
    group: "User management",
  },
]

const groupOrder = [
  "Catalog items",
  "People & access",
  "User management",
  "Operations & reporting",
]

const groupStyles = {
  "Catalog items": {
    panel:
      "border-emerald-500/20 bg-emerald-500/8 dark:border-emerald-300/25 dark:bg-emerald-300/10",
    icon: "text-emerald-700 dark:text-emerald-300",
    title: "text-emerald-900 dark:text-emerald-100",
  },
  "People & access": {
    panel:
      "border-amber-500/20 bg-amber-500/8 dark:border-amber-300/25 dark:bg-amber-300/10",
    icon: "text-amber-700 dark:text-amber-300",
    title: "text-amber-900 dark:text-amber-100",
  },
  "User management": {
    panel:
      "border-sky-500/20 bg-sky-500/8 dark:border-sky-300/25 dark:bg-sky-300/10",
    icon: "text-sky-700 dark:text-sky-300",
    title: "text-sky-900 dark:text-sky-100",
  },
  "Operations & reporting": {
    panel:
      "border-fuchsia-500/20 bg-fuchsia-500/8 dark:border-fuchsia-300/25 dark:bg-fuchsia-300/10",
    icon: "text-fuchsia-700 dark:text-fuchsia-300",
    title: "text-fuchsia-900 dark:text-fuchsia-100",
  },
}

export default function ManagementDashboardPage() {
  const authUser = JSON.parse(sessionStorage.getItem("authUser") || "{}")
  const visibleActions = actions.filter(
    (action) => !action.adminOnly || authUser.role === "admin"
  )
  const groupedActions = visibleActions.reduce((acc, action) => {
    if (!acc[action.group]) {
      acc[action.group] = []
    }
    acc[action.group].push(action)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background">
      <Navbar showBack={false} />
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Management dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {groupOrder
                .filter((groupName) => groupedActions[groupName]?.length)
                .map((groupName) => {
                  const style = groupStyles[groupName]
                  const items = groupedActions[groupName]
                  return (
                    <section
                      key={groupName}
                      className={`rounded-xl border p-4 ${style.panel}`}
                    >
                      <h3
                        className={`mb-3 text-sm font-semibold ${style.title}`}
                      >
                        {groupName}
                      </h3>
                      <div className="grid gap-3 md:grid-cols-3">
                        {items.map((action) => {
                          const Icon = action.icon
                          return (
                            <Link
                              key={action.title}
                              to={action.to}
                              className="rounded-lg border bg-background/70 p-4 transition hover:bg-background"
                            >
                              <Icon className={`mb-3 h-5 w-5 ${style.icon}`} />
                              <p className="font-semibold">{action.title}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {action.description}
                              </p>
                            </Link>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
