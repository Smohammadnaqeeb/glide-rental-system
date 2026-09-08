import { Link } from "@tanstack/react-router";
import { Fuel, Gauge, Settings2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { formatCurrency } from "@/lib/format";
import type { Car } from "@/lib/api";

export function CarCard({ car }: { car: Car }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={car.image_url ?? ""}
          alt={`${car.brand} ${car.model}`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <StatusBadge status={car.status} className="backdrop-blur" />
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">
              {car.brand} {car.model}
            </h3>
            <p className="text-sm text-muted-foreground">{car.year}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{formatCurrency(car.price_per_day)}</p>
            <p className="text-xs text-muted-foreground">per day</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Fuel className="size-3.5" /> {car.fuel_type}
          </span>
          <span className="flex items-center gap-1.5">
            <Settings2 className="size-3.5" /> {car.transmission}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" /> {car.seats} seats
          </span>
          <span className="flex items-center gap-1.5">
            <Gauge className="size-3.5" /> {car.mileage} kmpl
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" asChild>
            <Link to="/cars/$id" params={{ id: car.id }}>
              View Details
            </Link>
          </Button>
          <Button className="flex-1" disabled={car.status !== "available"} asChild={car.status === "available"}>
            {car.status === "available" ? (
              <Link to="/cars/$id" params={{ id: car.id }} hash="book">
                Book Now
              </Link>
            ) : (
              <span>Unavailable</span>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
