import { Link } from "@tanstack/react-router";
import { Car, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Car className="size-5" />
            </span>
            <span className="text-lg font-bold">DriveEase</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Reliable cars, transparent pricing, and effortless booking across India.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/cars" className="hover:text-foreground">
                Browse cars
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-foreground">
                About us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Account</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/auth" className="hover:text-foreground">
                Login
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-foreground">
                My dashboard
              </Link>
            </li>
            <li>
              <Link to="/dashboard/bookings" className="hover:text-foreground">
                My bookings
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Reach us</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" /> 14 MG Road, Bengaluru 560001
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4" /> +91 80 4000 1200
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" /> hello@driveease.example
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DriveEase. Demo project — contact details are placeholders.
      </div>
    </footer>
  );
}
