
-- ===== enums =====
CREATE TYPE public.app_role AS ENUM ('customer','admin');
CREATE TYPE public.car_status AS ENUM ('available','rented','maintenance','inactive');
CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','active','completed','cancelled','rejected');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed','refunded');
CREATE TYPE public.payment_method AS ENUM ('cash','upi','card','online');
CREATE TYPE public.rental_status AS ENUM ('active','returned','late','cancelled');

-- ===== updated_at helper =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== profiles =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  address TEXT,
  profile_image TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===== user_roles =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- new user -> profile + customer role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name',''),
          COALESCE(NEW.email,''),
          NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== cars =====
CREATE TABLE public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL CHECK (year >= 1980),
  registration_number TEXT NOT NULL UNIQUE,
  fuel_type TEXT NOT NULL,
  transmission TEXT NOT NULL,
  seats INT NOT NULL CHECK (seats > 0),
  mileage NUMERIC NOT NULL DEFAULT 0,
  price_per_day NUMERIC NOT NULL CHECK (price_per_day > 0),
  security_deposit NUMERIC NOT NULL DEFAULT 0,
  has_ac BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  features TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  status public.car_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cars TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cars TO authenticated;
GRANT ALL ON public.cars TO service_role;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cars public read" ON public.cars FOR SELECT USING (true);
CREATE POLICY "cars admin insert" ON public.cars FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "cars admin update" ON public.cars FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "cars admin delete" ON public.cars FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') AND status <> 'rented');
CREATE TRIGGER cars_updated BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== bookings =====
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT NOT NULL UNIQUE DEFAULT ('DE-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE RESTRICT,
  pickup_date DATE NOT NULL,
  return_date DATE NOT NULL,
  pickup_location TEXT NOT NULL,
  return_location TEXT NOT NULL,
  rental_days INT NOT NULL CHECK (rental_days > 0),
  rental_amount NUMERIC NOT NULL DEFAULT 0,
  additional_charges NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  security_deposit NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  booking_status public.booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (return_date > pickup_date)
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings read" ON public.bookings FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bookings insert own" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "bookings update" ON public.bookings FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_bookings_car ON public.bookings(car_id);
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX idx_bookings_dates ON public.bookings(pickup_date, return_date);
CREATE TRIGGER bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- overlap + validity guard
CREATE OR REPLACE FUNCTION public.validate_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE car_row public.cars%ROWTYPE;
BEGIN
  IF NEW.booking_status IN ('pending','confirmed','active') THEN
    IF NEW.pickup_date < CURRENT_DATE AND TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'Pickup date cannot be in the past';
    END IF;
    SELECT * INTO car_row FROM public.cars WHERE id = NEW.car_id;
    IF car_row.status IN ('maintenance','inactive') AND TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'This car is not available for booking.';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.car_id = NEW.car_id
        AND b.id <> NEW.id
        AND b.booking_status IN ('pending','confirmed','active')
        AND b.pickup_date < NEW.return_date
        AND b.return_date > NEW.pickup_date
    ) THEN
      RAISE EXCEPTION 'This car is unavailable for the selected dates.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER bookings_validate BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking();

-- ===== payments =====
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  payment_method public.payment_method NOT NULL DEFAULT 'online',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  transaction_reference TEXT NOT NULL DEFAULT ('TXN-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments read" ON public.payments FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "payments insert own" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "payments update admin" ON public.payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_payments_booking ON public.payments(booking_id);
CREATE INDEX idx_payments_status ON public.payments(payment_status);

-- ===== rentals =====
CREATE TABLE public.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE RESTRICT,
  pickup_date DATE NOT NULL,
  expected_return_date DATE NOT NULL,
  actual_return_date DATE,
  starting_mileage NUMERIC,
  ending_mileage NUMERIC,
  additional_charges NUMERIC NOT NULL DEFAULT 0,
  damage_charges NUMERIC NOT NULL DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  rental_status public.rental_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.rentals TO authenticated;
GRANT ALL ON public.rentals TO service_role;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rentals read" ON public.rentals FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "rentals admin write" ON public.rentals FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "rentals admin update" ON public.rentals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_rentals_car ON public.rentals(car_id);
CREATE INDEX idx_rentals_customer ON public.rentals(customer_id);
CREATE TRIGGER rentals_updated BEFORE UPDATE ON public.rentals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== reviews =====
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews insert own completed" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid() AND b.booking_status = 'completed'
  ));
CREATE POLICY "reviews delete own" ON public.reviews FOR DELETE TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_reviews_car ON public.reviews(car_id);

-- ===== sample cars =====
INSERT INTO public.cars (brand, model, year, registration_number, fuel_type, transmission, seats, mileage, price_per_day, security_deposit, description, features, image_url, status) VALUES
('Toyota','Innova Crysta',2022,'KA01AB1234','Diesel','Automatic',7,14,3800,5000,'Spacious 7-seater ideal for family trips and long highway drives.','{"Rear AC","Cruise Control","Reverse Camera","Bluetooth"}','https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80','available'),
('Honda','City',2023,'KA02CD2345','Petrol','Automatic',5,18,2400,3000,'Refined sedan with a smooth CVT gearbox and premium cabin.','{"Sunroof","Apple CarPlay","Cruise Control"}','https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=80','available'),
('Hyundai','Creta',2023,'KA03EF3456','Petrol','Manual',5,17,2600,3500,'Popular compact SUV with commanding road presence.','{"Panoramic Sunroof","Ventilated Seats","360 Camera"}','https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80','available'),
('Kia','Seltos',2022,'KA04GH4567','Diesel','Automatic',5,19,2700,3500,'Feature-loaded SUV with a punchy diesel engine.','{"Bose Audio","Air Purifier","Wireless Charging"}','https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1200&q=80','available'),
('BMW','3 Series',2023,'KA05IJ5678','Petrol','Automatic',5,12,9500,20000,'Sport sedan delivering the classic rear-wheel-drive BMW feel.','{"Leather Seats","Head-up Display","Harman Kardon"}','https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80','available'),
('Mercedes-Benz','C-Class',2022,'KA06KL6789','Petrol','Automatic',5,11,11000,25000,'Executive luxury saloon with an exceptional interior.','{"Ambient Lighting","Burmester Audio","Memory Seats"}','https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80','available'),
('Audi','Q3',2023,'KA07MN7890','Petrol','Automatic',5,13,10500,22000,'Compact luxury SUV that blends comfort with agility.','{"Virtual Cockpit","Quattro AWD","Powered Tailgate"}','https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=1200&q=80','maintenance'),
('Tata','Nexon EV',2023,'KA08OP8901','Electric','Automatic',5,312,3200,6000,'All-electric SUV with a long real-world range and zero emissions.','{"Fast Charging","Connected Car","Sunroof"}','https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&q=80','available'),
('Mahindra','Thar',2022,'KA09QR9012','Diesel','Manual',4,15,4200,8000,'Rugged 4x4 built for weekend off-road adventures.','{"4x4","Removable Top","Washable Interior"}','https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80','available'),
('Maruti Suzuki','Swift',2023,'KA10ST0123','Petrol','Manual',5,22,1500,2000,'Light, nippy hatchback perfect for city driving.','{"Touchscreen","Keyless Entry","ABS"}','https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80','available'),
('Toyota','Fortuner',2022,'KA11UV1234','Diesel','Automatic',7,10,6500,12000,'Bold full-size SUV that handles any terrain with ease.','{"4x4","Leather Seats","Power Tailgate"}','https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200&q=80','available'),
('Hyundai','i20',2023,'KA12WX2345','Petrol','Automatic',5,20,1800,2500,'Premium hatchback with a high-quality cabin and smooth ride.','{"Sunroof","Bose Audio","Wireless CarPlay"}','https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&q=80','available');
