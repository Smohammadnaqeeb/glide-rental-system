# DriveWise Rentals

Build a complete, production-quality Car Rental Management System as a responsive full-stack web application.

1. Project Overview

The application is a web-based Car Rental Management System that allows customers to browse available cars, view car details, make rental bookings, manage their bookings, and view their rental history.

An Admin Panel must allow administrators to manage cars, customers, bookings, payments, and overall rental operations.

The system should look like a modern commercial car-rental platform while remaining suitable for a college-level DBMS/full-stack project.

2. Technology Stack

Use:

Frontend: React + TypeScript

UI: Tailwind CSS

Components: shadcn/ui

Icons: Lucide React

Backend: Supabase

Database: PostgreSQL through Supabase

Authentication: Supabase Auth

Storage: Supabase Storage if required for car images

Charts: Recharts

Forms: React Hook Form + Zod

Routing: React Router

Use clean component-based architecture.

Do NOT create only a static frontend. All major operations must be connected to the database.

3. User Roles

Implement two roles:

Customer

Customers can:

Register

Login

Logout

Browse cars

Search and filter cars

View car details

Check availability

Select rental dates

Make bookings

View booking details

Cancel eligible bookings

View rental history

View profile

Update profile

Admin

Admins can:

Login through admin authentication

View dashboard

Manage cars

Add cars

Edit cars

Delete/deactivate cars

Manage customers

Manage bookings

Approve/reject bookings

Manage payments

View rental history

View reports and analytics

Protect admin routes so normal customers cannot access them.

4. Customer Website

Create the following pages:

Home Page

Create a modern landing page containing:

Navbar

Logo: "DriveEase"

Home

Cars

About

Contact

Login/Register

Hero section

Search/rental booking widget

Featured cars

Why choose us

How it works

Customer reviews

Call-to-action section

Footer

Hero text:

"Rent Your Perfect Car, Anytime, Anywhere"

Subtitle:

"Reliable cars, transparent pricing, and effortless booking."

Add a prominent "Browse Cars" button.

Use attractive car imagery and a premium automotive design.

5. Cars Page

Create a complete car listing page.

Each car card should display:

Car image

Brand

Model

Year

Fuel type

Transmission

Seating capacity

Price per day

Availability status

View Details button

Book Now button

Add filters:

Brand

Price range

Fuel type

Transmission

Seating capacity

Availability

Add sorting:

Price: Low to High

Price: High to Low

Newest

Popular

Add search by:

Brand

Model

6. Car Details Page

Create a detailed car page.

Display:

Large car image/gallery

Brand

Model

Year

Registration number (do not expose sensitive information publicly)

Fuel type

Transmission

Seats

Mileage

AC availability

Price per day

Description

Features

Current availability

Include a rental booking section:

Pickup date

Return date

Pickup location

Return location

Number of rental days

Price calculation

Security deposit

Total amount

Book Now button

Before booking, check database availability and prevent overlapping bookings.

7. Authentication

Implement Supabase authentication.

Pages:

Login

Register

Forgot Password

Reset Password

Registration fields:

Full name

Email

Phone number

Password

Confirm password

After registration, create a customer profile in the database.

Validate all forms.

Show proper error and success messages.

8. Customer Dashboard

Create a customer dashboard containing:

Overview

Show:

Active bookings

Upcoming bookings

Completed rentals

Total amount spent

My Bookings

Display bookings in cards/table format.

Each booking should show:

Booking ID

Car

Pickup date

Return date

Pickup location

Return location

Total amount

Booking status

Payment status

Statuses:

Pending

Confirmed

Active

Completed

Cancelled

Rejected

Allow cancellation only when the booking satisfies the cancellation rules.

Rental History

Show all previous rentals.

Profile

Allow customers to update:

Name

Phone

Email

Address

Profile image

9. Booking System

Create a complete booking workflow.

Booking process:

Customer selects car

Selects pickup date

Selects return date

Selects pickup location

Selects return location

System checks availability

System calculates rental duration

System calculates rental price

Customer confirms booking

Booking is stored in database

Booking status becomes "Pending"

Admin can approve the booking

After approval status becomes "Confirmed"

Price calculation:

Rental Cost = Number of Days × Price Per Day

Total Amount:

Rental Cost + Additional Charges + Security Deposit - Discount

Do not allow:

Return date before pickup date

Past rental dates

Booking an unavailable car

Overlapping bookings for the same vehicle

Show a booking confirmation page after successful booking.

Generate a unique Booking ID.

10. Payment System

Create a payment module suitable for a college project.

Payment fields:

Payment ID

Booking ID

Amount

Payment date

Payment method

Payment status

Payment methods:

Cash

UPI

Card

Online

Statuses:

Pending

Paid

Failed

Refunded

For demonstration purposes, implement a simulated payment flow rather than requiring a real payment gateway.

Create a payment confirmation screen.

11. Admin Dashboard

Create a professional admin dashboard.

Sidebar navigation:

Dashboard

Cars

Customers

Bookings

Payments

Rentals

Reports

Settings

Logout

Dashboard cards:

Total Cars

Available Cars

Rented Cars

Total Customers

Total Bookings

Pending Bookings

Total Revenue

Add charts using Recharts:

Revenue Chart

Display revenue by month.

Booking Chart

Display bookings by month.

Car Status Chart

Show:

Available

Rented

Maintenance

Booking Status Chart

Show:

Pending

Confirmed

Completed

Cancelled

Rejected

12. Admin Car Management

Create a complete CRUD interface.

Admin can:

Add car

View cars

Edit car

Delete/deactivate car

Change availability

Mark car as under maintenance

Car fields:

Car ID

Brand

Model

Year

Registration Number

Fuel Type

Transmission

Seating Capacity

Price Per Day

Security Deposit

Mileage

Description

Features

Image

Status

Car statuses:

Available

Rented

Maintenance

Inactive

Use modal/dialog forms for Add and Edit.

Add confirmation before deletion.

13. Admin Customer Management

Create a customer management page.

Display:

Customer ID

Name

Email

Phone

Registration date

Total bookings

Account status

Admin actions:

View customer

Edit customer

Activate/deactivate customer

View booking history

14. Admin Booking Management

Create a booking management table.

Columns:

Booking ID

Customer

Car

Pickup Date

Return Date

Rental Days

Total Amount

Booking Status

Payment Status

Actions

Admin can:

View booking

Approve booking

Reject booking

Cancel booking

Mark as active

Mark as completed

Add filters:

Date

Status

Customer

Car

Payment status

15. Rental Management

Create a rental management section.

When a booking becomes active, create/manage a rental record.

Rental fields:

Rental ID

Booking ID

Customer ID

Car ID

Pickup date

Expected return date

Actual return date

Starting mileage

Ending mileage

Additional charges

Damage charges

Final amount

Rental status

Statuses:

Active

Returned

Late

Cancelled

Allow admin to mark a vehicle as returned.

After return:

Update car availability

Record actual return date

Calculate additional charges if applicable

Update final rental amount

16. Database Design

Create the Supabase PostgreSQL database with proper relationships.

Tables:

profiles

id

full_name

email

phone

address

role

profile_image

created_at

updated_at

Roles:

customer

admin

cars

id

brand

model

year

registration_number

fuel_type

transmission

seats

mileage

price_per_day

security_deposit

description

features

image_url

status

created_at

updated_at

bookings

id

booking_reference

customer_id

car_id

pickup_date

return_date

pickup_location

return_location

rental_days

rental_amount

additional_charges

discount

security_deposit

total_amount

booking_status

created_at

updated_at

payments

id

booking_id

customer_id

amount

payment_method

payment_status

transaction_reference

payment_date

created_at

rentals

id

booking_id

customer_id

car_id

pickup_date

expected_return_date

actual_return_date

starting_mileage

ending_mileage

additional_charges

damage_charges

final_amount

rental_status

created_at

updated_at

reviews

id

customer_id

car_id

booking_id

rating

comment

created_at

17. Database Relationships

Implement proper foreign keys.

Relationships:

profiles 1 → many bookings

cars 1 → many bookings

bookings 1 → many payments

bookings 1 → 1 rental

profiles 1 → many reviews

cars 1 → many reviews

bookings 1 → 1 review

Use indexes on frequently queried fields such as:

car_id

customer_id

booking_status

pickup_date

return_date

payment_status

18. Security

Use Supabase Row Level Security.

Customers should only be able to:

View their own profile

View their own bookings

View their own payments

View their own rentals

Create bookings for themselves

Create reviews for their completed rentals

Admins should have access to management operations.

Never expose passwords.

Do not store passwords manually.

Use Supabase Auth.

Validate all user inputs.

19. Availability Logic

Implement proper vehicle availability checking.

A car cannot be booked if an existing booking overlaps the requested rental period.

Consider bookings with:

Pending

Confirmed

Active

status as blocking availability.

Cancelled and rejected bookings should not block availability.

Use date overlap logic:

Existing pickup < Requested return
AND
Existing return > Requested pickup

If an overlap exists, prevent booking and display:

"This car is unavailable for the selected dates."

20. UI/UX Design

Use a modern premium automotive visual style.

Design characteristics:

Dark navy/black + white interface

Subtle accent color

Large car photography

Rounded cards

Clean typography

Glassmorphism where appropriate

Smooth hover effects

Subtle animations

Professional dashboard

Responsive layout

Do not overuse animations.

Ensure excellent usability on:

Desktop

Tablet

Mobile

21. Navigation

Customer Navbar:

Home

Cars

About

Contact

My Bookings

Profile

Login/Logout

Admin Sidebar:

Dashboard

Cars

Customers

Bookings

Payments

Rentals

Reports

Settings

Logout

22. Reports

Create an admin Reports page.

Reports should include:

Total revenue

Monthly revenue

Number of bookings

Most rented cars

Most active customers

Average rental duration

Available vs rented vehicles

Cancellation rate

Allow filtering by:

Today

This week

This month

This year

Custom date range

Add export buttons for CSV where practical.

23. Notifications

Implement toast notifications for:

Successful login

Registration

Booking created

Booking approved

Booking cancelled

Payment completed

Car added

Car updated

Car deleted

Use clear success/error states.

24. Validation

Use strong validation throughout the application.

Examples:

Required fields cannot be empty

Email must be valid

Phone number must be valid

Password must meet minimum requirements

Rental dates must be valid

Price must be positive

Seats must be positive

Year must be valid

Return date must be after pickup date

Show validation errors beside the relevant fields.

25. Sample Data

Populate the database with realistic sample data for development/demo purposes.

Add at least:

10 cars

5 customers

Several bookings

Several payments

Several rental records

Several reviews

Use realistic brands/models such as:

Toyota

Honda

Hyundai

Kia

BMW

Mercedes-Benz

Audi

Tata

Mahindra

26. Important Business Rules

Implement these rules:

A car cannot have overlapping active bookings.

A customer cannot create a booking with invalid dates.

A booking must belong to an authenticated customer.

Only admins can approve/reject bookings.

Only admins can add/edit/delete cars.

A rented car cannot be deleted.

A car under maintenance cannot be booked.

Payment status must be associated with the booking.

Completed rentals should be stored permanently as rental history.

Customers can review only cars they have successfully rented.

Admin dashboard statistics must come from real database data.

Revenue reports must be calculated from actual payment/rental records.

27. Error Handling

Create proper loading, empty, and error states.

Examples:

Loading cars...

No cars available

No bookings found

Something went wrong

Unable to load data

Booking unavailable

Never leave blank screens.

28. Code Quality

Follow these rules:

TypeScript throughout

Reusable components

Reusable form components

Proper database queries

No unnecessary duplicated code

Environment variables for secrets

Clean folder structure

Proper error handling

Responsive components

Accessible buttons and forms

Meaningful variable names

Do not hardcode dashboard statistics.

All dashboard data must be dynamically calculated from the database.

29. Final Requirement

Build the application as a fully functional Car Rental Management System, not merely a UI prototype.

Make sure:

Authentication works

Database works

CRUD operations work

Booking workflow works

Availability checking works

Admin dashboard works

Customer dashboard works

Payment records work

Rental management works

Reports work

Responsive UI works

Before finishing, test the complete workflow:

Customer Registration
→ Login
→ Browse Cars
→ Select Car
→ Select Dates
→ Check Availability
→ Create Booking
→ Admin Login
→ Approve Booking
→ Payment
→ Active Rental
→ Return Vehicle
→ Complete Rental
→ Customer Review

The final application should be polished enough to demonstrate as a college DBMS/full-stack project and should have a professional commercial appearance.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://glide-rental-system.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a2492faa-7b78-4e6d-8d6c-3394b19af1b5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
