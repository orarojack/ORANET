"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { signupUser, loginUser, getUserById, type User, type AuthResult } from "@/app/actions/auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  signup: (name: string, email: string, phone: string, password: string) => Promise<AuthResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedUserId = localStorage.getItem("oranet_user_id")
      if (storedUserId) {
        try {
          const userData = await getUserById(storedUserId)
          if (userData) {
            setUser(userData)
          } else {
            // Invalid user ID, clear storage
            localStorage.removeItem("oranet_user_id")
          }
        } catch (error) {
          console.error("Failed to get user data:", error)
          localStorage.removeItem("oranet_user_id")
        }
      }
      setIsLoading(false)
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await loginUser({ email, password })

      if (result.success && result.user) {
        // Store user ID in localStorage
        localStorage.setItem("oranet_user_id", result.user.id)
        setUser(result.user)
      }

      return result
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        message: "An error occurred while logging in",
      }
    }
  }

  const signup = async (name: string, email: string, phone: string, password: string): Promise<AuthResult> => {
    try {
      const result = await signupUser({ name, email, phone, password })
      return result
    } catch (error) {
      console.error("Signup error in hook:", error)
      return {
        success: false,
        message: "An error occurred while creating your account",
      }
    }
  }

  const logout = () => {
    localStorage.removeItem("oranet_user_id")
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
