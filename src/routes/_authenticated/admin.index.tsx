import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarRange, Car, CheckCircle2, Clock, KeyRound, Users, Wallet } from "lucide-react";
import { AdminPage, StatCard } from "@/components/admin/AdminPage";
import { ErrorState, LoadingState } from "@/components/site/states";
import { fetchAllBookings, fetchCars, fetchPayments, fetchProfiles } from "@/lib/api";
import { formatCurrency, monthKey } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function AdminDashboard() {
  const carsQuery = useQuery({ queryKey: ["cars"], queryFn: fetchCars });
  const bookingsQuery = useQuery({ queryKey: ["admin-bookings"], queryFn: fetchAllBookings });
  const profilesQuery = useQuery({ queryKey: ["admin-profiles"], queryFn: fetchProfiles });
  const paymentsQuery = useQuery({ queryKey: ["admin-payments"], queryFn: fetchPayments });

  if (carsQuery.isLoading || bookingsQuery.isLoading || profilesQuery.isLoading) {
    return <LoadingState label="Loading dashboard..." />;
  }
  if (carsQuery.isError) return <ErrorState message={(carsQuery.error as Error).message} />;

  const cars = carsQuery.data ?? [];
  const bookings = bookingsQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const payments = (paymentsQuery.data ?? []) as unknown as {
    amount: number;
    payment_status: string;
    payment_date: string;
  }[];

  const revenue = payments
    .filter((payment) => payment.payment_status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const revenueByMonth = new Map<string, number>();
  payments
    .filter((payment) => payment.payment_status === "paid")
    .forEach((payment) => {
      const key = monthKey(payment.payment_date);
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(payment.amount));
    });
  const revenueData = Array.from(revenueByMonth, ([month, total]) => ({ month, total }));

  const bookingsByMonth = new Map<string, number>();
  bookings.forEach((booking) => {
    const key = monthKey(booking.created_at);
    bookingsByMonth.set(key, (bookingsByMonth.get(key) ?? 0) + 1);
  });
  const bookingData = Array.from(bookingsByMonth, ([month, count]) => ({ month, count }));

  const carStatusData = ["available", "rented", "maintenance", "inactive"].map((status) => ({
    name: status,
    value: cars.filter((car) => car.status === status).length,
  }));

  const bookingStatusData = ["pending", "confirmed", "active", "completed", "cancelled", "rejected"].map(
    (status) => ({
      name: status,
      value: bookings.filter((booking) => booking.booking_status === status).length,
    }),
  );

  return (
    <AdminPage title="Dashboard" description="Live figures pulled straight from the database.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total cars" value={String(cars.length)} icon={Car} />
        <StatCard
          label="Available cars"
          value={String(cars.filter((car) => car.status === "available").length)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Rented cars"
          value={String(cars.filter((car) => car.status === "rented").length)}
          icon={KeyRound}
        />
        <StatCard label="Total customers" value={String(profiles.length)} icon={Users} />
        <StatCard label="Total bookings" value={String(bookings.length)} icon={CalendarRange} />
        <StatCard
          label="Pending bookings"
          value={String(bookings.filter((booking) => booking.booking_status === "pending").length)}
          icon={Clock}
        />
        <StatCard label="Total revenue" value={formatCurrency(revenue)} icon={Wallet} />
        <StatCard
          label="Active rentals"
          value={String(bookings.filter((booking) => booking.booking_status === "active").length)}
          icon={KeyRound}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Revenue by month">
          {revenueData.length === 0 ? (
            <EmptyChart label="No payments recorded yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line type="monotone" dataKey="total" stroke="var(--chart-1)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Bookings by month">
          {bookingData.length === 0 ? (
            <EmptyChart label="No bookings yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }}
                />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Car status">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={carStatusData} dataKey="value" nameKey="name" outerRadius={95} label>
                {carStatusData.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Booking status">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bookingStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }}
              />
              <Bar dataKey="value" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </AdminPage>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
