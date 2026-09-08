import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Fuel,
  Gauge,
  Loader2,
  Settings2,
  Snowflake,
  Star,
  Users,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StatusBadge } from "@/components/site/StatusBadge";
import { ErrorState, LoadingState } from "@/components/site/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { checkAvailability, fetchCar, fetchCarReviews } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PICKUP_LOCATIONS, daysBetween, formatCurrency, formatDate, todayISO } from "@/lib/format";

export const Route = createFileRoute("/cars/$id")({
  head: () => ({
    meta: [
      { title: "Car details — DriveEase" },
      { name: "description", content: "Full specification, pricing and live availability for this rental car." },
      { property: "og:title", content: "Car details — DriveEase" },
      { property: "og:description", content: "Specs, pricing and availability for this rental car." },
    ],
  }),
  component: CarDetailPage,
});

function CarDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const carQuery = useQuery({ queryKey: ["car", id], queryFn: () => fetchCar(id) });
  const reviewsQuery = useQuery({ queryKey: ["reviews", id], queryFn: () => fetchCarReviews(id) });

  const [pickupDate, setPickupDate] = useState(todayISO());
  const [returnDate, setReturnDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState(PICKUP_LOCATIONS[0]!);
  const [returnLocation, setReturnLocation] = useState(PICKUP_LOCATIONS[0]!);
  const [submitting, setSubmitting] = useState(false);

  const car = carQuery.data;
  const days = useMemo(() => daysBetween(pickupDate, returnDate), [pickupDate, returnDate]);
  const rentalAmount = days * Number(car?.price_per_day ?? 0);
  const deposit = Number(car?.security_deposit ?? 0);
  const total = rentalAmount + deposit;

  const handleBooking = async () => {
    if (!car) return;
    if (!user) {
      toast.error("Please log in to book a car");
      void navigate({ to: "/auth" });
      return;
    }
    if (!pickupDate || !returnDate) {
      toast.error("Select both pickup and return dates");
      return;
    }
    if (pickupDate < todayISO()) {
      toast.error("Pickup date cannot be in the past");
      return;
    }
    if (days < 1) {
      toast.error("Return date must be after the pickup date");
      return;
    }
    if (car.status !== "available") {
      toast.error("This car is not available for booking.");
      return;
    }

    setSubmitting(true);
    try {
      const free = await checkAvailability(car.id, pickupDate, returnDate);
      if (!free) {
        toast.error("This car is unavailable for the selected dates.");
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: user.id,
          car_id: car.id,
          pickup_date: pickupDate,
          return_date: returnDate,
          pickup_location: pickupLocation,
          return_location: returnLocation,
          rental_days: days,
          rental_amount: rentalAmount,
          security_deposit: deposit,
          total_amount: total,
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      toast.success("Booking created — awaiting admin approval");
      void navigate({ to: "/booking/$id", params: { id: data.id } });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (carQuery.isLoading) {
    return (
      <SiteLayout>
        <LoadingState label="Loading car..." />
      </SiteLayout>
    );
  }

  if (carQuery.isError || !car) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <ErrorState message="We couldn't find this car." />
          <div className="mt-6 text-center">
            <Button variant="secondary" asChild>
              <Link to="/cars">Back to cars</Link>
            </Button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const reviews = (reviewsQuery.data ?? []) as unknown as {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    profiles: { full_name: string } | null;
  }[];

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/cars">
            <ArrowLeft className="mr-2 size-4" /> All cars
          </Link>
        </Button>

        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="overflow-hidden rounded-3xl border border-border bg-muted">
              <img
                src={car.image_url ?? ""}
                alt={`${car.brand} ${car.model}`}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>

            <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold">
                  {car.brand} {car.model}
                </h1>
                <p className="mt-1 text-muted-foreground">
                  {car.year} · Registration ending {car.registration_number.slice(-4)}
                </p>
              </div>
              <StatusBadge status={car.status} />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Spec icon={Fuel} label="Fuel" value={car.fuel_type} />
              <Spec icon={Settings2} label="Transmission" value={car.transmission} />
              <Spec icon={Users} label="Seats" value={`${car.seats}`} />
              <Spec icon={Gauge} label="Mileage" value={`${car.mileage} kmpl`} />
              <Spec icon={Snowflake} label="Air conditioning" value={car.has_ac ? "Yes" : "No"} />
              <Spec icon={Star} label="Year" value={`${car.year}`} />
            </div>

            {car.description ? (
              <>
                <h2 className="mt-10 text-xl font-bold">About this car</h2>
                <p className="mt-3 text-muted-foreground">{car.description}</p>
              </>
            ) : null}

            {car.features.length > 0 ? (
              <>
                <h2 className="mt-8 text-xl font-bold">Features</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {car.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="size-4 text-primary" /> {feature}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            <h2 className="mt-10 text-xl font-bold">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No reviews for this car yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-1 text-primary">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star key={index} className="size-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {review.profiles?.full_name ?? "Customer"} · {formatDate(review.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking panel */}
          <aside id="book" className="h-fit rounded-3xl border border-border bg-card p-6 lg:sticky lg:top-24">
            <p className="text-3xl font-bold text-primary">{formatCurrency(car.price_per_day)}</p>
            <p className="text-sm text-muted-foreground">per day</p>

            <Separator className="my-5" />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pickup-date">Pickup date</Label>
                <Input
                  id="pickup-date"
                  type="date"
                  min={todayISO()}
                  value={pickupDate}
                  onChange={(event) => setPickupDate(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="return-date">Return date</Label>
                <Input
                  id="return-date"
                  type="date"
                  min={pickupDate || todayISO()}
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                />
                {returnDate && days < 1 ? (
                  <p className="text-xs text-destructive">
                    Return date must be after the pickup date.
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Pickup location</Label>
                <Select value={pickupLocation} onValueChange={setPickupLocation}>
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
                <Label>Return location</Label>
                <Select value={returnLocation} onValueChange={setReturnLocation}>
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
            </div>

            <Separator className="my-5" />

            <dl className="space-y-2 text-sm">
              <Row label="Rental days" value={String(days)} />
              <Row label={`${days} × ${formatCurrency(car.price_per_day)}`} value={formatCurrency(rentalAmount)} />
              <Row label="Security deposit (refundable)" value={formatCurrency(deposit)} />
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-base font-semibold">
                <dt>Total amount</dt>
                <dd className="text-primary">{formatCurrency(total)}</dd>
              </div>
            </dl>

            <Button
              className="mt-6 w-full"
              size="lg"
              disabled={submitting || car.status !== "available"}
              onClick={() => void handleBooking()}
            >
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {car.status === "available" ? "Book Now" : "Currently unavailable"}
            </Button>
            {!user ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                You'll need to{" "}
                <Link to="/auth" className="text-primary underline">
                  sign in
                </Link>{" "}
                to complete the booking.
              </p>
            ) : (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Booking as {profile?.full_name || "you"} · approval usually within an hour.
              </p>
            )}
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Fuel;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="size-4 text-primary" />
      <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
