import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react"

import { Logo } from "@/components/logo"

export function Footer() {
  return (
    <footer className="bg-brand-indigo text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="mb-4">
              <div className="flex items-center">
                <Logo />
              </div>
            </div>
            <p className="mt-4 text-white/80">
              Exceptional Thai-American fusion catering services for social events, corporate functions, and weddings in
              Ann Arbor, Michigan.
            </p>
            <div className="mt-6 flex space-x-4">
              <Link href="#" className="text-white/60 hover:text-brand-amber">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-white/60 hover:text-brand-amber">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-white/60 hover:text-brand-amber">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-white/80 hover:text-brand-amber">
                  Social Events
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/80 hover:text-brand-amber">
                  Corporate Catering
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/80 hover:text-brand-amber">
                  Wedding Catering
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/80 hover:text-brand-amber">
                  Fusion Menu Planning
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/80 hover:text-brand-amber">
                  Event Staffing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-white/80 hover:text-brand-amber">
                  Home
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/80 hover:text-brand-amber">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/80 hover:text-brand-amber">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/80 hover:text-brand-amber">
                  Testimonials
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/80 hover:text-brand-amber">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="mr-3 h-5 w-5 text-brand-amber" />
                <span className="text-white/80">123 Main Street, Ann Arbor, MI 48104</span>
              </li>
              <li className="flex items-start">
                <Phone className="mr-3 h-5 w-5 text-brand-amber" />
                <span className="text-white/80">(734) 555-0123</span>
              </li>
              <li className="flex items-start">
                <Mail className="mr-3 h-5 w-5 text-brand-amber" />
                <span className="text-white/80">info@chefnamcatering.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/20 pt-8 text-center text-sm text-white/60">
          <p>
            &copy; {new Date().getFullYear()} Chef Nam Event Catering. All rights reserved. Women-owned • Thai-American
            Fusion • Ann Arbor, MI
          </p>
        </div>
      </div>
    </footer>
  )
}
