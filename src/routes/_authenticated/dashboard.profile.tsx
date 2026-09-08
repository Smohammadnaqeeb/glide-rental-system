import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/site/states";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  component: ProfilePage,
});

const schema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().regex(/^[0-9+\-\s]{10,15}$/, "Enter a valid phone number"),
  address: z.string().max(200).optional().or(z.literal("")),
  profile_image: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
});

function ProfilePage() {
  const { profile, user, refreshProfile, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", phone: "", address: "", profile_image: "" },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        profile_image: profile.profile_image ?? "",
      });
    }
  }, [profile, form]);

  if (loading) return <LoadingState label="Loading profile..." />;

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        address: values.address || null,
        profile_image: values.profile_image || null,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    await refreshProfile();
  };

  const imageUrl = form.watch("profile_image");

  return (
    <div className="max-w-2xl rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={imageUrl || undefined} alt={profile?.full_name ?? "Profile"} />
          <AvatarFallback>{(profile?.full_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{profile?.full_name || "Your profile"}</p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      <Form {...form}>
        <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormDescription>
                  This is your contact email; your sign-in email stays the same.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="profile_image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null} Save changes
          </Button>
        </form>
      </Form>
    </div>
  );
}
