"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Wifi, Calendar, History } from "lucide-react"
import Header from "@/components/header"
import ExtendTimeModal from "@/components/extend-time-modal"
import { getUserVouchers, type Voucher } from "@/app/actions/vouchers"

// Format seconds to days, hours, minutes
function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "Expired"

  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)

  if (days > 0) {
    return `${days}d ${hours}h remaining`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`
  } else {
    return `${minutes}m remaining`
  }
}

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [selectedVoucherId, setSelectedVoucherId] = useState("")
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(true)

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  // Fetch vouchers when user is loaded
  useEffect(() => {
    const fetchVouchers = async () => {
      if (user) {
        setIsLoadingVouchers(true)
        try {
          const userVouchers = await getUserVouchers(user.id)
          setVouchers(userVouchers)
        } catch (error) {
          console.error("Error fetching vouchers:", error)
        } finally {
          setIsLoadingVouchers(false)
        }
      }
    }

    if (user) {
      fetchVouchers()
    }
  }, [user])

  // Update remaining time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setVouchers((currentVouchers) =>
        currentVouchers.map((voucher) => {
          if (voucher.status === "active" && voucher.remaining_time > 0) {
            return {
              ...voucher,
              remaining_time: Math.max(0, voucher.remaining_time - 60),
              status: voucher.remaining_time <= 60 ? "expired" : "active",
            }
          }
          return voucher
        }),
      )
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const handleExtendTime = (voucherId: string) => {
    setSelectedVoucherId(voucherId)
    setIsExtendModalOpen(true)
  }

  const handleExtendSuccess = (additionalHours: number) => {
    // Update the voucher with additional time
    setVouchers((currentVouchers) =>
      currentVouchers.map((voucher) => {
        if (voucher.id === selectedVoucherId) {
          const additionalSeconds = additionalHours * 60 * 60
          return {
            ...voucher,
            remaining_time: voucher.remaining_time + additionalSeconds,
            status: "active",
          }
        }
        return voucher
      }),
    )
  }

  if (isLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const activeVouchers = vouchers.filter((v) => v.status === "active")
  const expiredVouchers = vouchers.filter((v) => v.status === "expired" || v.status === "used")

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold font-poppins text-green-800">Welcome, {user.name}</h1>
          <p className="text-gray-600">Manage your ORANET WIFI vouchers and connection time</p>
        </motion.div>

        {isLoadingVouchers ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            {activeVouchers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-8"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Wifi className="mr-2 h-5 w-5 text-green-600" />
                  Active Connection
                </h2>

                <Card className="border-green-200 shadow-md overflow-hidden">
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 shimmer"></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-poppins">{activeVouchers[0].package_name} Package</CardTitle>
                    <CardDescription>Voucher: {activeVouchers[0].voucher_code}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Time Remaining</span>
                        <span className="text-2xl font-bold text-green-700 font-poppins">
                          {formatTimeRemaining(activeVouchers[0].remaining_time)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Devices</span>
                        <span className="text-lg font-medium">{activeVouchers[0].devices_allowed} devices</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Speed</span>
                        <span className="text-lg font-medium">{activeVouchers[0].speed}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
                        onClick={() => handleExtendTime(activeVouchers[0].id)}
                      >
                        Extend Time
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <History className="mr-2 h-5 w-5 text-green-600" />
                Voucher History
              </h2>

              {vouchers.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-500 mb-4">You don't have any vouchers yet.</p>
                  <Button
                    onClick={() => router.push("/")}
                    className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
                  >
                    Buy Your First Package
                  </Button>
                </Card>
              ) : (
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Vouchers</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="expired">Expired</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vouchers.map((voucher) => (
                        <VoucherCard key={voucher.id} voucher={voucher} onExtendTime={handleExtendTime} />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="active">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeVouchers.length > 0 ? (
                        activeVouchers.map((voucher) => (
                          <VoucherCard key={voucher.id} voucher={voucher} onExtendTime={handleExtendTime} />
                        ))
                      ) : (
                        <p className="text-gray-500">No active vouchers found.</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="expired">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {expiredVouchers.length > 0 ? (
                        expiredVouchers.map((voucher) => (
                          <VoucherCard key={voucher.id} voucher={voucher} onExtendTime={handleExtendTime} />
                        ))
                      ) : (
                        <p className="text-gray-500">No expired vouchers found.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </motion.div>
          </>
        )}
      </main>

      {selectedVoucherId && (
        <ExtendTimeModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          voucherId={selectedVoucherId}
          onSuccess={handleExtendSuccess}
        />
      )}
    </div>
  )
}

interface VoucherCardProps {
  voucher: Voucher
  onExtendTime: (voucherId: string) => void
}

function VoucherCard({ voucher, onExtendTime }: VoucherCardProps) {
  return (
    <Card className={`overflow-hidden ${voucher.status === "active" ? "border-green-200" : "border-gray-200"}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-poppins">{voucher.package_name}</CardTitle>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              voucher.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {voucher.status === "active" ? "Active" : "Expired"}
          </span>
        </div>
        <CardDescription>Voucher: {voucher.voucher_code}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-green-500" />
            <span>{new Date(voucher.purchase_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-green-500" />
            <span>{voucher.status === "active" ? formatTimeRemaining(voucher.remaining_time) : "Expired"}</span>
          </div>
        </div>

        <div className="mt-4">
          {voucher.status === "active" ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-green-200 text-green-700 hover:bg-green-50"
              onClick={() => onExtendTime(voucher.id)}
            >
              Extend Time
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="w-full border-green-200 text-green-700 hover:bg-green-50">
              Buy Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
