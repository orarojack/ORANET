"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Clock, Wifi, AlertCircle, Zap, Database, Award, Sparkles, Globe, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import PaymentModal from "@/components/payment-modal"
import { FaWhatsapp } from "react-icons/fa"
import { getPackages, type Package } from "@/app/actions/packages"

export default function WifiPackages() {
  const [voucherCode, setVoucherCode] = useState("")
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("time")
  const [packages, setPackages] = useState<{
    time: Package[]
    data: Package[]
    special: Package[]
  }>({
    time: [],
    data: [],
    special: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch packages on component mount
  useEffect(() => {
    const fetchAllPackages = async () => {
      setIsLoading(true)
      try {
        const [timePackages, dataPackages, specialPackages] = await Promise.all([
          getPackages("time"),
          getPackages("data"),
          getPackages("special"),
        ])

        setPackages({
          time: timePackages,
          data: dataPackages,
          special: specialPackages,
        })
      } catch (error) {
        console.error("Error fetching packages:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllPackages()
  }, [])

  const handleConnectNow = () => {
    if (!voucherCode.trim()) {
      setError("Please enter a voucher code")
      return
    }

    // Process voucher code
    setError("")
    alert(`Connecting with voucher: ${voucherCode}`)
    setVoucherCode("")
  }

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg)
    setIsModalOpen(true)
  }

  function PackageCard({ pkg, onSelect, index }: { pkg: Package; onSelect: (pkg: Package) => void; index: number }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ y: -5 }}
        className="h-full"
      >
        <Card
          className={`overflow-hidden transition-all duration-300 h-full hover:shadow-xl ${
            pkg.is_popular || pkg.is_recommended ? "border-green-200 shadow-md" : "border-gray-200"
          }`}
        >
          <div className="relative h-full flex flex-col">
            {pkg.is_popular && (
              <div className="absolute top-0 right-0 z-10">
                <Badge className="bg-green-500 hover:bg-green-600 m-2 animate-pulse-slow">Popular</Badge>
              </div>
            )}
            {pkg.is_recommended && (
              <div className="absolute top-0 right-0 z-10">
                <Badge className="bg-green-600 hover:bg-green-700 m-2 animate-pulse-slow">Recommended</Badge>
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-full ${
                    pkg.type === "time" ? "bg-green-100" : pkg.type === "data" ? "bg-green-100" : "bg-green-100"
                  } animate-float`}
                >
                  {pkg.type === "time" ? (
                    <Clock className="h-5 w-5 text-green-500" />
                  ) : pkg.type === "data" ? (
                    <Database className="h-5 w-5 text-green-500" />
                  ) : pkg.type === "special" && pkg.name.includes("Gaming") ? (
                    <Globe className="h-5 w-5 text-green-500" />
                  ) : pkg.type === "special" && pkg.name.includes("Business") ? (
                    <Award className="h-5 w-5 text-green-500" />
                  ) : pkg.type === "special" && pkg.name.includes("Streaming") ? (
                    <Zap className="h-5 w-5 text-green-500" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg font-poppins">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.duration}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2 flex-grow">
              <div className="mb-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-green-700 font-poppins">KSh {pkg.price}</span>
                  {pkg.extra_time && <span className="ml-1 text-xs text-green-600">+ Xtra time</span>}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Wifi className="h-4 w-4 mr-2 text-green-500" />
                  {pkg.devices} {pkg.devices === 1 ? "Device" : "Devices"}
                </div>

                {pkg.speed && (
                  <div className="flex items-center text-gray-600">
                    <Zap className="h-4 w-4 mr-2 text-green-500" />
                    Speed: {pkg.speed}
                  </div>
                )}

                {pkg.data_allowance && (
                  <div className="flex items-center text-gray-600">
                    <Database className="h-4 w-4 mr-2 text-green-500" />
                    Data: {pkg.data_allowance}
                  </div>
                )}

                {pkg.features && pkg.features.length > 0 && (
                  <div className="pt-2">
                    <ul className="space-y-1">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg"
                onClick={() => onSelect(pkg)}
              >
                Buy Now
              </Button>
            </CardFooter>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Tabs defaultValue="voucher" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="voucher" className="text-sm sm:text-base">
            Connect with Voucher
          </TabsTrigger>
          <TabsTrigger value="packages" className="text-sm sm:text-base">
            Buy Wi-Fi Package
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voucher" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 shimmer"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-center font-poppins">Quick Connect</CardTitle>
                <CardDescription className="text-center">
                  Enter your voucher code or M-PESA message to connect
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="voucher" className="text-sm font-medium text-gray-700">
                      Voucher or MPESA Message
                    </label>
                    <Input
                      id="voucher"
                      placeholder="Enter voucher code"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="h-12 transition-all duration-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    {error && (
                      <div className="flex items-center text-red-500 text-sm mt-1">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {error}
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full h-12 text-base bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg"
                    onClick={handleConnectNow}
                  >
                    Connect Now
                  </Button>
                  <div className="text-center py-2 space-y-3">
                    <motion.a
                      href="tel:0703781668"
                      className="bg-green-50 text-green-700 text-sm py-3 px-4 rounded-lg border border-green-100 flex items-center justify-center gap-2 hover:bg-green-100 transition-all duration-300 hover:shadow-md"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Phone className="h-4 w-4" />
                      Call 0703781668 for assistance
                    </motion.a>

                    <motion.a
                      href="https://wa.me/254703781668"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white text-sm py-3 px-4 rounded-lg border border-green-500 flex items-center justify-center gap-2 hover:bg-green-700 transition-all duration-300 hover:shadow-md"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FaWhatsapp className="h-5 w-5" />
                      Chat with us on WhatsApp
                    </motion.a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="packages">
          <div className="mb-6">
            <Tabs defaultValue="time" onValueChange={setActiveTab}>
              <div className="flex justify-center mb-6">
                <TabsList className="bg-green-100">
                  <TabsTrigger
                    value="time"
                    className="flex items-center gap-1 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Time-Based</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="data"
                    className="flex items-center gap-1 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    <Database className="h-4 w-4" />
                    <span>Data-Based</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="special"
                    className="flex items-center gap-1 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Special</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <>
                  <TabsContent value="time">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {packages.time.map((pkg, index) => (
                        <PackageCard key={pkg.id} pkg={pkg} onSelect={handleSelectPackage} index={index} />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="data">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {packages.data.map((pkg, index) => (
                        <PackageCard key={pkg.id} pkg={pkg} onSelect={handleSelectPackage} index={index} />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="special">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {packages.special.map((pkg, index) => (
                        <PackageCard key={pkg.id} pkg={pkg} onSelect={handleSelectPackage} index={index} />
                      ))}
                    </div>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>

      {selectedPackage && (
        <PaymentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} packageDetails={selectedPackage} />
      )}
    </div>
  )
}
