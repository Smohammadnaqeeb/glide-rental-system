import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingState } from "@/components/site/states";
import { StatusBadge } from "@/components/site/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyBookings, type BookingWithRelations } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/bookings")({
  component: MyBookingsPage,
});

/** A booking can be cancelled while it is still pending or confirmed. */
export function canCancel(booking: BookingWithRelations): boolean {
  return ["pending", "confirmed"].includes(booking.booking_status);
}

function MyBookingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const bookingsQuery = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: () => fetchMyBookings(user!.id),
    enabled: Boolean(user?.id),
  });

  const cancelBooking = async (id: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ booking_status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking cancelled");
    await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
  };

  if (bookingsQuery.isLoading) return <LoadingState label="Loading bookings..." />;
  if (bookingsQuery.isError) return <ErrorState message={(bookingsQuery.error as Error).message} />;

  const bookings = bookingsQuery.data ?? [];
  if (bookings.length === 0) {
    return (
      <EmptyState
        title="No bookings found"
        description="Once you book a car it will appear here."
        action={
          <Button asChild>
            <Link to="/cars">Browse Cars</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const payment = booking.payments.find((item) => item.payment_status === "paid");
        return (
          <article key={booking.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-4">
                {booking.cars?.image_url ? (
                  <img
                    src={booking.cars.image_url}
                    alt={`${booking.cars.brand} ${booking.cars.model}`}
                    className="hidden size-24 rounded-xl object-cover sm:block"
                    loading="lazy"
                  />
                ) : null}
                <div>
                  <p className="font-semibold">
                    {booking.cars?.brand} {booking.cars?.model}
                  </p>
                  <p className="text-xs text-muted-foreground">{booking.booking_reference}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDate(booking.pickup_date)} → {formatDate(booking.return_date)} ·{" "}
                    {booking.rental_days} days
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.pickup_location} → {booking.return_location}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 sm:items-end">
                <div className="flex gap-2">
                  <StatusBadge status={booking.booking_status} />
                  <StatusBadge status={payment ? "paid" : "pending"} />
                </div>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(booking.total_amount)}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" asChild>
                    <Link to="/booking/$id" params={{ id: booking.id }}>
                      View details
                    </Link>
                  </Button>
                  {canCancel(booking) ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Booking {booking.booking_reference} will be cancelled and the car
                            released for those dates.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep booking</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void cancelBooking(booking.id)}>
                            Cancel booking
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
