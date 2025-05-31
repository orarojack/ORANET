"use server"

import { neon } from "@neondatabase/serverless"
import { getUserById } from "./auth"

const sql = neon(process.env.DATABASE_URL!)

export interface Voucher {
  id: string
  user_id: string
  package_id: string
  voucher_code: string
  status: "active" | "expired" | "used"
  purchase_date: string
  expiry_date: string
  remaining_time: number // in seconds
  original_duration: number // in seconds
  devices_allowed: number
  speed?: string
  data_allowance?: string
  package_name?: string
}

export async function getUserVouchers(userId: string): Promise<Voucher[]> {
  try {
    // Verify user exists
    const user = await getUserById(userId)
    if (!user) {
      throw new Error("User not found")
    }

    const vouchers = await sql`
      SELECT 
        v.id, v.user_id, v.package_id, v.voucher_code, v.status,
        v.purchase_date, v.expiry_date, v.remaining_time, v.original_duration,
        v.devices_allowed, v.speed, v.data_allowance,
        p.name as package_name
      FROM vouchers v
      LEFT JOIN packages p ON v.package_id = p.id
      WHERE v.user_id = ${userId}
      ORDER BY 
        CASE WHEN v.status = 'active' THEN 0
             WHEN v.status = 'used' THEN 1
             ELSE 2
        END,
        v.purchase_date DESC
    `

    return vouchers
  } catch (error) {
    console.error("Error fetching user vouchers:", error)
    return []
  }
}

export async function getVoucherById(voucherId: string, userId?: string): Promise<Voucher | null> {
  try {
    let query = `
      SELECT 
        v.id, v.user_id, v.package_id, v.voucher_code, v.status,
        v.purchase_date, v.expiry_date, v.remaining_time, v.original_duration,
        v.devices_allowed, v.speed, v.data_allowance,
        p.name as package_name
      FROM vouchers v
      LEFT JOIN packages p ON v.package_id = p.id
      WHERE v.id = $1
    `

    const params: any[] = [voucherId]

    // If userId is provided, ensure the voucher belongs to this user
    if (userId) {
      query += ` AND v.user_id = $2`
      params.push(userId)
    }

    const vouchers = await sql.query(query, params)

    if (vouchers.length === 0) {
      return null
    }

    return vouchers[0]
  } catch (error) {
    console.error("Error fetching voucher:", error)
    return null
  }
}

export async function getVoucherByCode(code: string): Promise<Voucher | null> {
  try {
    const vouchers = await sql`
      SELECT 
        v.id, v.user_id, v.package_id, v.voucher_code, v.status,
        v.purchase_date, v.expiry_date, v.remaining_time, v.original_duration,
        v.devices_allowed, v.speed, v.data_allowance,
        p.name as package_name
      FROM vouchers v
      LEFT JOIN packages p ON v.package_id = p.id
      WHERE v.voucher_code = ${code}
    `

    if (vouchers.length === 0) {
      return null
    }

    return vouchers[0]
  } catch (error) {
    console.error("Error fetching voucher by code:", error)
    return null
  }
}

export async function createVoucher(
  userId: string,
  packageId: string,
  transactionId: string,
): Promise<{ success: boolean; voucher?: Voucher; message?: string }> {
  try {
    // Get the package details
    const packageDetails = await sql`
      SELECT * FROM packages WHERE id = ${packageId} AND is_active = true
    `

    if (packageDetails.length === 0) {
      return { success: false, message: "Package not found" }
    }

    const pkg = packageDetails[0]

    // Calculate expiry date and duration in seconds
    let durationInSeconds = 0
    const expiryDate = new Date()

    if (pkg.type === "time") {
      // Parse duration string to get seconds
      if (pkg.short_duration?.includes("m") && !pkg.short_duration?.includes("min")) {
        // It's months
        const months = Number.parseInt(pkg.short_duration.replace("m", ""))
        expiryDate.setMonth(expiryDate.getMonth() + months)
        durationInSeconds = months * 30 * 24 * 60 * 60 // Approximate
      } else if (pkg.short_duration?.includes("w")) {
        // It's weeks
        const weeks = Number.parseInt(pkg.short_duration.replace("w", ""))
        expiryDate.setDate(expiryDate.getDate() + weeks * 7)
        durationInSeconds = weeks * 7 * 24 * 60 * 60
      } else if (pkg.short_duration?.includes("d")) {
        // It's days
        const days = Number.parseInt(pkg.short_duration.replace("d", ""))
        expiryDate.setDate(expiryDate.getDate() + days)
        durationInSeconds = days * 24 * 60 * 60
      } else if (pkg.short_duration?.includes("h")) {
        // It's hours
        const hours = Number.parseInt(pkg.short_duration.replace("h", ""))
        expiryDate.setHours(expiryDate.getHours() + hours)
        durationInSeconds = hours * 60 * 60
      } else if (pkg.short_duration?.includes("min")) {
        // It's minutes
        const minutes = Number.parseInt(pkg.short_duration.replace("min", ""))
        expiryDate.setMinutes(expiryDate.getMinutes() + minutes)
        durationInSeconds = minutes * 60
      } else {
        // Default to 24 hours
        expiryDate.setHours(expiryDate.getHours() + 24)
        durationInSeconds = 24 * 60 * 60
      }
    } else if (pkg.type === "data" || pkg.type === "special") {
      // For data and special packages, parse the duration string
      if (pkg.duration.includes("days")) {
        const daysMatch = pkg.duration.match(/(\d+)\s*days/)
        const days = daysMatch ? Number.parseInt(daysMatch[1]) : 7
        expiryDate.setDate(expiryDate.getDate() + days)
        durationInSeconds = days * 24 * 60 * 60
      } else if (pkg.duration.includes("day")) {
        const daysMatch = pkg.duration.match(/(\d+)\s*day/)
        const days = daysMatch ? Number.parseInt(daysMatch[1]) : 1
        expiryDate.setDate(expiryDate.getDate() + days)
        durationInSeconds = days * 24 * 60 * 60
      } else {
        // Default to 7 days
        expiryDate.setDate(expiryDate.getDate() + 7)
        durationInSeconds = 7 * 24 * 60 * 60
      }
    }

    // Generate a unique voucher code
    const voucherCode = `WIFI-${Math.floor(1000 + Math.random() * 9000)}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`

    // Create the voucher
    const newVoucher = await sql`
      INSERT INTO vouchers (
        user_id, package_id, voucher_code, status, 
        purchase_date, expiry_date, remaining_time, original_duration,
        devices_allowed, speed, data_allowance
      )
      VALUES (
        ${userId}, ${packageId}, ${voucherCode}, 'active',
        CURRENT_TIMESTAMP, ${expiryDate.toISOString()}, ${durationInSeconds}, ${durationInSeconds},
        ${pkg.devices}, ${pkg.speed}, ${pkg.data_allowance}
      )
      RETURNING 
        id, user_id, package_id, voucher_code, status,
        purchase_date, expiry_date, remaining_time, original_duration,
        devices_allowed, speed, data_allowance
    `

    if (newVoucher.length === 0) {
      return { success: false, message: "Failed to create voucher" }
    }

    // Update the transaction with the voucher ID
    await sql`
      UPDATE transactions 
      SET voucher_id = ${newVoucher[0].id}, status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${transactionId}
    `

    return {
      success: true,
      voucher: {
        ...newVoucher[0],
        package_name: pkg.name,
      },
    }
  } catch (error) {
    console.error("Error creating voucher:", error)
    return { success: false, message: "An error occurred while creating the voucher" }
  }
}

export async function extendVoucher(
  voucherId: string,
  userId: string,
  hours: number,
  transactionId: string,
): Promise<{ success: boolean; voucher?: Voucher; message?: string }> {
  try {
    // Get the voucher
    const voucher = await getVoucherById(voucherId, userId)

    if (!voucher) {
      return { success: false, message: "Voucher not found" }
    }

    if (voucher.status !== "active") {
      return { success: false, message: "Cannot extend an expired or used voucher" }
    }

    // Calculate additional seconds
    const additionalSeconds = hours * 60 * 60

    // Calculate new expiry date
    const currentExpiryDate = new Date(voucher.expiry_date)
    const newExpiryDate = new Date(currentExpiryDate.getTime() + additionalSeconds * 1000)

    // Update the voucher
    const updatedVoucher = await sql`
      UPDATE vouchers
      SET 
        expiry_date = ${newExpiryDate.toISOString()},
        remaining_time = remaining_time + ${additionalSeconds},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${voucherId} AND user_id = ${userId}
      RETURNING 
        id, user_id, package_id, voucher_code, status,
        purchase_date, expiry_date, remaining_time, original_duration,
        devices_allowed, speed, data_allowance
    `

    if (updatedVoucher.length === 0) {
      return { success: false, message: "Failed to extend voucher" }
    }

    // Record the extension
    await sql`
      INSERT INTO voucher_extensions (
        voucher_id, transaction_id, extension_hours, extension_seconds, amount_paid
      )
      VALUES (
        ${voucherId}, ${transactionId}, ${hours}, ${additionalSeconds}, 
        (SELECT amount FROM transactions WHERE id = ${transactionId})
      )
    `

    // Update the transaction status
    await sql`
      UPDATE transactions 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${transactionId}
    `

    // Get the package name
    const packageDetails = await sql`
      SELECT name FROM packages WHERE id = ${voucher.package_id}
    `

    return {
      success: true,
      voucher: {
        ...updatedVoucher[0],
        package_name: packageDetails.length > 0 ? packageDetails[0].name : undefined,
      },
    }
  } catch (error) {
    console.error("Error extending voucher:", error)
    return { success: false, message: "An error occurred while extending the voucher" }
  }
}
