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
import { Check, Loader2, AlertCircle, Clock } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { initiateMpesaSTKPush } from "@/app/actions/mpesa"

interface ExtensionOption {
  id: string
  duration: string
  hours: number
  price: number
}

interface ExtendTimeModalProps {
  isOpen: boolean
  onClose: () => void
  voucherId: string
  onSuccess: (additionalHours: number) => void
}

export default function ExtendTimeModal({ isOpen, onClose, voucherId, onSuccess }: ExtendTimeModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedOption, setSelectedOption] = useState<string>("option1")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [success, setSuccess] = useState(false)
  const [transactionDetails, setTransactionDetails] = useState({
    merchantRequestID: "",
    checkoutRequestID: "",
  })

  const extensionOptions: ExtensionOption[] = [
    {
      id: "option1",
      duration: "1 Hour",
      hours: 1,
      price: 10,
    },
    {
      id: "option2",
      duration: "3 Hours",
      hours: 3,
      price: 25,
    },
    {
      id: "option3",
      duration: "12 Hours",
      hours: 12,
      price: 45,
    },
    {
      id: "option4",
      duration: "24 Hours",
      hours: 24,
      price: 60,
    },
  ]

  const selectedExtensionOption = extensionOptions.find((option) => option.id === selectedOption)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate phone number (simple Kenyan format validation)
    if (!phoneNumber.match(/^(07|01|2547|2541)[0-9]{8}$/)) {
      setError("Please enter a valid M-Pesa phone number")
      return
    }

    if (!selectedExtensionOption) {
      setError("Please select an extension option")
      return
    }

    // Set loading state
    setIsLoading(true)

    try {
      // Call the server action to initiate STK push
      const response = await initiateMpesaSTKPush({
        phoneNumber,
        amount: Number(selectedExtensionOption.price), // Convert to number
        packageId: `extend-${voucherId}`,
        packageName: `Time Extension (${selectedExtensionOption.duration})`,
      })

      setIsLoading(false)

      if (response.success) {
        // Store transaction details for reference
        setTransactionDetails({
          merchantRequestID: response.MerchantRequestID,
          checkoutRequestID: response.CheckoutRequestID,
        })

        // Show payment initiated message
        setPaymentInitiated(true)

        // After 10 seconds, show the final success message
        // In a real app, you would check the callback status
        setTimeout(() => {
          setPaymentInitiated(false)
          setSuccess(true)

          // Close modal after success message is shown and update the voucher time
          setTimeout(() => {
            onSuccess(selectedExtensionOption.hours)
            onClose()
            setSuccess(false)
            setPhoneNumber("")
            setSelectedOption("option1")
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
          <DialogTitle className="text-xl text-green-700">Extend Your Connection Time</DialogTitle>
          <DialogDescription>
            Select how much time you want to add to your current connection and complete the payment.
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
              <h3 className="text-xl font-medium text-green-700 font-poppins">Time Extended!</h3>
              <p className="text-sm text-muted-foreground">
                Your connection time has been extended by {selectedExtensionOption?.duration}.
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
                  <Label htmlFor="extension">Select Extension Duration</Label>
                  <RadioGroup
                    value={selectedOption}
                    onValueChange={setSelectedOption}
                    className="grid grid-cols-2 gap-2 pt-2"
                  >
                    {extensionOptions.map((option) => (
                      <div key={option.id}>
                        <RadioGroupItem
                          value={option.id}
                          id={option.id}
                          className="peer sr-only"
                          aria-label={option.duration}
                        />
                        <Label
                          htmlFor={option.id}
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all duration-200"
                        >
                          <Clock className="mb-2 h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium">{option.duration}</span>
                          <span className="text-lg font-bold text-green-700">KSh {option.price}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2 pt-2">
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
                    "Confirm Payment"
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
