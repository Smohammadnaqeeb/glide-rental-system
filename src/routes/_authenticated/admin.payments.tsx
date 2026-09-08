import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EmptyState, ErrorState, LoadingState } from "@/components/site/states";
import { StatusBadge } from "@/components/site/StatusBadge";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { fetchPayments, type PaymentStatus } from "@/lib/api";
import { downloadCsv, formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPaymentsPage,
});

type PaymentRow = {
  id: string;
  amount: number;
  payment_method: string;
  payment_status: PaymentStatus;
  transaction_reference: string;
  payment_date: string;
  bookings: { booking_reference: string } | null;
  profiles: { full_name: string; email: string } | null;
};

const ANY = "any";

function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const paymentsQuery = useQuery({ queryKey: ["admin-payments"], queryFn: fetchPayments });
  const [status, setStatus] = useState(ANY);

  const payments = ((paymentsQuery.data ?? []) as unknown as PaymentRow[]).filter(
    (payment) => status === ANY || payment.payment_status === status,
  );

  const updateStatus = async (id: string, next: PaymentStatus) => {
    const { error } = await supabase.from("payments").update({ payment_status: next }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Payment marked ${next}`);
    await queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
  };

  const total = payments
    .filter((payment) => payment.payment_status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <AdminPage
      title="Payments"
      description={`${formatCurrency(total)} collected across ${payments.length} records.`}
      actions={
        <Button
          variant="secondary"
          onClick={() =>
            downloadCsv(
              "payments.csv",
              payments.map((payment) => ({
                reference: payment.transaction_reference,
                booking: payment.bookings?.booking_reference ?? "",
                customer: payment.profiles?.full_name ?? "",
                amount: payment.amount,
                method: payment.payment_method,
                status: payment.payment_status,
                date: payment.payment_date,
              })),
            )
          }
        >
          <Download className="mr-2 size-4" /> Export CSV
        </Button>
      }
    >
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>All statuses</SelectItem>
          {["pending", "paid", "failed", "refunded"].map((item) => (
            <SelectItem key={item} value={item} className="capitalize">
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {paymentsQuery.isLoading ? (
        <LoadingState label="Loading payments..." />
      ) : paymentsQuery.isError ? (
        <ErrorState message={(paymentsQuery.error as Error).message} />
      ) : payments.length === 0 ? (
        <EmptyState title="No payments found" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Set status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.transaction_reference}</TableCell>
                  <TableCell>{payment.bookings?.booking_reference ?? "—"}</TableCell>
                  <TableCell>{payment.profiles?.full_name ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell className="uppercase">{payment.payment_method}</TableCell>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell>
                    <StatusBadge status={payment.payment_status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={payment.payment_status}
                      onValueChange={(value) =>
                        void updateStatus(payment.id, value as PaymentStatus)
                      }
                    >
                      <SelectTrigger className="ml-auto w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["pending", "paid", "failed", "refunded"].map((item) => (
                          <SelectItem key={item} value={item} className="capitalize">
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPage>
  );
}
