"use server"

import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { getUserById } from "./auth"
import { createVoucher, extendVoucher, getVoucherById } from "./vouchers"

const sql = neon(process.env.DATABASE_URL!)

// Define validation schema for the form data
const mpesaFormSchema = z.object({
  phoneNumber: z.string().regex(/^(07|01|2547|2541)[0-9]{8}$/, "Invalid phone number format"),
  amount: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === "string" ? Number.parseFloat(val) : val
    if (isNaN(num) || num <= 0) {
      throw new Error("Amount must be a positive number")
    }
    return num
  }),
  packageId: z.string(),
  packageName: z.string(),
})

// Type for the form data
type MpesaFormData = z.infer<typeof mpesaFormSchema>

// Type for the API response
interface STKPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
  errorMessage?: string
  success?: boolean
}

export interface Transaction {
  id: string
  user_id: string
  voucher_id?: string
  package_id?: string
  transaction_type: "purchase" | "extension" | "refund"
  amount: number
  phone_number: string
  mpesa_transaction_id?: string
  mpesa_receipt_number?: string
  checkout_request_id: string
  merchant_request_id: string
  status: "pending" | "completed" | "failed" | "cancelled"
  created_at: string
  updated_at: string
}

export async function initiateMpesaSTKPush(formData: MpesaFormData): Promise<STKPushResponse> {
  try {
    // Validate the form data
    const validatedData = mpesaFormSchema.parse(formData)

    // Format phone number to include country code if needed
    let phoneNumber = validatedData.phoneNumber
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "254" + phoneNumber.substring(1)
    }

    // Get the current timestamp in the format YYYYMMDDHHmmss
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14)

    // Get environment variables
    const businessShortCode = process.env.MPESA_BUSINESS_SHORT_CODE
    const passKey = process.env.MPESA_PASS_KEY
    const consumerKey = process.env.MPESA_CONSUMER_KEY
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET
    const callbackUrl = process.env.MPESA_CALLBACK_URL

    if (!businessShortCode || !passKey || !consumerKey || !consumerSecret || !callbackUrl) {
      throw new Error("Missing required environment variables for M-Pesa integration")
    }

    // Generate the password (base64 of shortcode + passkey + timestamp)
    const password = Buffer.from(businessShortCode + passKey + timestamp).toString("base64")

    // Get the access token
    const authResponse = await fetch("https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      method: "GET",
      headers: {
        Authorization: "Basic " + Buffer.from(consumerKey + ":" + consumerSecret).toString("base64"),
      },
    })

    if (!authResponse.ok) {
      throw new Error("Failed to get authentication token")
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // Prepare the STK push request
    const stkPushRequestBody = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: validatedData.amount,
      PartyA: phoneNumber,
      PartyB: businessShortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: `ORANET-${validatedData.packageId}`,
      TransactionDesc: `Payment for ${validatedData.packageName} package`,
    }

    // Make the STK push request
    const stkPushResponse = await fetch("https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPushRequestBody),
    })

    const responseData = await stkPushResponse.json()

    // Get user ID from session (in a real app)
    // For now, we'll use a mock user ID if not available
    const userId = "00000000-0000-0000-0000-000000000000" // Replace with actual user ID from session

    // Determine if this is a purchase or extension
    const transactionType = validatedData.packageId.startsWith("extend-") ? "extension" : "purchase"

    // Extract the actual package/voucher ID if it's an extension
    const actualId =
      transactionType === "extension" ? validatedData.packageId.replace("extend-", "") : validatedData.packageId

    // Record the transaction
    if (responseData.ResponseCode === "0") {
      await sql`
        INSERT INTO transactions (
          user_id, 
          ${transactionType === "purchase" ? "package_id" : "voucher_id"}, 
          transaction_type, 
          amount, 
          phone_number, 
          checkout_request_id, 
          merchant_request_id, 
          status
        )
        VALUES (
          ${userId}, 
          ${actualId}, 
          ${transactionType}, 
          ${validatedData.amount}, 
          ${phoneNumber}, 
          ${responseData.CheckoutRequestID}, 
          ${responseData.MerchantRequestID}, 
          'pending'
        )
      `

      return {
        ...responseData,
        success: true,
      }
    } else {
      return {
        ...responseData,
        success: false,
        errorMessage: responseData.errorMessage || "Failed to initiate payment",
      }
    }
  } catch (error) {
    console.error("Error initiating M-Pesa STK push:", error)

    if (error instanceof z.ZodError) {
      return {
        MerchantRequestID: "",
        CheckoutRequestID: "",
        ResponseCode: "1",
        ResponseDescription: "Validation Error",
        CustomerMessage: "Please check your input and try again",
        errorMessage: error.errors[0].message,
        success: false,
      }
    }

    return {
      MerchantRequestID: "",
      CheckoutRequestID: "",
      ResponseCode: "1",
      ResponseDescription: "Error",
      CustomerMessage: "An error occurred while processing your request",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      success: false,
    }
  }
}

export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  try {
    // Verify user exists
    const user = await getUserById(userId)
    if (!user) {
      throw new Error("User not found")
    }

    const transactions = await sql`
      SELECT * FROM transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return transactions
  } catch (error) {
    console.error("Error fetching user transactions:", error)
    return []
  }
}

export async function processTransaction(
  checkoutRequestId: string,
  merchantRequestId: string,
  mpesaTransactionId: string,
  mpesaReceiptNumber: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Find the transaction
    const transactions = await sql`
      SELECT * FROM transactions
      WHERE checkout_request_id = ${checkoutRequestId}
      AND merchant_request_id = ${merchantRequestId}
      AND status = 'pending'
    `

    if (transactions.length === 0) {
      return { success: false, message: "Transaction not found or already processed" }
    }

    const transaction = transactions[0]

    // Update the transaction with M-Pesa details
    await sql`
      UPDATE transactions
      SET 
        mpesa_transaction_id = ${mpesaTransactionId},
        mpesa_receipt_number = ${mpesaReceiptNumber},
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${transaction.id}
    `

    // Process based on transaction type
    if (transaction.transaction_type === "purchase") {
      // Create a new voucher
      const result = await createVoucher(transaction.user_id, transaction.package_id, transaction.id)
      return {
        success: result.success,
        message: result.success ? "Voucher created successfully" : result.message || "Failed to create voucher",
      }
    } else if (transaction.transaction_type === "extension") {
      // Get the voucher details
      const voucher = await getVoucherById(transaction.voucher_id)
      if (!voucher) {
        return { success: false, message: "Voucher not found" }
      }

      // Calculate hours based on amount paid
      let hours = 0
      if (transaction.amount <= 10) hours = 1
      else if (transaction.amount <= 25) hours = 3
      else if (transaction.amount <= 45) hours = 12
      else hours = 24

      // Extend the voucher
      const result = await extendVoucher(transaction.voucher_id, transaction.user_id, hours, transaction.id)
      return {
        success: result.success,
        message: result.success ? "Voucher extended successfully" : result.message || "Failed to extend voucher",
      }
    }

    return { success: true, message: "Transaction processed successfully" }
  } catch (error) {
    console.error("Error processing transaction:", error)
    return { success: false, message: "An error occurred while processing the transaction" }
  }
}
