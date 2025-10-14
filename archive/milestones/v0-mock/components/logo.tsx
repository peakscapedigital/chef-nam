import Image from "next/image"

export function Logo() {
  return (
    <div className="flex items-center">
      <Image
        src="/images/chefnamlogo.png"
        alt="Chef Nam Event Catering - Thai-American Fusion Catering"
        width={200}
        height={80}
        className="h-auto w-auto max-h-12 max-w-[200px]"
        priority
      />
    </div>
  )
}
