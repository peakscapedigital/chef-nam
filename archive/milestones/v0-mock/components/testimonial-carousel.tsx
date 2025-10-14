"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Bride",
    content:
      "Chef Nam Catering made our wedding day absolutely perfect. The food was exceptional, the presentation was beautiful, and the service was impeccable. Our guests are still raving about the meal!",
    avatar: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Corporate Event Planner",
    content:
      "We've used Chef Nam for multiple corporate events and they consistently exceed our expectations. Their attention to detail and ability to accommodate dietary restrictions make them our go-to caterer in Ann Arbor.",
    avatar: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Birthday Celebration",
    content:
      "I hired Chef Nam for my 50th birthday party and it was the best decision. The food was delicious, the staff was professional, and they made the entire process stress-free. I'll definitely use them again!",
    avatar: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 4,
    name: "David Thompson",
    role: "Family Reunion Organizer",
    content:
      "Our family reunion was a huge success thanks to Chef Nam Catering. They created a menu that pleased everyone from the kids to the grandparents. The service was friendly and the food was outstanding.",
    avatar: "/placeholder.svg?height=60&width=60",
  },
]

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  const visibleTestimonials = () => {
    // For mobile, show 1, for tablet show 2, for desktop show 3
    const isMobile = typeof window !== "undefined" ? window.innerWidth < 640 : false
    const isTablet = typeof window !== "undefined" ? window.innerWidth >= 640 && window.innerWidth < 1024 : false

    if (isMobile) return testimonials.slice(currentIndex, currentIndex + 1)
    if (isTablet) return [testimonials[currentIndex], testimonials[(currentIndex + 1) % testimonials.length]]

    return [
      testimonials[currentIndex],
      testimonials[(currentIndex + 1) % testimonials.length],
      testimonials[(currentIndex + 2) % testimonials.length],
    ]
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap justify-center gap-6">
        {visibleTestimonials().map((testimonial) => (
          <Card key={testimonial.id} className="w-full max-w-md">
            <CardContent className="p-6">
              <Quote className="mb-4 h-8 w-8 text-amber-500" />
              <p className="mb-6 text-lg">{testimonial.content}</p>
              <div className="flex items-center">
                <div className="relative mr-4 h-12 w-12 overflow-hidden rounded-full">
                  <Image
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex justify-center space-x-4">
        <Button variant="outline" size="icon" onClick={prevTestimonial} aria-label="Previous testimonial">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={nextTestimonial} aria-label="Next testimonial">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
