"use server"

import { z } from "zod"

// Define validation schema for the form data
const mpesaFormSchema = z.object({
  phoneNumber: z.string().regex(/^(07|01|2547|2541)[0-9]{8}$/, "Invalid phone number format"),
  amount: z.number().positive("Amount must be positive"),
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
    const authResponse = await fetch(
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: "Basic " + Buffer.from(consumerKey + ":" + consumerSecret).toString("base64"),
        },
      },
    )

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

    if (responseData.ResponseCode === "0") {
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
