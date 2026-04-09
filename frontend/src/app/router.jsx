import { Navigate, createBrowserRouter } from "react-router-dom"
import LandingSearchPage from "./routes/landing-search"
import SearchPage from "./routes/search-results"
import AuthPage from "./routes/auth"
import UserDashboardPage from "./routes/user-dashboard"
import ManagementDashboardPage from "./routes/management-dashboard"
import AddLibrarianPage from "./routes/add-librarian"
import EditLibrarianPage from "./routes/edit-librarian"
import AddItemPage from "./routes/add-item"
import ManageItemsPage from "./routes/manage-items"
import ReportsPage from "./routes/reports"
import CheckoutPage from "./routes/checkout"
import ItemPage from "./routes/item"
import RoomBookingPage from "./routes/room-booking"
import PaymentPage from "./routes/Payment_Page"
import { NotFoundRoute } from "./routes/not-found"

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function isStaffUser(user) {
  return user?.accountType === "staff" || user?.roleGroup === "adminStaff"
}

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true"
}

function RequireManagementAccess({ children }) {
  const user = getStoredUser()
  if (isLoggedIn() && isStaffUser(user)) {
    return children
  }

  if (isLoggedIn()) {
    return <Navigate to="/user-dashboard" replace />
  }

  return <Navigate to="/auth" replace />
}

function RedirectStaffToManagement({ children }) {
  const user = getStoredUser()
  if (isLoggedIn() && isStaffUser(user)) {
    return <Navigate to="/management-dashboard" replace />
  }

  return children
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RedirectStaffToManagement>
        <LandingSearchPage />
      </RedirectStaffToManagement>
    ),
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/search",
    element: (
      <RedirectStaffToManagement>
        <SearchPage />
      </RedirectStaffToManagement>
    ),
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/user-dashboard",
    element: (
      <RedirectStaffToManagement>
        <UserDashboardPage />
      </RedirectStaffToManagement>
    ),
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
    path: "/management-dashboard/edit-librarian",
    element: (
      <RequireManagementAccess>
        <EditLibrarianPage />
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
    path: "/management-dashboard/manage-items",
    element: (
      <RequireManagementAccess>
        <ManageItemsPage />
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
    element: (
      <RedirectStaffToManagement>
        <CheckoutPage />
      </RedirectStaffToManagement>
    ),
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/item/:id",
    element: (
      <RedirectStaffToManagement>
        <ItemPage />
      </RedirectStaffToManagement>
    ),
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/rooms",
    element: (
      <RedirectStaffToManagement>
        <RoomBookingPage />
      </RedirectStaffToManagement>
    ),
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/payment",
    element: (
      <RedirectStaffToManagement>
        <PaymentPage />
      </RedirectStaffToManagement>
    ),
    errorElement: <NotFoundRoute />,
  },
])
