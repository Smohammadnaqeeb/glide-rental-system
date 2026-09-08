import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllBookings, fetchProfiles, type ProfileRow } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: AdminCustomersPage,
});

function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const profilesQuery = useQuery({ queryKey: ["admin-profiles"], queryFn: fetchProfiles });
  const bookingsQuery = useQuery({ queryKey: ["admin-bookings"], queryFn: fetchAllBookings });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", address: "" });

  const profiles = (profilesQuery.data ?? []).filter((profile) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return `${profile.full_name} ${profile.email} ${profile.phone ?? ""}`.toLowerCase().includes(term);
  });

  const bookings = bookingsQuery.data ?? [];
  const bookingsFor = (id: string) => bookings.filter((booking) => booking.customer_id === id);

  const toggleActive = async (profile: ProfileRow) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !profile.is_active })
      .eq("id", profile.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(profile.is_active ? "Customer deactivated" : "Customer activated");
    await queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name, phone: form.phone, address: form.address })
      .eq("id", editing.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Customer updated");
    setEditing(null);
    await queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
  };

  return (
    <AdminPage title="Customers" description="View and manage registered customer accounts.">
      <Input
        className="max-w-sm"
        placeholder="Search by name, email or phone"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {profilesQuery.isLoading ? (
        <LoadingState label="Loading customers..." />
      ) : profilesQuery.isError ? (
        <ErrorState message={(profilesQuery.error as Error).message} />
      ) : profiles.length === 0 ? (
        <EmptyState title="No customers found" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.full_name || "—"}</TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>{profile.phone ?? "—"}</TableCell>
                  <TableCell>{formatDate(profile.created_at)}</TableCell>
                  <TableCell>{bookingsFor(profile.id).length}</TableCell>
                  <TableCell>
                    <StatusBadge status={profile.is_active ? "available" : "inactive"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(profile)}>
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(profile);
                          setForm({
                            full_name: profile.full_name,
                            phone: profile.phone ?? "",
                            address: profile.address ?? "",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void toggleActive(profile)}>
                        {profile.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(value) => !value && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.full_name}</DialogTitle>
            <DialogDescription>{selected?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Phone: </span>
              {selected?.phone ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Address: </span>
              {selected?.address ?? "—"}
            </p>
            <h3 className="pt-2 font-semibold">Booking history</h3>
            {selected && bookingsFor(selected.id).length === 0 ? (
              <p className="text-muted-foreground">No bookings found.</p>
            ) : (
              <ul className="space-y-2">
                {selected &&
                  bookingsFor(selected.id).map((booking) => (
                    <li
                      key={booking.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <span>
                        {booking.booking_reference} · {booking.cars?.brand} {booking.cars?.model}
                      </span>
                      <span className="flex items-center gap-2">
                        {formatCurrency(booking.total_amount)}
                        <StatusBadge status={booking.booking_status} />
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(value) => !value && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>Update the customer's contact details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name">Full name</Label>
              <Input
                id="cust-name"
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone">Phone</Label>
              <Input
                id="cust-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-address">Address</Label>
              <Input
                id="cust-address"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void saveEdit()}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
