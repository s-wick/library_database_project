import React, { createContext, useContext, useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/api-config"

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem("cart")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems))
  }, [cartItems])

  const apiBaseUrl = API_BASE_URL

  const getUser = () => {
    try {
      const userStr = localStorage.getItem("user")
      if (userStr) return JSON.parse(userStr)
    } catch {}
    return null
  }

  const syncCartWithServer = async () => {
    const user = getUser()
    if (!user) {
      setCartItems([])
      return
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/cart?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setCartItems(data.cart || [])
      }
    } catch (e) {
      console.error("Failed to sync cart", e)
    }
  }

  useEffect(() => {
    syncCartWithServer()
  }, [])

  const addToCart = async (item) => {
    setCartItems((prev) => {
      if (
        prev.find(
          (i) =>
            i.item_id === item.item_id && i.standard_type === item.standard_type
        )
      )
        return prev
      return [...prev, item]
    })

    const user = getUser()
    if (user) {
      try {
        await fetch(`${apiBaseUrl}/api/cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            itemId: item.item_id,
          }),
        })
      } catch (e) {
        console.error("Error adding to cart API", e)
      }
    }
  }

  const removeFromCart = async (itemId, type) => {
    setCartItems((prev) =>
      prev.filter((i) => !(i.item_id === itemId && i.standard_type === type))
    )

    const user = getUser()
    if (user) {
      try {
        await fetch(`${apiBaseUrl}/api/cart`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, itemId }),
        })
      } catch (e) {
        console.error("Error removing from cart API", e)
      }
    }
  }

  const clearCart = async () => {
    setCartItems([])

    const user = getUser()
    if (user) {
      try {
        await fetch(`${apiBaseUrl}/api/cart`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, clearAll: true }),
        })
      } catch (e) {
        console.error("Error clearing cart API", e)
      }
    }
  }

  const clearFrontendCart = () => setCartItems([])

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        clearFrontendCart,
        syncCartWithServer,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
