"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Faq() {
  const faqs = [
    {
      question: "How do I sign up for ORANET Wi-Fi services?",
      answer:
        "You can sign up by selecting a package on our website, completing the payment via M-Pesa, and our team will contact you to schedule installation.",
    },
    {
      question: "What areas do you currently cover?",
      answer:
        "We currently provide services in Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret. We're continuously expanding to more areas.",
    },
    {
      question: "How long does installation take?",
      answer:
        "Once payment is confirmed, installation is typically completed within 24-48 hours, depending on your location.",
    },
    {
      question: "Do I need special equipment for the Wi-Fi?",
      answer:
        "We provide all necessary equipment as part of the installation, including a router. There may be a refundable deposit for the equipment.",
    },
    {
      question: "What happens if I experience connectivity issues?",
      answer:
        "Our customer support team is available 24/7. You can reach us through our helpline, and we'll assist you promptly.",
    },
    {
      question: "Can I upgrade my package later?",
      answer:
        "Yes, you can upgrade your package at any time. The new rates will be prorated based on your billing cycle.",
    },
    {
      question: "How do I make monthly payments?",
      answer:
        "Monthly payments can be made via M-Pesa. We'll send you a reminder before your renewal date with payment instructions.",
    },
    {
      question: "Is there a contract or commitment period?",
      answer:
        "Our services are prepaid and billed monthly. There's no long-term contract, giving you flexibility to change or cancel your service.",
    },
  ]

  return (
    <section id="faq" className="w-full py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Frequently Asked Questions</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Find answers to common questions about our services
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl mt-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
