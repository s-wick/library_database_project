import { createBrowserRouter } from "react-router-dom"
import LandingSearchPage from "./routes/landing-search"
import { NotFoundRoute } from "./routes/not-found"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingSearchPage />,
    errorElement: <NotFoundRoute />,
  },
])
