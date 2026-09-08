import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/AdminPage";
import { EmptyState, ErrorState, LoadingState } from "@/components/site/states";
import { StatusBadge } from "@/components/site/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchRentals } from "@/lib/api";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/rentals")({
  component: AdminRentalsPage,
});

type RentalRow = {
  id: string;
  booking_id: string;
  car_id: string;
  pickup_date: string;
  expected_return_date: string;
  actual_return_date: string | null;
  starting_mileage: number | null;
  ending_mileage: number | null;
  additional_charges: number;
  damage_charges: number;
  final_amount: number;
  rental_status: string;
  bookings: { booking_reference: string } | null;
  cars: { brand: string; model: string; registration_number: string } | null;
  profiles: { full_name: string } | null;
};

function AdminRentalsPage() {
  const queryClient = useQueryClient();
  const rentalsQuery = useQuery({ queryKey: ["admin-rentals"], queryFn: fetchRentals });
  const [active, setActive] = useState<RentalRow | null>(null);
  const [form, setForm] = useState({
    actual_return_date: todayISO(),
    ending_mileage: "",
    additional_charges: "0",
    damage_charges: "0",
  });

  const rentals = (rentalsQuery.data ?? []) as unknown as RentalRow[];

  const markReturned = async () => {
    if (!active) return;
    const extra = Number(form.additional_charges) || 0;
    const damage = Number(form.damage_charges) || 0;
    const late = form.actual_return_date > active.expected_return_date;

    const { error } = await supabase
      .from("rentals")
      .update({
        actual_return_date: form.actual_return_date,
        ending_mileage: form.ending_mileage ? Number(form.ending_mileage) : null,
        additional_charges: extra,
        damage_charges: damage,
        final_amount: Number(active.final_amount) + extra + damage,
        rental_status: late ? "late" : "returned",
      })
      .eq("id", active.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    await supabase.from("cars").update({ status: "available" }).eq("id", active.car_id);
    await supabase
      .from("bookings")
      .update({
        booking_status: "completed",
        additional_charges: extra + damage,
      })
      .eq("id", active.booking_id);

    toast.success("Vehicle marked as returned");
    setActive(null);
    await queryClient.invalidateQueries({ queryKey: ["admin-rentals"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    await queryClient.invalidateQueries({ queryKey: ["cars"] });
  };

  return (
    <AdminPage title="Rentals" description="Track vehicles that are out on the road.">
      {rentalsQuery.isLoading ? (
        <LoadingState label="Loading rentals..." />
      ) : rentalsQuery.isError ? (
        <ErrorState message={(rentalsQuery.error as Error).message} />
      ) : rentals.length === 0 ? (
        <EmptyState
          title="No rentals yet"
          description="A rental record is created when a booking is marked active."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Expected return</TableHead>
                <TableHead>Actual return</TableHead>
                <TableHead>Final amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentals.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell className="font-medium">
                    {rental.bookings?.booking_reference ?? "—"}
                  </TableCell>
                  <TableCell>{rental.profiles?.full_name ?? "—"}</TableCell>
                  <TableCell>
                    {rental.cars?.brand} {rental.cars?.model}
                    <span className="block text-xs text-muted-foreground">
                      {rental.cars?.registration_number}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(rental.pickup_date)}</TableCell>
                  <TableCell>{formatDate(rental.expected_return_date)}</TableCell>
                  <TableCell>{formatDate(rental.actual_return_date)}</TableCell>
                  <TableCell>{formatCurrency(rental.final_amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={rental.rental_status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {rental.rental_status === "active" ? (
                      <Button size="sm" onClick={() => setActive(rental)}>
                        Mark returned
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Closed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={Boolean(active)} onOpenChange={(value) => !value && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return vehicle</DialogTitle>
            <DialogDescription>
              Record the return details; extra charges are added to the final amount.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="return-date">Actual return date</Label>
              <Input
                id="return-date"
                type="date"
                value={form.actual_return_date}
                onChange={(event) => setForm({ ...form, actual_return_date: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-mileage">Ending mileage (km)</Label>
              <Input
                id="end-mileage"
                type="number"
                value={form.ending_mileage}
                onChange={(event) => setForm({ ...form, ending_mileage: event.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="extra">Additional charges (₹)</Label>
                <Input
                  id="extra"
                  type="number"
                  min={0}
                  value={form.additional_charges}
                  onChange={(event) =>
                    setForm({ ...form, additional_charges: event.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="damage">Damage charges (₹)</Label>
                <Input
                  id="damage"
                  type="number"
                  min={0}
                  value={form.damage_charges}
                  onChange={(event) => setForm({ ...form, damage_charges: event.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void markReturned()}>Complete return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
