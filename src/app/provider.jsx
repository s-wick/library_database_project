import { RouterProvider } from "react-router-dom"
import { router } from "@/app/router"

export function AppProvider() {
  return <RouterProvider router={router} />
}
