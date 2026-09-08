import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminPage } from "@/components/admin/AdminPage";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { fetchCars, fetchProfiles } from "@/lib/api";
import { PICKUP_LOCATIONS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { profile } = useAuth();
  const carsQuery = useQuery({ queryKey: ["cars"], queryFn: fetchCars });
  const profilesQuery = useQuery({ queryKey: ["admin-profiles"], queryFn: fetchProfiles });

  return (
    <AdminPage title="Settings" description="Account and operational settings for DriveEase.">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">Signed-in admin</h2>
          <Separator className="my-4" />
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={profile?.full_name || "—"} />
            <Row label="Email" value={profile?.email || "—"} />
            <Row label="Phone" value={profile?.phone || "—"} />
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Update these details from your customer profile page.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">Operations snapshot</h2>
          <Separator className="my-4" />
          <dl className="space-y-2 text-sm">
            <Row label="Fleet size" value={String((carsQuery.data ?? []).length)} />
            <Row label="Registered accounts" value={String((profilesQuery.data ?? []).length)} />
            <Row label="Pickup hubs" value={String(PICKUP_LOCATIONS.length)} />
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="font-semibold">Pickup and drop-off locations</h2>
          <Separator className="my-4" />
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {PICKUP_LOCATIONS.map((location) => (
              <li key={location} className="rounded-lg border border-border px-3 py-2">
                {location}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Want these editable from the panel? Tell me and I'll move them into the database.
          </p>
        </section>
      </div>
    </AdminPage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
