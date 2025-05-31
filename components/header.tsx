"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wifi, Phone, HelpCircle, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FaWhatsapp } from "react-icons/fa"
import { useAuth } from "@/hooks/use-auth"
import AuthModal from "./auth/auth-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function Header() {
  const { user, logout } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login")
  const pathname = usePathname()

  const openLoginModal = () => {
    setAuthModalTab("login")
    setIsAuthModalOpen(true)
  }

  const openSignupModal = () => {
    setAuthModalTab("signup")
    setIsAuthModalOpen(true)
  }

  const handleLogout = () => {
    logout()
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full glass-effect border-b border-green-100 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 animate-fade-in">
            <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-2 rounded-lg shadow-lg animate-pulse-slow">
              <Wifi className="h-5 w-5" />
            </div>
            <span className="font-poppins text-xl font-extrabold gradient-text fancy-text">ORANET WIFI</span>
          </Link>

          <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <a
              href="tel:0703781668"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-center h-8 w-8 bg-green-100 rounded-full shadow-md hover:shadow-lg transition-all duration-300">
                <Phone className="h-4 w-4 text-green-600" />
              </div>
              <span className="font-medium hidden sm:inline">0703781668</span>
            </a>

            <a
              href="https://wa.me/254703781668"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-center h-8 w-8 bg-green-100 rounded-full shadow-md hover:shadow-lg transition-all duration-300">
                <FaWhatsapp className="h-4 w-4 text-green-600" />
              </div>
              <span className="font-medium hidden sm:inline">WhatsApp</span>
            </a>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-2 gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-100 text-green-700">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard">
                    <DropdownMenuItem className={pathname === "/dashboard" ? "bg-green-50" : ""}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex hover:bg-green-100 hover:text-green-700 transition-all duration-300"
                  onClick={openLoginModal}
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 transition-all duration-300"
                  onClick={openSignupModal}
                >
                  Sign Up
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="ml-2 hidden sm:flex hover:bg-green-100 transition-all duration-300"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultTab={authModalTab} />
    </header>
  )
}
