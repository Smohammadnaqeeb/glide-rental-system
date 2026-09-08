import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  CreditCard,
  Headphones,
  MapPin,
  Quote,
  ShieldCheck,
  Star,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CarCard } from "@/components/site/CarCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingState } from "@/components/site/states";
import { fetchCars, fetchRecentReviews } from "@/lib/api";
import { PICKUP_LOCATIONS, todayISO } from "@/lib/format";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=80";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DriveEase — Rent Your Perfect Car, Anytime, Anywhere" },
      {
        name: "description",
        content:
          "Book self-drive rental cars in minutes. Reliable vehicles, transparent pricing and effortless online booking with DriveEase.",
      },
      { property: "og:title", content: "DriveEase — Rent Your Perfect Car, Anytime, Anywhere" },
      {
        property: "og:description",
        content: "Reliable cars, transparent pricing, and effortless booking.",
      },
      { property: "og:image", content: HERO_IMAGE },
      { name: "twitter:image", content: HERO_IMAGE },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState(PICKUP_LOCATIONS[0]!);
  const [pickup, setPickup] = useState(todayISO());
  const [returnDate, setReturnDate] = useState("");

  const carsQuery = useQuery({ queryKey: ["cars"], queryFn: fetchCars });
  const reviewsQuery = useQuery({ queryKey: ["reviews", "recent"], queryFn: fetchRecentReviews });

  const featured = (carsQuery.data ?? []).filter((car) => car.status === "available").slice(0, 6);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Premium rental car on an open road at dusk"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <BadgeCheck className="size-3.5" /> Trusted by 12,000+ drivers
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Rent Your Perfect Car, Anytime, Anywhere
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Reliable cars, transparent pricing, and effortless booking.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/cars">
                Browse Cars <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/about">How it works</Link>
            </Button>
          </div>

          {/* Booking widget */}
          <div className="mt-12 grid gap-4 rounded-2xl glass p-5 sm:grid-cols-2 lg:max-w-4xl lg:grid-cols-4 lg:items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Pickup location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PICKUP_LOCATIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="hero-pickup">
                Pickup date
              </Label>
              <Input
                id="hero-pickup"
                type="date"
                min={todayISO()}
                value={pickup}
                onChange={(event) => setPickup(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="hero-return">
                Return date
              </Label>
              <Input
                id="hero-return"
                type="date"
                min={pickup || todayISO()}
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() =>
                void navigate({
                  to: "/cars",
                  search: {
                    pickup: pickup || undefined,
                    ret: returnDate || undefined,
                    location,
                  },
                })
              }
            >
              Search cars
            </Button>
          </div>
        </div>
      </section>

      {/* Featured cars */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Featured cars</h2>
            <p className="mt-2 text-muted-foreground">
              Hand-picked vehicles available for immediate booking.
            </p>
          </div>
          <Button variant="secondary" asChild>
            <Link to="/cars">View all cars</Link>
          </Button>
        </div>

        {carsQuery.isLoading ? (
          <LoadingState label="Loading cars..." />
        ) : featured.length === 0 ? (
          <p className="py-14 text-center text-muted-foreground">No cars available right now.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </section>

      {/* Why choose us */}
      <section className="border-y border-border bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold">Why choose DriveEase</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "Fully insured fleet",
                text: "Every vehicle is serviced, sanitised and insured before handover.",
              },
              {
                icon: CreditCard,
                title: "Transparent pricing",
                text: "See the rental cost, deposit and total before you confirm.",
              },
              {
                icon: MapPin,
                title: "Pickup anywhere",
                text: "Six city hubs including airport counters, with flexible drop-off.",
              },
              {
                icon: Headphones,
                title: "24/7 road support",
                text: "Assistance on call throughout your rental period.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <item.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { icon: CarFront, title: "1. Pick a car", text: "Filter by brand, fuel, price or seats." },
            { icon: CalendarDays, title: "2. Choose dates", text: "We check live availability instantly." },
            { icon: BadgeCheck, title: "3. Get approved", text: "Our team confirms your booking." },
            { icon: Star, title: "4. Drive away", text: "Pay, collect the keys and hit the road." },
          ].map((step) => (
            <div key={step.title} className="rounded-2xl border border-border p-6">
              <step.icon className="size-6 text-primary" />
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="border-y border-border bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold">What our customers say</h2>
          {(reviewsQuery.data ?? []).length === 0 ? (
            <p className="mt-6 text-muted-foreground">
              No reviews yet — complete a rental to leave the first one.
            </p>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {(reviewsQuery.data ?? []).map((review) => {
                const item = review as unknown as {
                  id: string;
                  rating: number;
                  comment: string | null;
                  profiles: { full_name: string } | null;
                  cars: { brand: string; model: string } | null;
                };
                return (
                  <div key={item.id} className="rounded-2xl border border-border bg-card p-6">
                    <Quote className="size-5 text-primary" />
                    <p className="mt-3 text-sm text-muted-foreground">{item.comment}</p>
                    <div className="mt-4 flex items-center gap-1 text-primary">
                      {Array.from({ length: item.rating }).map((_, index) => (
                        <Star key={index} className="size-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-3 text-sm font-medium">
                      {item.profiles?.full_name ?? "Customer"}
                      <span className="text-muted-foreground">
                        {item.cars ? ` · ${item.cars.brand} ${item.cars.model}` : ""}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl border border-primary/30 bg-primary/10 p-10 text-center">
          <h2 className="text-3xl font-bold">Ready for your next drive?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Create a free account and book a car in under two minutes.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/cars">Browse Cars</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">Create account</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
