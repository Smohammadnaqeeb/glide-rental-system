import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Car = Database["public"]["Tables"]["cars"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Rental = Database["public"]["Tables"]["rentals"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type CarStatus = Database["public"]["Enums"]["car_status"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type RentalStatus = Database["public"]["Enums"]["rental_status"];

export type BookingWithRelations = Booking & {
  cars: Car | null;
  profiles: Pick<ProfileRow, "id" | "full_name" | "email" | "phone"> | null;
  payments: Payment[];
};

export const BOOKING_SELECT =
  "*, cars(*), profiles(id, full_name, email, phone), payments(*)";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export async function fetchCars(): Promise<Car[]> {
  return unwrap(await supabase.from("cars").select("*").order("created_at", { ascending: false }));
}

export async function fetchCar(id: string): Promise<Car | null> {
  return unwrap(await supabase.from("cars").select("*").eq("id", id).maybeSingle());
}

export async function fetchCarReviews(carId: string) {
  return unwrap(
    await supabase
      .from("reviews")
      .select("*, profiles(full_name, profile_image)")
      .eq("car_id", carId)
      .order("created_at", { ascending: false }),
  );
}

export async function fetchRecentReviews() {
  return unwrap(
    await supabase
      .from("reviews")
      .select("*, profiles(full_name), cars(brand, model)")
      .order("created_at", { ascending: false })
      .limit(6),
  );
}

export async function fetchMyBookings(customerId: string): Promise<BookingWithRelations[]> {
  return unwrap(
    await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
  ) as unknown as BookingWithRelations[];
}

export async function fetchAllBookings(): Promise<BookingWithRelations[]> {
  return unwrap(
    await supabase.from("bookings").select(BOOKING_SELECT).order("created_at", { ascending: false }),
  ) as unknown as BookingWithRelations[];
}

export async function fetchBooking(id: string): Promise<BookingWithRelations | null> {
  return unwrap(
    await supabase.from("bookings").select(BOOKING_SELECT).eq("id", id).maybeSingle(),
  ) as unknown as BookingWithRelations | null;
}

export async function fetchProfiles(): Promise<ProfileRow[]> {
  return unwrap(
    await supabase.from("profiles").select("*").order("created_at", { ascending: false }),
  );
}

export async function fetchPayments() {
  return unwrap(
    await supabase
      .from("payments")
      .select("*, bookings(booking_reference), profiles(full_name, email)")
      .order("payment_date", { ascending: false }),
  );
}

export async function fetchRentals() {
  return unwrap(
    await supabase
      .from("rentals")
      .select("*, bookings(booking_reference), cars(brand, model, registration_number), profiles(full_name)")
      .order("created_at", { ascending: false }),
  );
}

export async function fetchMyRentals(customerId: string) {
  return unwrap(
    await supabase
      .from("rentals")
      .select("*, bookings(booking_reference), cars(brand, model, image_url)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
  );
}

/** Returns true when no pending/confirmed/active booking overlaps the requested window. */
export async function checkAvailability(
  carId: string,
  pickup: string,
  ret: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("car_id", carId)
    .in("booking_status", ["pending", "confirmed", "active"])
    .lt("pickup_date", ret)
    .gt("return_date", pickup);
  if (error) throw new Error(error.message);
  return (data ?? []).length === 0;
}
