# StockLot ERP

A collaborative, multi-user web application that replaces the monthly Excel workbook used to run a StockLot (surplus apparel) wholesale business. It gives the team one source of truth for master data, and — across upcoming build phases — sales, inventory, dues, expenses, treasury, and automatic profit/summary reporting.

Currency is **BDT**. Interface is **English**. Designed for phones (in the market/warehouse) and desktop (office).

## Status

**Phase 1 — Foundation & Master Data (complete):** login by role, role-based access control (RBAC) with an audit trail, and master data — Styles (with per-style standard cost + aliases), Customers, Suppliers, Locations — plus user management.

Upcoming phases: Inventory → Sales & Receivables → Expenses + Treasury/Partner-Capital → Dashboards → Excel (June'26) import. See `docs/superpowers/plans/`.

## Tech stack

- **Next.js 16** (App Router, TypeScript) — one full-stack codebase
- **Prisma** ORM — **PostgreSQL** (Neon)
- **Auth.js (NextAuth v5)** — credentials + JWT sessions, role in the token
- **Tailwind CSS** UI, mobile-first
- **Vitest** unit tests

## Getting started

```bash
cp .env.example .env             # then fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET
pnpm install                     # install dependencies
pnpm prisma migrate deploy       # apply migrations to the database
pnpm db:seed                     # seed the owner login + reference master data
pnpm dev                         # run at http://localhost:3000
```

**Default login:** `owner@stocklot.local` / `changeme123` — change this after first sign-in (Users → edit → Reset password).

To load the June'26 workbook and print an ERP-vs-XLS reconciliation: `pnpm import:june26` (requires `reference/june26-import.json`).

## Roles

`OWNER`, `PARTNER`, `SALES` (Sales Operator), `INVENTORY` (Inventory Clerk), `ACCOUNTANT`, `ADMIN`. Navigation and every server action are gated by role — e.g. a Sales Operator can manage customers and locations but cannot touch the style master, suppliers, or users.

## Useful commands

```bash
pnpm test          # run the unit test suite
pnpm typecheck     # TypeScript check
pnpm build         # production build
pnpm db:seed       # (re)seed reference data — idempotent
pnpm prisma studio # browse the database
```

## Database & deployment

The app runs on **PostgreSQL** (Neon). The datasource uses two URLs: `DATABASE_URL` (Neon pooled connection, used by the app) and `DIRECT_URL` (Neon direct connection, used by Prisma migrations).

- Apply schema to a new database: `pnpm prisma migrate deploy`
- Enums are modeled as validated string columns (see `src/lib/enums.ts`); money uses `Decimal`.
- Deploy the Next.js app to any Node host (e.g. Vercel). Set `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET` as environment variables; run `pnpm prisma migrate deploy` on release.

## Project layout

```
src/
  app/
    (app)/            authenticated area: dashboard + master modules
      styles/ customers/ suppliers/ locations/ users/
    login/            sign-in page
    api/auth/         Auth.js route handler
  components/         app shell, nav, shared UI primitives (ui.tsx)
  lib/                db, auth guards, rbac, audit, enums, validators/
  proxy.ts            route guard (Next 16 proxy/middleware)
prisma/
  schema.prisma       data model
  seed.ts             owner + reference data
docs/superpowers/     design doc + implementation plans
reference/            the original "Copy of Jun'26.xlsx"
```
