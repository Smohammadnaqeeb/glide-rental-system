import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Receipt } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StatusBadge } from "@/components/site/StatusBadge";
import { ErrorState, LoadingState } from "@/components/site/states";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchBooking, type PaymentMethod } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/booking/$id")({
  head: () => ({
    meta: [
      { title: "Booking confirmation — DriveEase" },
      { name: "description", content: "Review your DriveEase booking details and complete payment." },
      { property: "og:title", content: "Booking confirmation — DriveEase" },
      { property: "og:description", content: "Your rental summary and payment status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingConfirmationPage,
});

function BookingConfirmationPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [paying, setPaying] = useState(false);

  const bookingQuery = useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetchBooking(id),
    enabled: Boolean(user),
  });

  if (loading) {
    return (
      <SiteLayout>
        <LoadingState />
      </SiteLayout>
    );
  }

  if (!user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <p className="text-muted-foreground">Please sign in to view this booking.</p>
          <Button className="mt-5" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <SiteLayout>
        <LoadingState label="Loading booking..." />
      </SiteLayout>
    );
  }

  const booking = bookingQuery.data;
  if (bookingQuery.isError || !booking) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <ErrorState message="We couldn't find this booking." />
        </div>
      </SiteLayout>
    );
  }

  const paid = booking.payments.some((payment) => payment.payment_status === "paid");

  const handlePay = async () => {
    setPaying(true);
    try {
      const { error } = await supabase.from("payments").insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        amount: booking.total_amount,
        payment_method: method,
        payment_status: "paid",
      });
      if (error) throw new Error(error.message);
      toast.success("Payment completed");
      await queryClient.invalidateQueries({ queryKey: ["booking", id] });
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="rounded-3xl border border-success/30 bg-success/10 p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" />
          <h1 className="mt-4 text-2xl font-bold">Booking {paid ? "confirmed" : "received"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your booking reference is{" "}
            <span className="font-semibold text-foreground">{booking.booking_reference}</span>
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {booking.cars?.brand} {booking.cars?.model}
            </h2>
            <StatusBadge status={booking.booking_status} />
          </div>

          <Separator className="my-5" />

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail label="Pickup date" value={formatDate(booking.pickup_date)} />
            <Detail label="Return date" value={formatDate(booking.return_date)} />
            <Detail label="Pickup location" value={booking.pickup_location} />
            <Detail label="Return location" value={booking.return_location} />
            <Detail label="Rental days" value={String(booking.rental_days)} />
            <Detail label="Rental amount" value={formatCurrency(booking.rental_amount)} />
            <Detail label="Security deposit" value={formatCurrency(booking.security_deposit)} />
            <Detail label="Discount" value={formatCurrency(booking.discount)} />
          </dl>

          <Separator className="my-5" />

          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total amount</span>
            <span className="text-primary">{formatCurrency(booking.total_amount)}</span>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Receipt className="size-5 text-primary" /> Payment
          </h2>

          {paid ? (
            <div className="mt-4 space-y-3">
              {booking.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-4 text-sm"
                >
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-muted-foreground">
                      {payment.transaction_reference} · {payment.payment_method.toUpperCase()} ·{" "}
                      {formatDate(payment.payment_date)}
                    </p>
                  </div>
                  <StatusBadge status={payment.payment_status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                This is a simulated payment flow for demonstration — no real money is charged.
              </p>
              <div className="space-y-1.5">
                <Label>Payment method</Label>
                <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
                  <SelectTrigger className="sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online banking</SelectItem>
                    <SelectItem value="cash">Cash at counter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => void handlePay()} disabled={paying}>
                {paying ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Pay {formatCurrency(booking.total_amount)}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => void navigate({ to: "/dashboard/bookings" })}>
            View my bookings
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/cars">Browse more cars</Link>
          </Button>
        </div>
      </div>
    </SiteLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
