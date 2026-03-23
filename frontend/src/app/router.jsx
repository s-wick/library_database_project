import { createBrowserRouter } from "react-router-dom"
import LandingSearchPage from "./routes/landing-search"
import AuthPage from "./routes/auth"
import UserDashboardPage from "./routes/user-dashboard"
import ManagementDashboardPage from "./routes/management-dashboard"
import AddLibrarianPage from "./routes/add-librarian"
import AddItemPage from "./routes/add-item"
import ReportsPage from "./routes/reports"
import { NotFoundRoute } from "./routes/not-found"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingSearchPage />,
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
    element: <ManagementDashboardPage />,
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/management-dashboard/add-librarian",
    element: <AddLibrarianPage />,
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/management-dashboard/add-item",
    element: <AddItemPage />,
    errorElement: <NotFoundRoute />,
  },
  {
    path: "/management-dashboard/reports",
    element: <ReportsPage />,
    errorElement: <NotFoundRoute />,
  },
])
