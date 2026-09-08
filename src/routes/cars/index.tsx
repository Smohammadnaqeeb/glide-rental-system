import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CarCard } from "@/components/site/CarCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/site/states";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCars } from "@/lib/api";

type CarsSearch = {
  pickup?: string | undefined;
  ret?: string | undefined;
  location?: string | undefined;
};

export const Route = createFileRoute("/cars/")({
  validateSearch: (search: Record<string, unknown>): CarsSearch => ({
    pickup: typeof search["pickup"] === "string" ? search["pickup"] : undefined,
    ret: typeof search["ret"] === "string" ? search["ret"] : undefined,
    location: typeof search["location"] === "string" ? search["location"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse Rental Cars — DriveEase" },
      {
        name: "description",
        content:
          "Compare self-drive rental cars by brand, fuel type, transmission, seats and daily price.",
      },
      { property: "og:title", content: "Browse Rental Cars — DriveEase" },
      { property: "og:description", content: "Filter the DriveEase fleet and book in minutes." },
    ],
  }),
  component: CarsPage,
});

const ANY = "any";

function CarsPage() {
  const carsQuery = useQuery({ queryKey: ["cars"], queryFn: fetchCars });
  const cars = carsQuery.data ?? [];

  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState(ANY);
  const [fuel, setFuel] = useState(ANY);
  const [transmission, setTransmission] = useState(ANY);
  const [seats, setSeats] = useState(ANY);
  const [availability, setAvailability] = useState(ANY);
  const [maxPrice, setMaxPrice] = useState(15000);
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const brands = useMemo(
    () => Array.from(new Set(cars.map((car) => car.brand))).sort(),
    [cars],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = cars.filter((car) => {
      if (term && !`${car.brand} ${car.model}`.toLowerCase().includes(term)) return false;
      if (brand !== ANY && car.brand !== brand) return false;
      if (fuel !== ANY && car.fuel_type !== fuel) return false;
      if (transmission !== ANY && car.transmission !== transmission) return false;
      if (seats !== ANY && String(car.seats) !== seats) return false;
      if (availability !== ANY && car.status !== availability) return false;
      if (Number(car.price_per_day) > maxPrice) return false;
      return true;
    });

    return result.sort((a, b) => {
      if (sort === "price-asc") return Number(a.price_per_day) - Number(b.price_per_day);
      if (sort === "price-desc") return Number(b.price_per_day) - Number(a.price_per_day);
      if (sort === "popular") return Number(b.year) - Number(a.year);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [cars, search, brand, fuel, transmission, seats, availability, maxPrice, sort]);

  const resetFilters = () => {
    setSearch("");
    setBrand(ANY);
    setFuel(ANY);
    setTransmission(ANY);
    setSeats(ANY);
    setAvailability(ANY);
    setMaxPrice(15000);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Browse our fleet</h1>
        <p className="mt-2 text-muted-foreground">
          {carsQuery.isLoading ? "Loading cars..." : `${filtered.length} cars match your filters`}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by brand or model"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search cars"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            className="lg:hidden"
            onClick={() => setShowFilters((value) => !value)}
          >
            <SlidersHorizontal className="mr-2 size-4" /> Filters
          </Button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside
            className={`${showFilters ? "block" : "hidden"} h-fit space-y-6 rounded-2xl border border-border bg-card p-5 lg:block`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset
              </Button>
            </div>

            <FilterSelect label="Brand" value={brand} onChange={setBrand} options={brands} />
            <FilterSelect
              label="Fuel type"
              value={fuel}
              onChange={setFuel}
              options={["Petrol", "Diesel", "Electric"]}
            />
            <FilterSelect
              label="Transmission"
              value={transmission}
              onChange={setTransmission}
              options={["Manual", "Automatic"]}
            />
            <FilterSelect label="Seats" value={seats} onChange={setSeats} options={["4", "5", "7"]} />
            <FilterSelect
              label="Availability"
              value={availability}
              onChange={setAvailability}
              options={["available", "rented", "maintenance", "inactive"]}
            />

            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Max price / day: ₹{maxPrice.toLocaleString("en-IN")}
              </Label>
              <Slider
                min={1000}
                max={15000}
                step={500}
                value={[maxPrice]}
                onValueChange={(value) => setMaxPrice(value[0] ?? 15000)}
              />
            </div>
          </aside>

          <div>
            {carsQuery.isLoading ? (
              <LoadingState label="Loading cars..." />
            ) : carsQuery.isError ? (
              <ErrorState message={(carsQuery.error as Error).message} />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No cars available"
                description="Try widening your filters or clearing the search."
                action={
                  <Button variant="secondary" onClick={resetFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option} className="capitalize">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
