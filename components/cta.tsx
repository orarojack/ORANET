import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Cta() {
  return (
    <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Get Connected?</h2>
            <p className="max-w-[700px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Choose a package that suits your needs and enjoy fast, reliable internet today.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Link href="#packages">
              <Button size="lg" variant="secondary" className="px-8">
                View Packages
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="px-8 bg-transparent border-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
