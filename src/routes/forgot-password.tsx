import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — DriveEase" },
      { name: "description", content: "Request a password reset link for your DriveEase account." },
      { property: "og:title", content: "Reset your password — DriveEase" },
      { property: "og:description", content: "We'll email you a secure reset link." },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({ email: z.string().email("Enter a valid email address") });

function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: z.infer<typeof schema>) => {
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent — check your inbox.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your account email and we'll send you a link to set a new password.
        </p>

        {sent ? (
          <p className="mt-6 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
            If an account exists for that email, a reset link is on its way.
          </p>
        ) : (
          <Form {...form}>
            <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null} Send reset link
              </Button>
            </form>
          </Form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/auth" className="hover:text-foreground">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
