import { type NextRequest, NextResponse } from "next/server"
import { processTransaction } from "@/app/actions/transactions"

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json()

    // Log the callback data
    console.log("M-Pesa Callback Data:", JSON.stringify(callbackData, null, 2))

    // Extract the necessary information from the callback
    const { Body } = callbackData

    if (Body.stkCallback) {
      const { ResultCode, ResultDesc, CheckoutRequestID, MerchantRequestID } = Body.stkCallback

      if (ResultCode === 0) {
        // Transaction successful
        const callbackMetadata = Body.stkCallback.CallbackMetadata

        if (callbackMetadata && callbackMetadata.Item) {
          // Extract transaction details
          const mpesaReceiptNumber =
            callbackMetadata.Item.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value || ""
          const transactionDate =
            callbackMetadata.Item.find((item: any) => item.Name === "TransactionDate")?.Value || ""
          const phoneNumber = callbackMetadata.Item.find((item: any) => item.Name === "PhoneNumber")?.Value || ""

          // Process the transaction
          await processTransaction(
            CheckoutRequestID,
            MerchantRequestID,
            transactionDate.toString(),
            mpesaReceiptNumber.toString(),
          )

          console.log(`Transaction ${CheckoutRequestID} successful`)
        }
      } else {
        // Transaction failed
        console.log(`Transaction ${CheckoutRequestID} failed: ${ResultDesc}`)

        // Update transaction status to failed
        // This would be implemented in a real application
      }
    }

    // Return a success response to M-Pesa
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback received successfully",
    })
  } catch (error) {
    console.error("Error processing M-Pesa callback:", error)

    // Return an error response
    return NextResponse.json(
      {
        ResultCode: 1,
        ResultDesc: "Error processing callback",
      },
      { status: 500 },
    )
  }
}
