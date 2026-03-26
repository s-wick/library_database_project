import { useEffect, useState } from "react"
import { Navigate, createBrowserRouter } from "react-router-dom"
import LandingSearchPage from "./routes/landing-search"
import SearchPage from "./routes/search-results"
import AuthPage from "./routes/auth"
import UserDashboardPage from "./routes/user-dashboard"
import ManagementDashboardPage from "./routes/management-dashboard"
import AddLibrarianPage from "./routes/add-librarian"
import AddItemPage from "./routes/add-item"
import ReportsPage from "./routes/reports"
import CheckoutPage from "./routes/checkout"
import ItemPage from "./routes/item"
import { NotFoundRoute } from "./routes/not-found"
import { API_BASE_URL } from "@/lib/api-config"

function RequireManagementAccess({ children }) {
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    let active = true
    async function checkAccess() {
      const authToken = localStorage.getItem("authToken")
      if (!authToken) {
        if (active) setStatus("unauthorized")
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
        const data = await response.json().catch(() => ({}))
        if (!active) return

        if (response.ok && data?.user?.roleGroup === "adminStaff") {
          localStorage.setItem("authUser", JSON.stringify(data.user))
          setStatus("authorized")
          return
        }
        setStatus("unauthorized")
      } catch {
        if (active) setStatus("unauthorized")
      }
    }

    checkAccess()
    return () => {
      active = false
    }
  }, [])

  if (status === "loading") {
    return <div className="p-6 text-sm text-muted-foreground">Checking access...</div>
  }

  if (status === "authorized") {
    return children
  }

  return <Navigate to="/auth" replace />
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingSearchPage />,
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/search",
    element: <SearchPage />,
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/user-dashboard",
    element: <UserDashboardPage />,
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/management-dashboard",
    element: (
      <RequireManagementAccess>
        <ManagementDashboardPage />
      </RequireManagementAccess>
    ),
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/management-dashboard/add-librarian",
    element: (
      <RequireManagementAccess>
        <AddLibrarianPage />
      </RequireManagementAccess>
    ),
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/management-dashboard/add-item",
    element: (
      <RequireManagementAccess>
        <AddItemPage />
      </RequireManagementAccess>
    ),
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/management-dashboard/reports",
    element: (
      <RequireManagementAccess>
        <ReportsPage />
      </RequireManagementAccess>
    ),
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/checkout",
    element: <CheckoutPage />,
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/item/:id",
    element: <ItemPage />,
    errorElement: <NotFoundRoute />,
  },
])
