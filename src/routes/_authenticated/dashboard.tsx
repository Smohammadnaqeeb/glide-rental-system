import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

const tabs = [
  { to: "/dashboard", label: "Overview", exact: true },
  { to: "/dashboard/bookings", label: "My Bookings", exact: false },
  { to: "/dashboard/history", label: "Rental History", exact: false },
  { to: "/dashboard/profile", label: "Profile", exact: false },
] as const;

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold">My dashboard</h1>
        <nav className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </SiteLayout>
  );
}
