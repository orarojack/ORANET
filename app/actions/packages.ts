"use server"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface Package {
  id: string
  name: string
  type: "time" | "data" | "special"
  duration: string
  short_duration?: string
  price: number
  devices: number
  extra_time?: boolean
  speed?: string
  data_allowance?: string
  features?: string[]
  is_popular?: boolean
  is_recommended?: boolean
}

export async function getPackages(type?: "time" | "data" | "special"): Promise<Package[]> {
  try {
    let query = `
      SELECT 
        id, name, type, duration, short_duration, price, devices, 
        extra_time, speed, data_allowance, features, 
        is_popular, is_recommended
      FROM packages
      WHERE is_active = true
    `

    const params: any[] = []

    if (type) {
      query += ` AND type = $1`
      params.push(type)
    }

    query += ` ORDER BY price ASC`

    const packages = await sql.query(query, params)

    return packages.map((pkg: any) => ({
      ...pkg,
      features: pkg.features ? pkg.features : undefined,
    }))
  } catch (error) {
    console.error("Error fetching packages:", error)
    return []
  }
}

export async function getPackageById(id: string): Promise<Package | null> {
  try {
    const packages = await sql`
      SELECT 
        id, name, type, duration, short_duration, price, devices, 
        extra_time, speed, data_allowance, features, 
        is_popular, is_recommended
      FROM packages
      WHERE id = ${id} AND is_active = true
    `

    if (packages.length === 0) {
      return null
    }

    const pkg = packages[0]
    return {
      ...pkg,
      features: pkg.features ? pkg.features : undefined,
    }
  } catch (error) {
    console.error("Error fetching package:", error)
    return null
  }
}
