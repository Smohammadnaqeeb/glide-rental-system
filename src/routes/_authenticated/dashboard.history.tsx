import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/site/states";
import { StatusBadge } from "@/components/site/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyBookings, fetchMyRentals } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/history")({
  component: RentalHistoryPage,
});

function RentalHistoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const rentalsQuery = useQuery({
    queryKey: ["my-rentals", user?.id],
    queryFn: () => fetchMyRentals(user!.id),
    enabled: Boolean(user?.id),
  });
  const bookingsQuery = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: () => fetchMyBookings(user!.id),
    enabled: Boolean(user?.id),
  });

  if (rentalsQuery.isLoading || bookingsQuery.isLoading) {
    return <LoadingState label="Loading rental history..." />;
  }
  if (rentalsQuery.isError) return <ErrorState message={(rentalsQuery.error as Error).message} />;

  const rentals = (rentalsQuery.data ?? []) as unknown as {
    id: string;
    booking_id: string;
    pickup_date: string;
    expected_return_date: string;
    actual_return_date: string | null;
    final_amount: number;
    rental_status: string;
    bookings: { booking_reference: string } | null;
    cars: { brand: string; model: string; image_url: string | null } | null;
  }[];

  const reviewable = (bookingsQuery.data ?? []).filter(
    (booking) => booking.booking_status === "completed",
  );

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-bold">Past and current rentals</h2>
        {rentals.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No rentals yet"
              description="Your rental records appear here once a booking becomes active."
              action={
                <Button asChild>
                  <Link to="/cars">Browse Cars</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {rentals.map((rental) => (
              <div
                key={rental.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <div>
                  <p className="font-semibold">
                    {rental.cars?.brand} {rental.cars?.model}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rental.bookings?.booking_reference}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Picked up {formatDate(rental.pickup_date)} · Expected{" "}
                    {formatDate(rental.expected_return_date)} · Returned{" "}
                    {formatDate(rental.actual_return_date)}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={rental.rental_status} />
                  <p className="mt-2 font-semibold text-primary">
                    {formatCurrency(rental.final_amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">Leave a review</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You can review cars from bookings that are completed.
        </p>
        {reviewable.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No completed rentals to review yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {reviewable.map((booking) => (
              <ReviewCard
                key={booking.id}
                bookingId={booking.id}
                carId={booking.car_id}
                customerId={booking.customer_id}
                title={`${booking.cars?.brand ?? ""} ${booking.cars?.model ?? ""}`}
                reference={booking.booking_reference}
                onSaved={() => {
                  void queryClient.invalidateQueries({ queryKey: ["reviews"] });
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ReviewCard({
  bookingId,
  carId,
  customerId,
  title,
  reference,
  onSaved,
}: {
  bookingId: string;
  carId: string;
  customerId: string;
  title: string;
  reference: string;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      booking_id: bookingId,
      car_id: carId,
      customer_id: customerId,
      rating,
      comment,
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("duplicate")
          ? "You've already reviewed this rental."
          : error.message,
      );
      return;
    }
    toast.success("Thanks for your review!");
    setOpen(false);
    onSaved();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{reference}</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="secondary" className="mt-4">
            Write a review
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {title}</DialogTitle>
            <DialogDescription>Share how your rental went.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} star`}
                onClick={() => setRating(value)}
                className="p-1"
              >
                <Star
                  className={`size-6 ${value <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
          <Textarea
            rows={4}
            placeholder="Tell others about the car and the service"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <DialogFooter>
            <Button onClick={() => void submit()} disabled={busy}>
              Submit review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
