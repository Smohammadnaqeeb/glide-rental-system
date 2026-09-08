/**
 * Browser-only demo database.
 *
 * Everything lives in localStorage so the app runs with no external backend.
 * Data resets when the browser storage is cleared and is not shared between
 * devices — that is intentional for demo use.
 */
import { SEED_CARS } from "./seed-cars";

export type Row = Record<string, any>;
export type TableName =
  | "cars"
  | "profiles"
  | "user_roles"
  | "bookings"
  | "payments"
  | "rentals"
  | "reviews"
  | "users";

export type LocalDatabase = Record<TableName, Row[]>;

export const DB_KEY = "driveease.demo.db.v1";
export const SESSION_KEY = "driveease.demo.session.v1";

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function bookingReference(): string {
  return `DE-${uuid().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

const iso = (d: Date) => d.toISOString();
const day = (offset: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const stamp = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return iso(d);
};

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";

function buildSeed(): LocalDatabase {
  const cars = SEED_CARS.map((car) => ({ ...car }));
  const swift = cars.find((c) => c.model === "Swift") ?? cars[0]!;
  const creta = cars.find((c) => c.model === "Creta") ?? cars[1]!;

  const users = [
    {
      id: ADMIN_ID,
      email: "admin@driveease.example",
      password: "Admin@12345",
      full_name: "Fleet Admin",
      phone: "+91 90000 00001",
    },
    {
      id: CUSTOMER_ID,
      email: "demo.customer@example.com",
      password: "Demo@12345",
      full_name: "Demo Customer",
      phone: "+91 98765 43210",
    },
  ];

  const profiles = users.map((u, i) => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    address: i === 1 ? "12 Residency Road, Bengaluru" : null,
    profile_image: null,
    is_active: true,
    created_at: stamp(-60),
    updated_at: stamp(-60),
  }));

  const user_roles = [
    { id: uuid(), user_id: ADMIN_ID, role: "admin", created_at: stamp(-60) },
    { id: uuid(), user_id: CUSTOMER_ID, role: "customer", created_at: stamp(-60) },
  ];

  const past = {
    id: uuid(),
    booking_reference: bookingReference(),
    customer_id: CUSTOMER_ID,
    car_id: swift.id,
    pickup_date: day(-20),
    return_date: day(-17),
    pickup_location: "Bengaluru — MG Road",
    return_location: "Bengaluru — MG Road",
    rental_days: 3,
    rental_amount: swift.price_per_day * 3,
    security_deposit: swift.security_deposit,
    additional_charges: 0,
    discount: 0,
    total_amount: swift.price_per_day * 3 + swift.security_deposit,
    booking_status: "completed",
    created_at: stamp(-24),
    updated_at: stamp(-17),
  };

  const upcoming = {
    id: uuid(),
    booking_reference: bookingReference(),
    customer_id: CUSTOMER_ID,
    car_id: creta.id,
    pickup_date: day(5),
    return_date: day(8),
    pickup_location: "Bengaluru — Airport",
    return_location: "Bengaluru — Airport",
    rental_days: 3,
    rental_amount: creta.price_per_day * 3,
    security_deposit: creta.security_deposit,
    additional_charges: 0,
    discount: 0,
    total_amount: creta.price_per_day * 3 + creta.security_deposit,
    booking_status: "confirmed",
    created_at: stamp(-2),
    updated_at: stamp(-2),
  };

  const payments = [
    {
      id: uuid(),
      booking_id: past.id,
      customer_id: CUSTOMER_ID,
      amount: past.total_amount,
      payment_method: "upi",
      payment_status: "paid",
      transaction_reference: `TXN-${uuid().slice(0, 8).toUpperCase()}`,
      payment_date: stamp(-24),
      created_at: stamp(-24),
    },
    {
      id: uuid(),
      booking_id: upcoming.id,
      customer_id: CUSTOMER_ID,
      amount: upcoming.total_amount,
      payment_method: "card",
      payment_status: "paid",
      transaction_reference: `TXN-${uuid().slice(0, 8).toUpperCase()}`,
      payment_date: stamp(-2),
      created_at: stamp(-2),
    },
  ];

  const rentals = [
    {
      id: uuid(),
      booking_id: past.id,
      customer_id: CUSTOMER_ID,
      car_id: swift.id,
      pickup_date: past.pickup_date,
      expected_return_date: past.return_date,
      actual_return_date: past.return_date,
      starting_mileage: 41000,
      ending_mileage: 41520,
      additional_charges: 0,
      damage_charges: 0,
      final_amount: past.total_amount,
      rental_status: "returned",
      created_at: stamp(-20),
      updated_at: stamp(-17),
    },
  ];

  const reviews = [
    {
      id: uuid(),
      booking_id: past.id,
      car_id: swift.id,
      customer_id: CUSTOMER_ID,
      rating: 5,
      comment: "Excellent car, smooth booking experience.",
      created_at: stamp(-16),
    },
  ];

  return {
    cars,
    profiles,
    user_roles,
    bookings: [upcoming, past],
    payments,
    rentals,
    reviews,
    users,
  };
}

let memory: LocalDatabase | null = null;

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readDb(): LocalDatabase {
  if (!hasStorage()) {
    memory ??= buildSeed();
    return memory;
  }
  const raw = window.localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as LocalDatabase;
    } catch {
      /* fall through to reseed */
    }
  }
  const seeded = buildSeed();
  window.localStorage.setItem(DB_KEY, JSON.stringify(seeded));
  return seeded;
}

export function writeDb(db: LocalDatabase) {
  if (!hasStorage()) {
    memory = db;
    return;
  }
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function resetDb() {
  const seeded = buildSeed();
  writeDb(seeded);
  if (hasStorage()) window.localStorage.removeItem(SESSION_KEY);
}

export const DEMO_ACCOUNTS = {
  admin: { email: "admin@driveease.example", password: "Admin@12345" },
  customer: { email: "demo.customer@example.com", password: "Demo@12345" },
};
