import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/AdminPage";
import { EmptyState, ErrorState, LoadingState } from "@/components/site/states";
import { StatusBadge } from "@/components/site/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllBookings, type BookingStatus, type BookingWithRelations } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  component: AdminBookingsPage,
});

const ANY = "any";

function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const bookingsQuery = useQuery({ queryKey: ["admin-bookings"], queryFn: fetchAllBookings });

  const [status, setStatus] = useState(ANY);
  const [paymentFilter, setPaymentFilter] = useState(ANY);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");

  const bookings = bookingsQuery.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (status !== ANY && booking.booking_status !== status) return false;
      const paid = booking.payments.some((payment) => payment.payment_status === "paid");
      if (paymentFilter === "paid" && !paid) return false;
      if (paymentFilter === "pending" && paid) return false;
      if (date && !(booking.pickup_date <= date && booking.return_date >= date)) return false;
      if (term) {
        const haystack = [
          booking.booking_reference,
          booking.profiles?.full_name,
          booking.profiles?.email,
          booking.cars?.brand,
          booking.cars?.model,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [bookings, status, paymentFilter, search, date]);

  const updateStatus = async (booking: BookingWithRelations, next: BookingStatus) => {
    const { error } = await supabase
      .from("bookings")
      .update({ booking_status: next })
      .eq("id", booking.id);
    if (error) {
      toast.error(error.message);
      return;
    }

    if (next === "active") {
      await supabase.from("rentals").upsert(
        {
          booking_id: booking.id,
          customer_id: booking.customer_id,
          car_id: booking.car_id,
          pickup_date: booking.pickup_date,
          expected_return_date: booking.return_date,
          final_amount: booking.total_amount,
          rental_status: "active",
        },
        { onConflict: "booking_id" },
      );
      await supabase.from("cars").update({ status: "rented" }).eq("id", booking.car_id);
    }

    if (next === "completed") {
      await supabase.from("cars").update({ status: "available" }).eq("id", booking.car_id);
    }

    if (next === "cancelled" || next === "rejected") {
      await supabase
        .from("rentals")
        .update({ rental_status: "cancelled" })
        .eq("booking_id", booking.id);
    }

    toast.success(`Booking ${next}`);
    await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    await queryClient.invalidateQueries({ queryKey: ["cars"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-rentals"] });
  };

  return (
    <AdminPage title="Bookings" description="Approve, reject and progress customer bookings.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Search reference, customer or car"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Booking status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All statuses</SelectItem>
            {["pending", "confirmed", "active", "completed", "cancelled", "rejected"].map((item) => (
              <SelectItem key={item} value={item} className="capitalize">
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any payment status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Unpaid</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label="Filter by date within rental period"
        />
      </div>

      {bookingsQuery.isLoading ? (
        <LoadingState label="Loading bookings..." />
      ) : bookingsQuery.isError ? (
        <ErrorState message={(bookingsQuery.error as Error).message} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No bookings found" description="Try clearing the filters." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Return</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => {
                const paid = booking.payments.some((payment) => payment.payment_status === "paid");
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.booking_reference}</TableCell>
                    <TableCell>
                      {booking.profiles?.full_name || "—"}
                      <span className="block text-xs text-muted-foreground">
                        {booking.profiles?.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      {booking.cars?.brand} {booking.cars?.model}
                    </TableCell>
                    <TableCell>{formatDate(booking.pickup_date)}</TableCell>
                    <TableCell>{formatDate(booking.return_date)}</TableCell>
                    <TableCell>{booking.rental_days}</TableCell>
                    <TableCell>{formatCurrency(booking.total_amount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={booking.booking_status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={paid ? "paid" : "pending"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="secondary">
                            Manage
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => void updateStatus(booking, "confirmed")}
                          >
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => void updateStatus(booking, "rejected")}>
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => void updateStatus(booking, "active")}>
                            Mark as active
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => void updateStatus(booking, "completed")}
                          >
                            Mark as completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => void updateStatus(booking, "cancelled")}
                          >
                            Cancel booking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPage>
  );
}
