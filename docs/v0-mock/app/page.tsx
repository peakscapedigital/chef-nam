import Image from "next/image"
import { ChevronRight, Clock, MapPin, Phone, Heart, Users, Award } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TestimonialCarousel } from "@/components/testimonial-carousel"
import { Gallery } from "@/components/gallery"
import { ContactForm } from "@/components/contact-form"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-white">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/chefnamhero.jpeg"
              alt="Chef Nam carefully preparing Thai-American fusion cuisine in professional kitchen"
              fill
              className="object-cover brightness-[0.4]"
              priority
            />
          </div>
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:py-32 md:px-6 lg:py-40">
            <div className="mb-4 font-script text-2xl text-brand-amber">{"Where Global Flavors Meet Local Charm"}</div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Exceptional Thai-American Fusion Catering
            </h1>
            <p className="mb-8 max-w-3xl text-lg text-white/90 sm:text-xl">
              Chef Nam Catering brings together the vibrant flavors of Thailand with American traditions, creating
              unforgettable culinary experiences for your special moments in Ann Arbor and beyond.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button size="lg" className="bg-brand-amber hover:bg-brand-amber/90 text-white font-medium">
                Start Planning
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Explore Our Fusion Menus
              </Button>
            </div>
          </div>
        </section>

        {/* Brand Values Section */}
        <section className="bg-brand-cream py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="mb-12 text-center">
              <div className="mb-4 font-script text-2xl text-brand-amber">
                {"Women-Owned • Community-Focused • Authentically Creative"}
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-brand-indigo sm:text-4xl">
                Our Story & Values
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-brand-indigo/80">
                As a women-owned business rooted in Ann Arbor, we bring together Thai heritage and American traditions
                with thoughtful attention to every detail.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-amber/20">
                  <Heart className="h-8 w-8 text-brand-amber" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-brand-indigo">Authentic & Personal</h3>
                <p className="text-brand-indigo/70">
                  Every dish tells a story, blending traditional Thai flavors with local Michigan ingredients and
                  personal touches.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-amber/20">
                  <Users className="h-8 w-8 text-brand-amber" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-brand-indigo">Inclusive & Welcoming</h3>
                <p className="text-brand-indigo/70">
                  We celebrate diversity in our cuisine and create memorable experiences for guests of all backgrounds.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-amber/20">
                  <Award className="h-8 w-8 text-brand-amber" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-brand-indigo">Thoughtful Excellence</h3>
                <p className="text-brand-indigo/70">
                  From menu planning to presentation, we demonstrate care and expertise in every interaction and detail.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="bg-brand-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="mb-12 text-center">
              <div className="mb-4 font-script text-2xl text-brand-amber">{"Fusion Flavors for Every Occasion"}</div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-brand-indigo sm:text-4xl">
                Our Catering Services
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-brand-indigo/80">
                From intimate gatherings to grand celebrations, we create memorable Thai-American fusion dining
                experiences tailored to your vision.
              </p>
            </div>

            <Tabs defaultValue="social" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-brand-cream">
                <TabsTrigger
                  value="social"
                  className="data-[state=active]:bg-brand-amber data-[state=active]:text-white"
                >
                  Social Events
                </TabsTrigger>
                <TabsTrigger
                  value="corporate"
                  className="data-[state=active]:bg-brand-amber data-[state=active]:text-white"
                >
                  Corporate
                </TabsTrigger>
                <TabsTrigger
                  value="weddings"
                  className="data-[state=active]:bg-brand-amber data-[state=active]:text-white"
                >
                  Weddings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="social" className="mt-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-brand-cream">
                    <CardHeader>
                      <CardTitle className="text-brand-indigo">Birthday Celebrations</CardTitle>
                      <CardDescription>Make your special day truly memorable with fusion flavors</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Image
                        src="/placeholder.svg?height=200&width=400"
                        alt="Thai-American fusion birthday celebration"
                        width={400}
                        height={200}
                        className="mb-4 rounded-lg object-cover"
                      />
                      <p className="text-brand-indigo/70">
                        From milestone birthdays to intimate gatherings, our custom Thai-American fusion menus will
                        delight your guests with vibrant flavors.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full border-brand-amber text-brand-amber hover:bg-brand-amber hover:text-white"
                      >
                        Learn More <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card className="border-brand-cream">
                    <CardHeader>
                      <CardTitle className="text-brand-indigo">Family Reunions</CardTitle>
                      <CardDescription>Bring everyone together with authentic fusion cuisine</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Image
                        src="/placeholder.svg?height=200&width=400"
                        alt="Family reunion with fusion cuisine"
                        width={400}
                        height={200}
                        className="mb-4 rounded-lg object-cover"
                      />
                      <p className="text-brand-indigo/70">
                        Create lasting memories with customized fusion menus that honor both Thai traditions and
                        American favorites for all generations.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full border-brand-amber text-brand-amber hover:bg-brand-amber hover:text-white"
                      >
                        Learn More <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card className="border-brand-cream">
                    <CardHeader>
                      <CardTitle className="text-brand-indigo">Graduation Parties</CardTitle>
                      <CardDescription>Celebrate achievements with innovative fusion flavors</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Image
                        src="/placeholder.svg?height=200&width=400"
                        alt="Graduation party with fusion cuisine"
                        width={400}
                        height={200}
                        className="mb-4 rounded-lg object-cover"
                      />
                      <p className="text-brand-indigo/70">
                        Honor your graduate with a unique fusion menu that impresses guests and makes the celebration
                        both memorable and stress-free.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full border-brand-amber text-brand-amber hover:bg-brand-amber hover:text-white"
                      >
                        Learn More <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="corporate" className="mt-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-brand-cream">
                    <CardHeader>
                      <CardTitle className="text-brand-indigo">Business Luncheons</CardTitle>
                      <CardDescription>Impress clients with sophisticated fusion cuisine</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Image
                        src="/placeholder.svg?height=200&width=400"
                        alt="Business luncheon with fusion cuisine"
                        width={400}
                        height={200}
                        className="mb-4 rounded-lg object-cover"
                      />
                      <p className="text-brand-indigo/70">
                        Elevate your business meetings with professionally presented Thai-American fusion options that
                        spark conversation and delight.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full border-brand-amber text-brand-amber hover:bg-brand-amber hover:text-white"
                      >
                        Learn More <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card className="border-brand-cream">
                    <CardHeader>
                      <CardTitle className="text-brand-indigo">Corporate Events</CardTitle>
                      <CardDescription>From conferences to holiday parties with fusion flair</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Image
                        src="/placeholder.svg?height=200&width=400"
                        alt="Corporate event with fusion catering"
                        width={400}
                        height={200}
                        className="mb-4 rounded-lg object-cover"
                      />
                      <p className="text-brand-indigo/70">
                        Create memorable company events with innovative fusion menus that accommodate diverse tastes and
                        dietary preferences.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full border-brand-amber text-brand-amber hover:bg-brand-amber hover:text-white"
                      >
                        Learn More <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card className="border-brand-cream">
                    <CardHeader>
                      <CardTitle className="text-brand-indigo">Product Launches</CardTitle>
                      <CardDescription>Make a lasting impression with innovative fusion cuisine</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Image
                        src="/placeholder.svg?height=200&width=400"
                        alt="Product launch with fusion catering"
                        width={400}
                        height={200}
                        className="mb-4 rounded-lg object-cover"
                      />
                      <p className="text-brand-indigo/70">
                        Complement your product launch with innovative Thai-American fusion presentations that enhance
                        your brand and wow attendees.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full border-brand-amber text-brand-amber hover:bg-brand-amber hover:text-white"
                      >
                        Learn More <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="weddings" className="mt-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-brand-cream">
                    <CardHeader>
                      <CardTitle className="text-brand-indigo">Wedding Receptions</CardTitle>
                      <CardDescription>Unforgettable fusion dining experiences for your special day</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Image
                        src="/placeholder.svg?height=200&width=400"
                        alt="Wedding reception with fusion cuisine"
                        width={400}
                        height={200}
                        className="mb-4 rounded-lg object-cover"
                      />
                      <p className="text-brand-indigo/70">
                        Create a memorable culinary journey for your wedding day with our customized Thai-American
                        fusion menus that honor both traditions.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full border-brand-amber text-brand-amber hover:bg-brand-amber hover:text-white"
                      >
                        Learn More <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card className="border-brand-cream">
                    <CardHeader>
                      <CardTitle className="text-brand-indigo">Rehearsal Dinners</CardTitle>
                      <CardDescription>Intimate pre-wedding celebrations with fusion flavors</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Image
                        src="/placeholder.svg?height=200&width=400"
                        alt="Rehearsal dinner with fusion cuisine"
                        width={400}
                        height={200}
                        className="mb-4 rounded-lg object-cover"
                      />
                      <p className="text-brand-indigo/70">
                        Begin your wedding celebrations with a perfectly executed rehearsal dinner featuring fusion
                        cuisine for your closest friends and family.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full border-brand-amber text-brand-amber hover:bg-brand-amber hover:text-white"
                      >
                        Learn More <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card className="border-brand-cream">
                    <CardHeader>
                      <CardTitle className="text-brand-indigo">Bridal Showers</CardTitle>
                      <CardDescription>Elegant pre-wedding gatherings with vibrant fusion cuisine</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Image
                        src="/placeholder.svg?height=200&width=400"
                        alt="Bridal shower with fusion cuisine"
                        width={400}
                        height={200}
                        className="mb-4 rounded-lg object-cover"
                      />
                      <p className="text-brand-indigo/70">
                        Celebrate the bride-to-be with beautifully presented Thai-American fusion cuisine that makes the
                        occasion both special and memorable.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full border-brand-amber text-brand-amber hover:bg-brand-amber hover:text-white"
                      >
                        Learn More <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* About Section */}
        <section className="bg-brand-cream py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <div className="mb-4 font-script text-2xl text-brand-amber">{"15+ Years of Fusion Excellence"}</div>
                <h2 className="mb-6 text-3xl font-bold tracking-tight text-brand-indigo sm:text-4xl">
                  About Chef Nam Catering
                </h2>
                <p className="mb-4 text-lg text-brand-indigo/80">
                  Founded with a passion for bringing together the vibrant flavors of Thailand with beloved American
                  traditions, Chef Nam Catering has been delighting clients in Ann Arbor and surrounding areas for over
                  15 years.
                </p>
                <p className="mb-6 text-lg text-brand-indigo/80">
                  As a women-owned business, our team of experienced culinary professionals is dedicated to creating
                  authentic, innovative, and memorable Thai-American fusion dining experiences for every occasion.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-amber/20">
                      <Clock className="h-5 w-5 text-brand-amber" />
                    </div>
                    <span className="text-brand-indigo/80">15+ years of Thai-American fusion excellence</span>
                  </li>
                  <li className="flex items-center">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-amber/20">
                      <MapPin className="h-5 w-5 text-brand-amber" />
                    </div>
                    <span className="text-brand-indigo/80">Proudly serving Ann Arbor and surrounding communities</span>
                  </li>
                  <li className="flex items-center">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-amber/20">
                      <Phone className="h-5 w-5 text-brand-amber" />
                    </div>
                    <span className="text-brand-indigo/80">
                      Personalized service with thoughtful attention to detail
                    </span>
                  </li>
                </ul>
              </div>
              <div className="relative h-[400px] overflow-hidden rounded-lg">
                <Image
                  src="/images/chefnamhero.jpeg"
                  alt="Chef Nam carefully preparing Thai-American fusion cuisine"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-brand-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="mb-12 text-center">
              <div className="mb-4 font-script text-2xl text-brand-amber">{"What Our Community Says"}</div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-brand-indigo sm:text-4xl">
                Client Testimonials
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-brand-indigo/80">
                We take pride in exceeding our clients' expectations with thoughtful service and exceptional
                Thai-American fusion cuisine.
              </p>
            </div>
            <TestimonialCarousel />
          </div>
        </section>

        {/* Gallery Section */}
        <section className="bg-brand-cream py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="mb-12 text-center">
              <div className="mb-4 font-script text-2xl text-brand-amber">
                {"Vibrant Flavors & Beautiful Presentations"}
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-brand-indigo sm:text-4xl">
                Our Fusion Food Gallery
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-brand-indigo/80">
                A glimpse of our colorful Thai-American fusion creations and beautifully catered events throughout Ann
                Arbor.
              </p>
            </div>
            <Gallery />
            <div className="mt-10 text-center">
              <Button
                size="lg"
                variant="outline"
                className="border-brand-amber text-brand-amber hover:bg-brand-amber hover:text-white"
              >
                View Full Gallery
              </Button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-brand-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="grid gap-12 md:grid-cols-2">
              <div>
                <div className="mb-4 font-script text-2xl text-brand-amber">
                  {"Let's Create Something Special Together"}
                </div>
                <h2 className="mb-6 text-3xl font-bold tracking-tight text-brand-indigo sm:text-4xl">Get in Touch</h2>
                <p className="mb-6 text-lg text-brand-indigo/80">
                  Ready to discuss your Thai-American fusion catering needs? Fill out the form and we'll get back to you
                  promptly to start planning your perfect event with thoughtful attention to every detail.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="mr-3 h-5 w-5 text-brand-amber" />
                    <div>
                      <h3 className="font-medium text-brand-indigo">Location</h3>
                      <address className="not-italic text-brand-indigo/70">
                        123 Main Street, Ann Arbor, MI 48104
                      </address>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="mr-3 h-5 w-5 text-brand-amber" />
                    <div>
                      <h3 className="font-medium text-brand-indigo">Phone</h3>
                      <p className="text-brand-indigo/70">(734) 555-0123</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="mr-3 h-5 w-5 text-brand-amber" />
                    <div>
                      <h3 className="font-medium text-brand-indigo">Hours</h3>
                      <p className="text-brand-indigo/70">Monday - Friday: 9am - 5pm</p>
                      <p className="text-brand-indigo/70">Saturday: 10am - 2pm</p>
                      <p className="text-brand-indigo/70">Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
