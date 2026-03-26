import { RouterProvider } from "react-router-dom"
import { router } from "@/app/router"
import { CartProvider } from "./cart-provider"

export function AppProvider() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  )
}
