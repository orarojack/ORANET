import { Wifi, Shield, Clock, Zap, HeadphonesIcon, CreditCard } from "lucide-react"

export default function Features() {
  const features = [
    {
      icon: <Wifi className="h-10 w-10 text-primary" />,
      title: "High-Speed Connectivity",
      description: "Enjoy seamless browsing, streaming, and downloading with our high-speed Wi-Fi packages.",
    },
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: "Secure Connection",
      description: "Our networks are secured with the latest encryption technology to protect your data.",
    },
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "24/7 Availability",
      description: "Our services are available round the clock with minimal downtime.",
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "Quick Installation",
      description: "Get connected quickly with our efficient installation process.",
    },
    {
      icon: <HeadphonesIcon className="h-10 w-10 text-primary" />,
      title: "Customer Support",
      description: "Our dedicated support team is always ready to assist you with any issues.",
    },
    {
      icon: <CreditCard className="h-10 w-10 text-primary" />,
      title: "Easy Payments",
      description: "Pay for your services conveniently using M-Pesa mobile money.",
    },
  ]

  return (
    <section id="features" className="w-full py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Why Choose ORANET</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Experience the best Wi-Fi service with these amazing features
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center space-y-4 rounded-lg border p-6 transition-all hover:shadow-md"
            >
              <div className="p-2 rounded-full bg-primary/10">{feature.icon}</div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-center text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
