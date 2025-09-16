import Image from "next/image"

const galleryImages = [
  {
    id: 1,
    src: "/placeholder.svg?height=300&width=400",
    alt: "Elegant wedding table with Thai-American fusion cuisine",
  },
  {
    id: 2,
    src: "/placeholder.svg?height=300&width=400",
    alt: "Corporate lunch buffet with fusion cuisine",
  },
  {
    id: 3,
    src: "/placeholder.svg?height=300&width=400",
    alt: "Thai-American fusion appetizer platter",
  },
  {
    id: 4,
    src: "/placeholder.svg?height=300&width=400",
    alt: "Thai-American fusion dessert table",
  },
  {
    id: 5,
    src: "/placeholder.svg?height=300&width=400",
    alt: "Chef Nam preparing fusion cuisine",
  },
  {
    id: 6,
    src: "/placeholder.svg?height=300&width=400",
    alt: "Outdoor catered event with fusion cuisine",
  },
]

export function Gallery() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {galleryImages.map((image) => (
        <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg">
          <Image
            src={image.src || "/placeholder.svg"}
            alt={image.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-brand-indigo/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
        </div>
      ))}
    </div>
  )
}
