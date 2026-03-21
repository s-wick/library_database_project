import { createBrowserRouter } from "react-router-dom"
import LandingSearchPage from "./routes/landing-search"
import AuthPage from "./routes/auth"
import UserDashboardPage from "./routes/User_Dashboard"
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
])
