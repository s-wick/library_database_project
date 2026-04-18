import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Moon, Sun, ArrowLeft, ShoppingCart, Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "@/components/theme-provider"
import { useCart } from "@/app/cart-provider"
import { API_BASE_URL } from "@/lib/api-config"
import icon from "@/assets/icon.png"

function formatShortDate(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

function getNotificationTone(type) {
  const normalized = String(type || "").toLowerCase()

  if (normalized === "hold grace started") {
    return {
      messageClass: "text-amber-700 dark:text-amber-300",
      typeClass: "text-amber-600 dark:text-amber-400",
    }
  }

  if (normalized === "removed hold") {
    return {
      messageClass: "text-red-700 dark:text-red-300",
      typeClass: "text-red-600 dark:text-red-400",
    }
  }

  return {
    messageClass: "text-foreground",
    typeClass: "text-muted-foreground",
  }
}

async function acknowledgeNotification({ notificationId, userId }) {
  const response = await fetch(`${API_BASE_URL}/api/notifications/ack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationId, userId }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "Failed to acknowledge notification")
  }
}

export function Navbar({ showBack = true }) {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { cartItems, clearFrontendCart } = useCart()

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const stored = sessionStorage.getItem("isLoggedIn")
    return stored === "true"
  })

  const [userProfile, setUserProfile] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [notificationsStatus, setNotificationsStatus] = useState("idle")
  const [acknowledging, setAcknowledging] = useState(() => new Set())

  let avatarInitials = "U"
  const isStaff =
    userProfile?.accountType === "staff" ||
    userProfile?.roleGroup === "adminStaff"

  if (userProfile?.firstName && userProfile?.lastName) {
    avatarInitials =
      `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase()
  } else if (userProfile?.email) {
    avatarInitials = userProfile.email[0].toUpperCase()
  }

  useEffect(() => {
    if (!isLoggedIn) {
      setUserProfile(null)
      return
    }

    try {
      const storedUser = sessionStorage.getItem("user")
      setUserProfile(storedUser ? JSON.parse(storedUser) : null)
    } catch (err) {
      setUserProfile(null)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn || isStaff || !userProfile?.id) {
      setNotifications([])
      setNotificationsStatus("idle")
      return undefined
    }

    const loadNotifications = async (signal) => {
      try {
        setNotificationsStatus("loading")
        const response = await fetch(
          `${API_BASE_URL}/api/notifications?userId=${userProfile.id}`,
          { signal }
        )
        const data = await response.json().catch(() => ({}))

        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "Failed to load notifications")
        }

        setNotifications(
          Array.isArray(data.notifications) ? data.notifications : []
        )
        setNotificationsStatus("ready")
      } catch (error) {
        if (error.name === "AbortError") return
        setNotifications([])
        setNotificationsStatus("error")
      }
    }

    const controller = new AbortController()

    loadNotifications(controller.signal)

    return () => {
      controller.abort()
    }
  }, [isLoggedIn, isStaff, userProfile?.id])

  const handleAcknowledge = async (notificationId) => {
    if (!userProfile?.id) return
    setAcknowledging((prev) => new Set(prev).add(notificationId))

    try {
      await acknowledgeNotification({
        notificationId,
        userId: userProfile.id,
      })
      setNotifications((prev) =>
        prev.filter((item) => item.notificationId !== notificationId)
      )
    } catch (error) {
      setNotificationsStatus("error")
    } finally {
      setAcknowledging((prev) => {
        const next = new Set(prev)
        next.delete(notificationId)
        return next
      })
    }
  }

  const handleSignOut = () => {
    sessionStorage.setItem("isLoggedIn", "false")
    sessionStorage.removeItem("user")
    setIsLoggedIn(false)
    clearFrontendCart()
    navigate("/")
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
          className="group flex items-center gap-2 transition-opacity hover:opacity-90"
          aria-label="Back to home"
        >
          <img
            src={icon}
            alt="Hungry Library"
            className="mr-3 h-10 w-10 object-contain"
          />
          <span className="[font-family:var(--font-logo)] text-3xl font-bold tracking-wide whitespace-nowrap text-green-700 drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] dark:drop-shadow-none">
            LIBRARY
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {isLoggedIn && !isStaff && (
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
        )}

        {isLoggedIn && !isStaff && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full p-0 text-[10px]"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <DropdownMenuLabel className="px-3 py-2">
                Notifications
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notificationsStatus === "loading" && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Loading notifications...
                </div>
              )}
              {notificationsStatus === "error" && (
                <div className="px-3 py-2 text-sm text-destructive">
                  Unable to load notifications.
                </div>
              )}
              {notificationsStatus !== "loading" &&
                notifications.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    You are all caught up.
                  </div>
                )}
              {notifications.map((notification) => {
                const tone = getNotificationTone(notification.type)

                return (
                  <DropdownMenuItem
                    key={notification.notificationId}
                    className="flex flex-col items-start gap-1 px-3 py-2"
                    onSelect={(event) => event.preventDefault()}
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <div
                        className={`text-sm font-medium ${tone.messageClass}`}
                      >
                        {notification.message}
                      </div>
                      <button
                        type="button"
                        className="rounded p-1 text-muted-foreground transition hover:text-foreground"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          handleAcknowledge(notification.notificationId)
                        }}
                        aria-label="Acknowledge notification"
                        disabled={acknowledging.has(
                          notification.notificationId
                        )}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                      <span className={tone.typeClass}>
                        {notification.type}
                      </span>
                      <span>{formatShortDate(notification.createdAt)}</span>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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
                <Link
                  to={isStaff ? "/management-dashboard" : "/user-dashboard"}
                  className="w-full cursor-pointer"
                >
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
