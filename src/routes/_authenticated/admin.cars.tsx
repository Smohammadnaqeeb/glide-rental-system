import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EmptyState, ErrorState, LoadingState } from "@/components/site/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchCars, type Car, type CarStatus } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/cars")({
  component: AdminCarsPage,
});

const currentYear = new Date().getFullYear();

const carSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce
    .number()
    .int()
    .min(1980, "Year must be 1980 or later")
    .max(currentYear + 1, "Year looks invalid"),
  registration_number: z.string().min(4, "Registration number is required"),
  fuel_type: z.string().min(1, "Fuel type is required"),
  transmission: z.string().min(1, "Transmission is required"),
  seats: z.coerce.number().int().positive("Seats must be positive"),
  mileage: z.coerce.number().min(0, "Mileage cannot be negative"),
  price_per_day: z.coerce.number().positive("Price must be positive"),
  security_deposit: z.coerce.number().min(0, "Deposit cannot be negative"),
  description: z.string().optional().or(z.literal("")),
  features: z.string().optional().or(z.literal("")),
  image_url: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
  status: z.enum(["available", "rented", "maintenance", "inactive"]),
  has_ac: z.enum(["yes", "no"]),
});

type CarFormValues = z.input<typeof carSchema>;

function AdminCarsPage() {
  const queryClient = useQueryClient();
  const carsQuery = useQuery({ queryKey: ["cars"], queryFn: fetchCars });
  const [editing, setEditing] = useState<Car | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const form = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      brand: "",
      model: "",
      year: currentYear,
      registration_number: "",
      fuel_type: "Petrol",
      transmission: "Manual",
      seats: 5,
      mileage: 15,
      price_per_day: 2000,
      security_deposit: 3000,
      description: "",
      features: "",
      image_url: "",
      status: "available",
      has_ac: "yes",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        brand: editing.brand,
        model: editing.model,
        year: editing.year,
        registration_number: editing.registration_number,
        fuel_type: editing.fuel_type,
        transmission: editing.transmission,
        seats: editing.seats,
        mileage: Number(editing.mileage),
        price_per_day: Number(editing.price_per_day),
        security_deposit: Number(editing.security_deposit),
        description: editing.description ?? "",
        features: editing.features.join(", "),
        image_url: editing.image_url ?? "",
        status: editing.status,
        has_ac: editing.has_ac ? "yes" : "no",
      });
    } else {
      form.reset();
    }
  }, [editing, open, form]);

  const onSubmit = async (raw: CarFormValues) => {
    const values = carSchema.parse(raw);
    setBusy(true);
    const payload = {
      brand: values.brand,
      model: values.model,
      year: values.year,
      registration_number: values.registration_number,
      fuel_type: values.fuel_type,
      transmission: values.transmission,
      seats: values.seats,
      mileage: values.mileage,
      price_per_day: values.price_per_day,
      security_deposit: values.security_deposit,
      description: values.description || null,
      features: (values.features ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      image_url: values.image_url || null,
      status: values.status as CarStatus,
      has_ac: values.has_ac === "yes",
    };

    const { error } = editing
      ? await supabase.from("cars").update(payload).eq("id", editing.id)
      : await supabase.from("cars").insert(payload);
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Car updated" : "Car added");
    setOpen(false);
    setEditing(null);
    await queryClient.invalidateQueries({ queryKey: ["cars"] });
  };

  const deleteCar = async (car: Car) => {
    if (car.status === "rented") {
      toast.error("A rented car cannot be deleted.");
      return;
    }
    const { error } = await supabase.from("cars").delete().eq("id", car.id);
    if (error) {
      toast.error("This car has bookings, so it was deactivated instead.");
      await supabase.from("cars").update({ status: "inactive" }).eq("id", car.id);
    } else {
      toast.success("Car deleted");
    }
    await queryClient.invalidateQueries({ queryKey: ["cars"] });
  };

  const changeStatus = async (car: Car, status: CarStatus) => {
    const { error } = await supabase.from("cars").update({ status }).eq("id", car.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Marked as ${status}`);
    await queryClient.invalidateQueries({ queryKey: ["cars"] });
  };

  return (
    <AdminPage
      title="Cars"
      description="Add, edit and manage the rental fleet."
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" /> Add car
        </Button>
      }
    >
      {carsQuery.isLoading ? (
        <LoadingState label="Loading cars..." />
      ) : carsQuery.isError ? (
        <ErrorState message={(carsQuery.error as Error).message} />
      ) : (carsQuery.data ?? []).length === 0 ? (
        <EmptyState title="No cars available" description="Add your first vehicle to get started." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Reg. no.</TableHead>
                <TableHead>Fuel</TableHead>
                <TableHead>Transmission</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Price/day</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(carsQuery.data ?? []).map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="font-medium">
                    {car.brand} {car.model}
                    <span className="block text-xs text-muted-foreground">{car.year}</span>
                  </TableCell>
                  <TableCell>{car.registration_number}</TableCell>
                  <TableCell>{car.fuel_type}</TableCell>
                  <TableCell>{car.transmission}</TableCell>
                  <TableCell>{car.seats}</TableCell>
                  <TableCell>{formatCurrency(car.price_per_day)}</TableCell>
                  <TableCell>
                    <Select
                      value={car.status}
                      onValueChange={(value) => void changeStatus(car, value as CarStatus)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="rented">Rented</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Edit car"
                        onClick={() => {
                          setEditing(car);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" aria-label="Delete car">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete {car.brand} {car.model}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This cannot be undone. Cars with booking history are deactivated
                              instead of deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep car</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void deleteCar(car)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit car" : "Add car"}</DialogTitle>
            <DialogDescription>
              All fields are validated before the car is saved.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
              <TextField control={form.control} name="brand" label="Brand" />
              <TextField control={form.control} name="model" label="Model" />
              <TextField control={form.control} name="year" label="Year" type="number" />
              <TextField
                control={form.control}
                name="registration_number"
                label="Registration number"
              />
              <SelectField
                control={form.control}
                name="fuel_type"
                label="Fuel type"
                options={["Petrol", "Diesel", "Electric", "Hybrid", "CNG"]}
              />
              <SelectField
                control={form.control}
                name="transmission"
                label="Transmission"
                options={["Manual", "Automatic"]}
              />
              <TextField control={form.control} name="seats" label="Seats" type="number" />
              <TextField control={form.control} name="mileage" label="Mileage (kmpl)" type="number" />
              <TextField
                control={form.control}
                name="price_per_day"
                label="Price per day (₹)"
                type="number"
              />
              <TextField
                control={form.control}
                name="security_deposit"
                label="Security deposit (₹)"
                type="number"
              />
              <SelectField
                control={form.control}
                name="status"
                label="Status"
                options={["available", "rented", "maintenance", "inactive"]}
              />
              <SelectField
                control={form.control}
                name="has_ac"
                label="Air conditioning"
                options={["yes", "no"]}
              />
              <div className="sm:col-span-2">
                <TextField control={form.control} name="image_url" label="Image URL" />
              </div>
              <div className="sm:col-span-2">
                <TextField
                  control={form.control}
                  name="features"
                  label="Features (comma separated)"
                />
              </div>
              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="sm:col-span-2">
                <Button type="submit" disabled={busy}>
                  {editing ? "Save changes" : "Add car"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

type FieldProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: keyof CarFormValues;
  label: string;
};

function TextField({ control, name, label, type }: FieldProps & { type?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type ?? "text"} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SelectField({ control, name, label, options }: FieldProps & { options: string[] }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={String(field.value)} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option} className="capitalize">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
