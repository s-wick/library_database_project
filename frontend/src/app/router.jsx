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
import CheckInPage from "./routes/check-in"
import RoomManagePage from "./routes/manage-room"
import CheckoutPage from "./routes/checkout"
import ItemPage from "./routes/item"
import RoomBookingPage from "./routes/room-booking"
import PaymentPage from "./routes/payment-page"
import { NotFoundRoute } from "./routes/not-found"
import RootLayout from "./routes/root-layout"

function getStoredUser() {
  try {
    const raw = sessionStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function isStaffUser(user) {
  return user?.accountType === "staff" || user?.roleGroup === "adminStaff"
}

function isLoggedIn() {
  return sessionStorage.getItem("isLoggedIn") === "true"
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
    element: <RootLayout />,
    errorElement: <NotFoundRoute />,
    children: [
      {
        index: true,
        element: (
          <RedirectStaffToManagement>
            <LandingSearchPage />
          </RedirectStaffToManagement>
        ),
        handle: { title: "Hungry Library" },
      },
      {
        path: "search",
        element: (
          <RedirectStaffToManagement>
            <SearchPage />
          </RedirectStaffToManagement>
        ),
        handle: { title: "Search" },
      },
      {
        path: "auth",
        element: <AuthPage />,
        handle: { title: "Sign In" },
      },
      {
        path: "user-dashboard",
        element: (
          <RedirectStaffToManagement>
            <UserDashboardPage />
          </RedirectStaffToManagement>
        ),
        handle: { title: "User Dashboard" },
      },
      {
        path: "management-dashboard",
        element: (
          <RequireManagementAccess>
            <ManagementDashboardPage />
          </RequireManagementAccess>
        ),
        handle: { title: "Management Dashboard" },
      },
      {
        path: "management-dashboard/add-librarian",
        element: (
          <RequireManagementAccess>
            <AddLibrarianPage />
          </RequireManagementAccess>
        ),
        handle: { title: "Add Librarian" },
      },
      {
        path: "management-dashboard/edit-librarian",
        element: (
          <RequireManagementAccess>
            <EditLibrarianPage />
          </RequireManagementAccess>
        ),
        handle: { title: "Edit Librarian" },
      },
      {
        path: "management-dashboard/add-item",
        element: (
          <RequireManagementAccess>
            <AddItemPage />
          </RequireManagementAccess>
        ),
        handle: { title: "Add Item" },
      },
      {
        path: "management-dashboard/manage-items",
        element: (
          <RequireManagementAccess>
            <ManageItemsPage />
          </RequireManagementAccess>
        ),
        handle: { title: "Manage Items" },
      },
      {
        path: "management-dashboard/reports",
        element: (
          <RequireManagementAccess>
            <ReportsPage />
          </RequireManagementAccess>
        ),
        handle: { title: "Reports" },
      },
      {
        path: "management-dashboard/check-in",
        element: (
          <RequireManagementAccess>
            <CheckInPage />
          </RequireManagementAccess>
        ),
        handle: { title: "Check In" },
      },
      {
        path: "management-dashboard/room-manage",
        element: (
          <RequireManagementAccess>
            <RoomManagePage />
          </RequireManagementAccess>
        ),
        handle: { title: "Manage Rooms" },
      },
      {
        path: "checkout",
        element: (
          <RedirectStaffToManagement>
            <CheckoutPage />
          </RedirectStaffToManagement>
        ),
        handle: { title: "Checkout" },
      },
      {
        path: "item/:id",
        element: (
          <RedirectStaffToManagement>
            <ItemPage />
          </RedirectStaffToManagement>
        ),
        handle: { title: "Item Details" },
      },
      {
        path: "rooms",
        element: (
          <RedirectStaffToManagement>
            <RoomBookingPage />
          </RedirectStaffToManagement>
        ),
        handle: { title: "Room Booking" },
      },
      {
        path: "payment",
        element: (
          <RedirectStaffToManagement>
            <PaymentPage />
          </RedirectStaffToManagement>
        ),
        handle: { title: "Payment" },
      },
    ],
  },
])
