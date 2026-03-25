import React, { createContext, useContext, useState, useEffect } from "react"

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

  const addToCart = (item) => {
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
  }

  const removeFromCart = (itemId, type) => {
    setCartItems((prev) =>
      prev.filter((i) => !(i.item_id === itemId && i.standard_type === type))
    )
  }

  const clearCart = () => setCartItems([])

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
