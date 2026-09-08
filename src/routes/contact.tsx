import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, MapPin, Phone } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact DriveEase — Support & Enquiries" },
      {
        name: "description",
        content: "Get in touch with the DriveEase team about bookings, billing or road support.",
      },
      { property: "og:title", content: "Contact DriveEase — Support & Enquiries" },
      { property: "og:description", content: "Questions about a booking? Talk to our team." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^[0-9+\-\s]{10,15}$/, "Enter a valid phone number"),
  message: z.string().min(10, "Tell us a little more (min 10 characters)"),
});

function ContactPage() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  return (
    <SiteLayout>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold">Contact us</h1>
          <p className="mt-4 text-muted-foreground">
            Our support desk answers within one working day. For anything urgent during a rental,
            call the 24/7 road support line.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 text-primary" /> 14 MG Road, Bengaluru 560001
            </li>
            <li className="flex items-center gap-3">
              <Phone className="size-5 text-primary" /> +91 80 4000 1200
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-5 text-primary" /> hello@driveease.example
            </li>
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">
            These contact details are placeholders for the demo — send me your real address, phone
            and email and I'll swap them in.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <Form {...form}>
            <form
              className="space-y-5"
              onSubmit={form.handleSubmit(() => {
                toast.success("Message sent — we'll get back to you shortly.");
                form.reset();
              })}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Aarav Sharma" {...field} />
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
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
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
                      <Input placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="How can we help?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Send message
              </Button>
            </form>
          </Form>
        </div>
      </section>
    </SiteLayout>
  );
}
