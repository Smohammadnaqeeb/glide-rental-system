import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminPage, StatCard } from "@/components/admin/AdminPage";
import { ErrorState, LoadingState } from "@/components/site/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAllBookings, fetchCars, fetchPayments } from "@/lib/api";
import { downloadCsv, formatCurrency, monthKey } from "@/lib/format";
import { BarChart3, CalendarRange, Percent, Timer, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReportsPage,
});

type Range = "today" | "week" | "month" | "year" | "custom";

function rangeStart(range: Range): Date {
  const now = new Date();
  const start = new Date(now);
  if (range === "today") start.setHours(0, 0, 0, 0);
  if (range === "week") start.setDate(now.getDate() - 7);
  if (range === "month") start.setMonth(now.getMonth() - 1);
  if (range === "year") start.setFullYear(now.getFullYear() - 1);
  return start;
}

function AdminReportsPage() {
  const bookingsQuery = useQuery({ queryKey: ["admin-bookings"], queryFn: fetchAllBookings });
  const paymentsQuery = useQuery({ queryKey: ["admin-payments"], queryFn: fetchPayments });
  const carsQuery = useQuery({ queryKey: ["cars"], queryFn: fetchCars });

  const [range, setRange] = useState<Range>("year");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const inRange = useMemo(() => {
    if (range === "custom") {
      const start = from ? new Date(from).getTime() : 0;
      const end = to ? new Date(to).getTime() + 86_400_000 : Number.MAX_SAFE_INTEGER;
      return (value: string) => {
        const time = new Date(value).getTime();
        return time >= start && time <= end;
      };
    }
    const start = rangeStart(range).getTime();
    return (value: string) => new Date(value).getTime() >= start;
  }, [range, from, to]);

  if (bookingsQuery.isLoading || paymentsQuery.isLoading || carsQuery.isLoading) {
    return <LoadingState label="Building reports..." />;
  }
  if (bookingsQuery.isError) return <ErrorState message={(bookingsQuery.error as Error).message} />;

  const cars = carsQuery.data ?? [];
  const bookings = (bookingsQuery.data ?? []).filter((booking) => inRange(booking.created_at));
  const payments = ((paymentsQuery.data ?? []) as unknown as {
    amount: number;
    payment_status: string;
    payment_date: string;
  }[]).filter((payment) => inRange(payment.payment_date) && payment.payment_status === "paid");

  const revenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  const monthly = new Map<string, number>();
  payments.forEach((payment) => {
    const key = monthKey(payment.payment_date);
    monthly.set(key, (monthly.get(key) ?? 0) + Number(payment.amount));
  });
  const monthlyData = Array.from(monthly, ([month, total]) => ({ month, total }));

  const carCounts = new Map<string, { name: string; count: number; revenue: number }>();
  bookings.forEach((booking) => {
    if (!booking.cars) return;
    const key = booking.cars.id;
    const entry = carCounts.get(key) ?? {
      name: `${booking.cars.brand} ${booking.cars.model}`,
      count: 0,
      revenue: 0,
    };
    entry.count += 1;
    entry.revenue += Number(booking.total_amount);
    carCounts.set(key, entry);
  });
  const topCars = Array.from(carCounts.values()).sort((a, b) => b.count - a.count).slice(0, 5);

  const customerCounts = new Map<string, { name: string; count: number; spend: number }>();
  bookings.forEach((booking) => {
    const key = booking.customer_id;
    const entry = customerCounts.get(key) ?? {
      name: booking.profiles?.full_name ?? "Customer",
      count: 0,
      spend: 0,
    };
    entry.count += 1;
    entry.spend += Number(booking.total_amount);
    customerCounts.set(key, entry);
  });
  const topCustomers = Array.from(customerCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const avgDuration =
    bookings.length === 0
      ? 0
      : bookings.reduce((sum, booking) => sum + booking.rental_days, 0) / bookings.length;

  const cancellations = bookings.filter((booking) =>
    ["cancelled", "rejected"].includes(booking.booking_status),
  ).length;
  const cancellationRate = bookings.length === 0 ? 0 : (cancellations / bookings.length) * 100;

  return (
    <AdminPage
      title="Reports"
      description="Every figure is calculated from live booking and payment records."
      actions={
        <Button
          variant="secondary"
          onClick={() =>
            downloadCsv(
              "bookings-report.csv",
              bookings.map((booking) => ({
                reference: booking.booking_reference,
                customer: booking.profiles?.full_name ?? "",
                car: `${booking.cars?.brand ?? ""} ${booking.cars?.model ?? ""}`,
                pickup: booking.pickup_date,
                return: booking.return_date,
                days: booking.rental_days,
                total: booking.total_amount,
                status: booking.booking_status,
              })),
            )
          }
        >
          <Download className="mr-2 size-4" /> Export bookings CSV
        </Button>
      }
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Period</Label>
          <Select value={range} onValueChange={(value) => setRange(value as Range)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="year">This year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {range === "custom" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input id="to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </div>
          </>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={formatCurrency(revenue)} icon={Wallet} />
        <StatCard label="Bookings" value={String(bookings.length)} icon={CalendarRange} />
        <StatCard
          label="Avg. rental duration"
          value={`${avgDuration.toFixed(1)} days`}
          icon={Timer}
        />
        <StatCard
          label="Cancellation rate"
          value={`${cancellationRate.toFixed(1)}%`}
          icon={Percent}
        />
        <StatCard
          label="Available vehicles"
          value={String(cars.filter((car) => car.status === "available").length)}
          icon={BarChart3}
        />
        <StatCard
          label="Rented vehicles"
          value={String(cars.filter((car) => car.status === "rented").length)}
          icon={BarChart3}
        />
        <StatCard
          label="Maintenance"
          value={String(cars.filter((car) => car.status === "maintenance").length)}
          icon={BarChart3}
        />
        <StatCard label="Fleet size" value={String(cars.length)} icon={BarChart3} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold">Monthly revenue</h2>
        {monthlyData.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No revenue recorded in this period.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="total" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportTable
          title="Most rented cars"
          headers={["Car", "Bookings", "Revenue"]}
          rows={topCars.map((car) => [car.name, String(car.count), formatCurrency(car.revenue)])}
        />
        <ReportTable
          title="Most active customers"
          headers={["Customer", "Bookings", "Spend"]}
          rows={topCustomers.map((customer) => [
            customer.name,
            String(customer.count),
            formatCurrency(customer.spend),
          ])}
        />
      </div>
    </AdminPage>
  );
}

function ReportTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No data for this period.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.join("-")}>
                {row.map((cell, index) => (
                  <TableCell key={index}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
