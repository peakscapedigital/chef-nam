"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    // run once to set the initial state
    handleScroll()

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-indigo shadow-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="hidden space-x-6 md:flex">
          <Link href="/" className="text-sm font-medium text-white transition-colors hover:text-brand-amber">
            Home
          </Link>
          <Link href="/services" className="text-sm font-medium text-white transition-colors hover:text-brand-amber">
            Services
          </Link>
          <Link href="/about" className="text-sm font-medium text-white transition-colors hover:text-brand-amber">
            About
          </Link>
          <Link href="/gallery" className="text-sm font-medium text-white transition-colors hover:text-brand-amber">
            Gallery
          </Link>
          <Link href="/contact" className="text-sm font-medium text-white transition-colors hover:text-brand-amber">
            Contact
          </Link>
        </nav>
        <div className="hidden md:block">
          <Button className="bg-brand-amber hover:bg-brand-amber/90 text-white">Start Planning</Button>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open Menu">
              <Menu className="h-6 w-6 text-white" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-brand-white">
            <div className="flex flex-col space-y-4 pt-10">
              <Link href="/" className="text-lg font-medium text-brand-indigo hover:text-brand-amber">
                Home
              </Link>
              <Link href="/services" className="text-lg font-medium text-brand-indigo hover:text-brand-amber">
                Services
              </Link>
              <Link href="/about" className="text-lg font-medium text-brand-indigo hover:text-brand-amber">
                About
              </Link>
              <Link href="/gallery" className="text-lg font-medium text-brand-indigo hover:text-brand-amber">
                Gallery
              </Link>
              <Link href="/contact" className="text-lg font-medium text-brand-indigo hover:text-brand-amber">
                Contact
              </Link>
              <Button className="mt-4 bg-brand-amber hover:bg-brand-amber/90 text-white">Start Planning</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
