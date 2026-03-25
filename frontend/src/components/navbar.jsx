import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Moon, Sun, ArrowLeft, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "@/components/theme-provider"
import { useCart } from "@/app/cart-provider"

export function Navbar({ showBack = false }) {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { cartItems } = useCart()

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const stored = localStorage.getItem("isLoggedIn")
    return stored === null ? true : stored === "true"
  })

  let avatarInitials = "U"
  try {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      if (parsed.firstName && parsed.lastName) {
        avatarInitials =
          `${parsed.firstName[0]}${parsed.lastName[0]}`.toUpperCase()
      } else if (parsed.email) {
        avatarInitials = parsed.email[0].toUpperCase()
      }
    }
  } catch (err) {
    // Ignore error
  }

  const handleSignOut = () => {
    localStorage.setItem("isLoggedIn", "false")
    localStorage.removeItem("user")
    setIsLoggedIn(false)
  }

  return (
    <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        {showBack && (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Link
          to="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
          aria-label="Back to home"
        >
          <div className="inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-md bg-primary px-2 text-[12px] font-bold whitespace-nowrap text-primary-foreground ring-1 ring-border">
            LIBRARY LOGO
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative mr-2" asChild>
          <Link to="/checkout" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {cartItems.length > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full p-0 text-[10px]"
              >
                {cartItems.length}
              </Badge>
            )}
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setTheme(
              theme === "dark" ||
                (theme === "system" &&
                  window.matchMedia("(prefers-color-scheme: dark)").matches)
                ? "light"
                : "dark"
            )
          }
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {isLoggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shadow-md transition-opacity outline-none hover:opacity-90">
                <Avatar className="h-9 w-9 bg-transparent">
                  <AvatarFallback className="bg-transparent text-sm font-bold text-white">
                    {avatarInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/user-dashboard" className="w-full cursor-pointer">
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="w-full cursor-pointer"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="outline">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
