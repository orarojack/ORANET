"use client"

import { useState } from "react"
import { Check, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PaymentModal from "@/components/payment-modal"

// Define package types
interface Package {
  id: string
  name: string
  price: number
  speed: string
  dataAllowance: string
  duration: string
  popular?: boolean
  features: string[]
}

export default function Packages() {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const packages: Package[] = [
    {
      id: "basic",
      name: "Basic",
      price: 999,
      speed: "5 Mbps",
      dataAllowance: "50 GB",
      duration: "30 days",
      features: [
        "Suitable for light browsing",
        "Email and social media",
        "Connect up to 2 devices",
        "24/7 customer support",
      ],
    },
    {
      id: "standard",
      name: "Standard",
      price: 1999,
      speed: "15 Mbps",
      dataAllowance: "150 GB",
      duration: "30 days",
      popular: true,
      features: [
        "Suitable for streaming",
        "Video calls and conferencing",
        "Connect up to 5 devices",
        "24/7 customer support",
        "Free installation",
      ],
    },
    {
      id: "premium",
      name: "Premium",
      price: 2999,
      speed: "30 Mbps",
      dataAllowance: "Unlimited",
      duration: "30 days",
      features: [
        "Suitable for heavy streaming",
        "Online gaming",
        "Connect up to 10 devices",
        "24/7 priority customer support",
        "Free installation",
        "Static IP address",
      ],
    },
    {
      id: "business",
      name: "Business",
      price: 4999,
      speed: "50 Mbps",
      dataAllowance: "Unlimited",
      duration: "30 days",
      features: [
        "Suitable for small businesses",
        "Video conferencing",
        "Connect unlimited devices",
        "24/7 priority customer support",
        "Free installation",
        "Static IP address",
        "99.9% uptime guarantee",
      ],
    },
  ]

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg)
    setIsModalOpen(true)
  }

  return (
    <section id="packages" className="w-full py-12 md:py-24 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Choose Your Wi-Fi Package</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Select the perfect plan that suits your internet needs and budget
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
          {packages.map((pkg) => (
            <Card key={pkg.id} className={`flex flex-col ${pkg.popular ? "border-primary shadow-lg" : ""}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-primary" />
                    <CardTitle>{pkg.name}</CardTitle>
                  </div>
                  {pkg.popular && <Badge variant="default">Popular</Badge>}
                </div>
                <CardDescription>
                  {pkg.speed} • {pkg.dataAllowance}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-4">
                  <span className="text-3xl font-bold">KSh {pkg.price}</span>
                  <span className="text-muted-foreground">/{pkg.duration}</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleSelectPackage(pkg)}>
                  Select Package
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {selectedPackage && (
        <PaymentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} packageDetails={selectedPackage} />
      )}
    </section>
  )
}
