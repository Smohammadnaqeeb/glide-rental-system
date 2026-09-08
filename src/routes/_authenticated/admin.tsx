import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  CalendarRange,
  Car,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/site/states";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/cars", label: "Cars", icon: Car, exact: false },
  { to: "/admin/customers", label: "Customers", icon: Users, exact: false },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarRange, exact: false },
  { to: "/admin/payments", label: "Payments", icon: CreditCard, exact: false },
  { to: "/admin/rentals", label: "Rentals", icon: KeyRound, exact: false },
  { to: "/admin/reports", label: "Reports", icon: BarChart3, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const { isAdmin, loading, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (loading) return <LoadingState label="Checking permissions..." />;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldAlert className="size-10 text-destructive" />
        <h1 className="text-2xl font-bold">Admins only</h1>
        <p className="max-w-md text-muted-foreground">
          This area is restricted to DriveEase staff accounts.
        </p>
        <Button asChild>
          <Link to="/dashboard">Go to my dashboard</Link>
        </Button>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`${open ? "fixed inset-y-0 left-0 z-50 flex" : "hidden"} w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex lg:static`}
      >
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Car className="size-5" />
          </span>
          <span className="font-bold">DriveEase Admin</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              onClick={() => setOpen(false)}
              activeProps={{
                className: "bg-sidebar-primary text-sidebar-primary-foreground",
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border pt-4">
          <p className="px-3 text-xs text-muted-foreground">{profile?.email}</p>
          <button
            onClick={() => void handleSignOut()}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen((value) => !value)}>
            <Menu className="size-5" />
          </Button>
          <span className="font-semibold">DriveEase Admin</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
