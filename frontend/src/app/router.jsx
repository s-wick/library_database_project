import { createBrowserRouter } from "react-router-dom"
import LandingSearchPage from "./routes/landing-search"
import SearchPage from "./routes/search"
import AuthPage from "./routes/auth"
import UserDashboardPage from "./routes/user-dashboard"
import ItemPage from "./routes/item"
import { NotFoundRoute } from "./routes/not-found"

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
    path: "/item/:id",
    element: <ItemPage />,
    errorElement: <NotFoundRoute />,
  },
])
