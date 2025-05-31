"use server"

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import { z } from "zod"

const sql = neon(process.env.DATABASE_URL!)

// Validation schemas
const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^(07|01|2547|2541)[0-9]{8}$/, "Invalid phone number format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export interface User {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
  email_verified: boolean
  phone_verified: boolean
}

export interface AuthResult {
  success: boolean
  message: string
  user?: User
}

export async function signupUser(formData: {
  name: string
  email: string
  phone: string
  password: string
}): Promise<AuthResult> {
  try {
    // Validate input
    const validatedData = signupSchema.parse(formData)

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${validatedData.email} OR phone = ${validatedData.phone}
    `

    if (existingUser.length > 0) {
      return {
        success: false,
        message: "User with this email or phone number already exists",
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // Format phone number
    let phoneNumber = validatedData.phone
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "254" + phoneNumber.substring(1)
    }

    // Create user
    const newUser = await sql`
      INSERT INTO users (name, email, phone, password_hash)
      VALUES (${validatedData.name}, ${validatedData.email}, ${phoneNumber}, ${passwordHash})
      RETURNING id, name, email, phone, created_at, email_verified, phone_verified
    `

    if (newUser.length === 0) {
      return {
        success: false,
        message: "Failed to create user account",
      }
    }

    return {
      success: true,
      message: "Account created successfully",
      user: newUser[0] as User,
    }
  } catch (error) {
    console.error("Signup error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message,
      }
    }

    return {
      success: false,
      message: "An error occurred while creating your account",
    }
  }
}

export async function loginUser(formData: { email: string; password: string }): Promise<AuthResult> {
  try {
    // Validate input
    const validatedData = loginSchema.parse(formData)

    // Find user by email
    const users = await sql`
      SELECT id, name, email, phone, password_hash, created_at, email_verified, phone_verified, is_active
      FROM users 
      WHERE email = ${validatedData.email}
    `

    if (users.length === 0) {
      return {
        success: false,
        message: "Invalid email or password",
      }
    }

    const user = users[0]

    // Check if user is active
    if (!user.is_active) {
      return {
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password_hash)

    if (!isPasswordValid) {
      return {
        success: false,
        message: "Invalid email or password",
      }
    }

    // Return user data (excluding password hash)
    const { password_hash, is_active, ...userData } = user

    return {
      success: true,
      message: "Login successful",
      user: userData as User,
    }
  } catch (error) {
    console.error("Login error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message,
      }
    }

    return {
      success: false,
      message: "An error occurred while logging in",
    }
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const users = await sql`
      SELECT id, name, email, phone, created_at, email_verified, phone_verified
      FROM users 
      WHERE id = ${userId} AND is_active = true
    `

    if (users.length === 0) {
      return null
    }

    return users[0] as User
  } catch (error) {
    console.error("Get user error:", error)
    return null
  }
}
