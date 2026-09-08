import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CarFront, CheckCircle2, Wallet } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/site/states";
import { StatusBadge } from "@/components/site/StatusBadge";
import { Button } from "@/components/ui/button";
import { fetchMyBookings } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const { user } = useAuth();
  const bookingsQuery = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: () => fetchMyBookings(user!.id),
    enabled: Boolean(user?.id),
  });

  if (bookingsQuery.isLoading) return <LoadingState label="Loading your dashboard..." />;
  if (bookingsQuery.isError) return <ErrorState message={(bookingsQuery.error as Error).message} />;

  const bookings = bookingsQuery.data ?? [];
  const today = todayISO();
  const active = bookings.filter((booking) => booking.booking_status === "active").length;
  const upcoming = bookings.filter(
    (booking) =>
      ["pending", "confirmed"].includes(booking.booking_status) && booking.pickup_date >= today,
  ).length;
  const completed = bookings.filter((booking) => booking.booking_status === "completed").length;
  const spent = bookings
    .flatMap((booking) => booking.payments)
    .filter((payment) => payment.payment_status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const recent = bookings.slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CarFront} label="Active bookings" value={String(active)} />
        <StatCard icon={CalendarClock} label="Upcoming bookings" value={String(upcoming)} />
        <StatCard icon={CheckCircle2} label="Completed rentals" value={String(completed)} />
        <StatCard icon={Wallet} label="Total spent" value={formatCurrency(spent)} />
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent bookings</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/bookings">View all</Link>
          </Button>
        </div>

        {recent.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No bookings found"
              description="Book your first car to see it here."
              action={
                <Button asChild>
                  <Link to="/cars">Browse Cars</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {recent.map((booking) => (
              <Link
                key={booking.id}
                to="/booking/$id"
                params={{ id: booking.id }}
                className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">
                    {booking.cars?.brand} {booking.cars?.model}
                  </p>
                  <StatusBadge status={booking.booking_status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{booking.booking_reference}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {formatDate(booking.pickup_date)} → {formatDate(booking.return_date)}
                </p>
                <p className="mt-2 font-semibold text-primary">
                  {formatCurrency(booking.total_amount)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CarFront;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
