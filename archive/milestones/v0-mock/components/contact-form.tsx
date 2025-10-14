"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function ContactForm() {
  const [date, setDate] = useState<Date>()

  return (
    <form className="space-y-6 rounded-lg border border-brand-cream bg-brand-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-brand-indigo">
            Name
          </Label>
          <Input id="name" placeholder="Your name" required className="border-brand-cream focus:border-brand-amber" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-brand-indigo">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Your email"
            required
            className="border-brand-cream focus:border-brand-amber"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-brand-indigo">
            Phone
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Your phone number"
            className="border-brand-cream focus:border-brand-amber"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-brand-indigo">Event Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border-brand-cream",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="event-type" className="text-brand-indigo">
          Event Type
        </Label>
        <Select>
          <SelectTrigger id="event-type" className="border-brand-cream focus:border-brand-amber">
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wedding">Wedding</SelectItem>
            <SelectItem value="corporate">Corporate Event</SelectItem>
            <SelectItem value="social">Social Gathering</SelectItem>
            <SelectItem value="birthday">Birthday Party</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="guests" className="text-brand-indigo">
          Number of Guests
        </Label>
        <Input
          id="guests"
          type="number"
          placeholder="Estimated number of guests"
          className="border-brand-cream focus:border-brand-amber"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message" className="text-brand-indigo">
          Additional Information
        </Label>
        <Textarea
          id="message"
          placeholder="Tell us about your event, dietary requirements, fusion preferences, or any special requests"
          rows={4}
          className="border-brand-cream focus:border-brand-amber"
        />
      </div>
      <Button type="submit" className="w-full bg-brand-amber hover:bg-brand-amber/90 text-white">
        Submit Inquiry
      </Button>
    </form>
  )
}
