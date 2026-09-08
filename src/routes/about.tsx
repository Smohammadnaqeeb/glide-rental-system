import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Gauge, Target, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About DriveEase — Self-Drive Car Rentals" },
      {
        name: "description",
        content:
          "DriveEase is a self-drive car rental service offering a serviced fleet, city pickup hubs and clear pricing.",
      },
      { property: "og:title", content: "About DriveEase — Self-Drive Car Rentals" },
      {
        property: "og:description",
        content: "A serviced fleet, six city hubs and pricing you can see before you book.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <h1 className="text-4xl font-extrabold">About DriveEase</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          DriveEase is a self-drive car rental platform built around a simple idea: renting a car
          should be as easy as booking a hotel room. We keep a well-maintained fleet, publish every
          charge up front, and confirm bookings quickly so you can plan with confidence.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {[
            { icon: Target, title: "Our mission", text: "Make mobility flexible and affordable for every traveller." },
            { icon: Gauge, title: "Our fleet", text: "Hatchbacks to luxury SUVs, serviced before every handover." },
            { icon: Building2, title: "Our hubs", text: "Six pickup locations across Bengaluru, Mumbai, Delhi, Hyderabad and Pune." },
            { icon: Users, title: "Our team", text: "A small crew of operations specialists and 24/7 road support." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
              <item.icon className="size-6 text-primary" />
              <h2 className="mt-4 font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-16 text-2xl font-bold">How renting works</h2>
        <ol className="mt-5 space-y-4 text-muted-foreground">
          <li>1. Browse the fleet and pick the car that fits your trip.</li>
          <li>2. Choose your pickup and return dates — we check live availability.</li>
          <li>3. Confirm the booking; our team reviews and approves it.</li>
          <li>4. Pay the rental plus refundable deposit and collect your keys.</li>
          <li>5. Return the car; the deposit is settled after inspection.</li>
        </ol>

        <div className="mt-12">
          <Button size="lg" asChild>
            <Link to="/cars">Browse Cars</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
