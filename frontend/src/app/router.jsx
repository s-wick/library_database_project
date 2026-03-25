import { createBrowserRouter } from "react-router-dom"
import LandingSearchPage from "./routes/landing-search"
import AuthPage from "./routes/auth"
import UserDashboardPage from "./routes/user-dashboard"
import { NotFoundRoute } from "./routes/not-found"
import PaymentPage from "./routes/Payment_Page"

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
    path: "/payment",
    element: <PaymentPage />,
    errorElement: <NotFoundRoute />,
  },
])
