import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StarIcon } from "lucide-react"

export default function Testimonials() {
  const testimonials = [
    {
      name: "John Kamau",
      role: "Home User",
      content:
        "ORANET has transformed how I work from home. The connection is stable and the speeds are exactly as advertised. Customer service is also top-notch!",
      avatar: "JK",
      rating: 5,
    },
    {
      name: "Mary Wanjiku",
      role: "Small Business Owner",
      content:
        "As a cafe owner, reliable internet is crucial for my business. ORANET's Business package has been perfect for my needs, and my customers love the fast Wi-Fi.",
      avatar: "MW",
      rating: 5,
    },
    {
      name: "David Ochieng",
      role: "Student",
      content:
        "The Standard package is perfect for my online classes and research. The data allowance is generous and I never experience buffering during video calls.",
      avatar: "DO",
      rating: 4,
    },
    {
      name: "Sarah Njeri",
      role: "Freelancer",
      content:
        "I rely on stable internet for my freelance work, and ORANET has never let me down. The value for money is excellent compared to other providers.",
      avatar: "SN",
      rating: 5,
    },
  ]

  return (
    <section id="testimonials" className="w-full py-12 md:py-24 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">What Our Customers Say</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Don't just take our word for it - hear from our satisfied customers
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="h-full">
              <CardContent className="pt-6">
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{testimonial.content}</p>
              </CardContent>
              <CardFooter>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
