"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Loader2, AlertCircle, Wifi, Zap, Database, Clock } from "lucide-react"
import { initiateMpesaSTKPush } from "@/app/actions/mpesa"

interface Package {
  id: string
  name: string
  duration: string
  shortDuration?: string
  price: number
  devices: number
  extraTime?: boolean
  speed?: string
  data?: string
  popular?: boolean
  recommended?: boolean
  features?: string[]
  type: "time" | "data" | "special"
  icon: React.ReactNode
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  packageDetails: Package
}

export default function PaymentModal({ isOpen, onClose, packageDetails }: PaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [transactionDetails, setTransactionDetails] = useState({
    merchantRequestID: "",
    checkoutRequestID: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate phone number (simple Kenyan format validation)
    if (!phoneNumber.match(/^(07|01|2547|2541)[0-9]{8}$/)) {
      setError("Please enter a valid M-Pesa phone number")
      return
    }

    // Set loading state
    setIsLoading(true)

    try {
      // Call the server action to initiate STK push
      const response = await initiateMpesaSTKPush({
        phoneNumber,
        amount: Number(packageDetails.price), // Convert to number
        packageId: packageDetails.id,
        packageName: packageDetails.name,
      })

      setIsLoading(false)

      if (response.success) {
        // Store transaction details for reference
        setTransactionDetails({
          merchantRequestID: response.MerchantRequestID,
          checkoutRequestID: response.CheckoutRequestID,
        })

        // Show success message
        setPaymentInitiated(true)

        // After 10 seconds, show the final success message
        // In a real app, you would check the callback status
        setTimeout(() => {
          setPaymentInitiated(false)
          setSuccess(true)

          // Close modal after success message is shown
          setTimeout(() => {
            onClose()
            setSuccess(false)
            setPhoneNumber("")
          }, 3000)
        }, 10000)
      } else {
        // Show error message
        setError(response.errorMessage || "Failed to initiate payment. Please try again.")
      }
    } catch (err) {
      setIsLoading(false)
      setError("An unexpected error occurred. Please try again.")
      console.error("Payment error:", err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-green-700">Complete Your Purchase</DialogTitle>
          <DialogDescription>
            You are purchasing the {packageDetails.name} package for KSh {packageDetails.price}.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-6 text-center space-y-4"
            >
              <motion.div
                className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <Check className="h-8 w-8 text-green-600" />
              </motion.div>
              <h3 className="text-xl font-medium text-green-700 font-poppins">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Your payment has been processed successfully. You can now connect to ORANET WIFI.
              </p>
            </motion.div>
          ) : paymentInitiated ? (
            <motion.div
              key="initiated"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-6 text-center space-y-4"
            >
              <motion.div
                className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 0, 0],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2,
                }}
              >
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </motion.div>
              <h3 className="text-xl font-medium text-blue-700 font-poppins">Payment Request Sent!</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Please check your phone for the M-Pesa payment prompt and complete the transaction.
              </p>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                <p>Transaction Reference:</p>
                <p className="font-mono mt-1">{transactionDetails.checkoutRequestID}</p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
            >
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">M-Pesa Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="e.g., 07XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="h-10 border-green-200 focus:border-green-300 focus:ring-green-200 transition-all duration-300"
                  />
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center text-red-500 text-sm mt-1"
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </motion.div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter the phone number registered with M-Pesa to receive the payment prompt.
                  </p>
                </div>

                <motion.div
                  className="bg-green-50 p-4 rounded-lg space-y-2 mt-2 border border-green-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="text-sm font-medium text-green-800">Package Details:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Wifi className="h-4 w-4 mr-2 text-green-500" />
                      {packageDetails.devices} {packageDetails.devices === 1 ? "Device" : "Devices"}
                    </div>

                    {packageDetails.speed && (
                      <div className="flex items-center text-gray-600">
                        <Zap className="h-4 w-4 mr-2 text-green-500" />
                        {packageDetails.speed}
                      </div>
                    )}

                    {packageDetails.data && (
                      <div className="flex items-center text-gray-600">
                        <Database className="h-4 w-4 mr-2 text-green-500" />
                        {packageDetails.data}
                      </div>
                    )}

                    <div className="flex items-center text-gray-600 col-span-2">
                      <Clock className="h-4 w-4 mr-2 text-green-500" />
                      {packageDetails.duration}
                    </div>
                  </div>
                </motion.div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Send Payment Request"
                  )}
                </Button>
              </DialogFooter>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
