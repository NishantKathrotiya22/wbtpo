# WBTPO venue booking – MVP

Next.js 16 (App Router) + PostgreSQL. No ORM, no UI library.

## Run
```
npm run db:start    # private Postgres on port 5433 (data in ../pgdata)
npm run db:reset    # create schema + demo data (wipes the DB)
npm run dev         # http://localhost:3000
```
Config is in `.env.local` (`DATABASE_URL`, `SESSION_SECRET`).

## Demo logins (password `Wbtpo@123`)
| Role | Email |
|---|---|
| Super Administrator | admin@wbtpo.test |
| Booking Management | booking@wbtpo.test |
| Accounts | accounts@wbtpo.test |
| Management View (read-only) | management@wbtpo.test |
| Organizer | organizer@wbtpo.test |

## Not built yet
Online payment gateway, email, SMS and OTP (payments are recorded by Accounts by hand), photo/video galleries, content scheduling beyond a publish date, report formats other than CSV.
Venue names, capacities, tariffs and notices are placeholders in `db/reset.ts`.

## Before production
Change all demo passwords, set a real `SESSION_SECRET`, move `uploads/` to S3, add login rate limiting, run a security test.

## UI system
Design tokens (colours, radii, shadows) live once in `app/globals.css`, taken from `../realsee-as-your-service-DESIGN.md`.
Every page is built from `components/ui.tsx` (Button, Card, PageHeader, Section, DataTable, Facts, Alert, EmptyState, Stat, ResourceCard, Journey, Checklist, Faq, DarkPanel, SupportPanel), plus `StatusBadge`, `BookingProgress`, `Field`, `ActionForm`.
Add new screens from these; do not hand-write buttons or cards.
