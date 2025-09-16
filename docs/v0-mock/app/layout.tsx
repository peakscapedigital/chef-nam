import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import type { ReactNode } from "react"
import { Playfair_Display, Montserrat, Caveat } from "next/font/google"

/* -----------------------------
 Self-hosted Google fonts
----------------------------- */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-playfair",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-montserrat",
})

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-caveat",
})

export const metadata = {
  title: "Chef Nam Catering",
  description: "Thai-American fusion catering in Ann Arbor",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  /* Attach font variables to the <html> element */
  return (
    <html lang="en" className={`${playfair.variable} ${montserrat.variable} ${caveat.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
