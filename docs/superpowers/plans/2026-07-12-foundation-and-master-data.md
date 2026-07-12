# Foundation & Master Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the StockLot ERP application shell — a running, mobile-friendly web app where users log in by role, an admin manages users, and staff manage the master data (styles with standard cost + aliases, customers, suppliers, locations) — all changes attributed and audit-logged.

**Architecture:** One full-stack Next.js (App Router, TypeScript) application. Prisma ORM over SQLite in dev (PostgreSQL-portable schema). Server Actions for mutations, server components for reads. Auth via credentials (hashed passwords) + role-based access enforced by a server-side permission helper. Tailwind + a small set of hand-rolled UI components tuned for phone entry.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma 6 (SQLite dev → Postgres prod), Auth.js (NextAuth v5) credentials, bcrypt, Zod, Tailwind CSS v4, Vitest for unit tests, Playwright optional later.

## Global Constraints

- **Currency:** BDT everywhere; money stored as Prisma `Decimal(14,2)`; quantities `Int`.
- **Language:** English UI.
- **Enums:** modeled as Prisma `enum` is NOT used (SQLite portability) — use `String` columns validated by shared Zod enums in `src/lib/enums.ts`.
- **Dates:** real `DateTime`/`DateTime @db.Date` values, never text.
- **Every transactional/master row** carries `createdById`, `createdAt`, `updatedById`, `updatedAt`.
- **Audit:** create/update/delete of tracked entities writes an `AuditLog` row.
- **Node:** 18.18+ (dev env is Node 25). Package manager: **pnpm**.
- **RBAC roles (exact strings):** `OWNER`, `PARTNER`, `SALES`, `INVENTORY`, `ACCOUNTANT`, `ADMIN`.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind config`, `src/app/layout.tsx`, `src/app/page.tsx`, `.gitignore`, `.env`, `.env.example`
- Create: `README.md`

**Interfaces:**
- Produces: a runnable Next.js app on `http://localhost:3000`; `pnpm dev`, `pnpm build`, `pnpm test` scripts.

- [ ] **Step 1: Initialize git and scaffold**

Run in project root (`/Users/smmoshiurrahman/Downloads/Projects/KashifAlom`):
```bash
git init
mkdir -p reference && git mv "Copy of Jun'26.xlsx" reference/ 2>/dev/null || mv "Copy of Jun'26.xlsx" reference/
pnpm dlx create-next-app@latest . --ts --tailwind --app --src-dir --import-alias "@/*" --eslint --no-turbopack --use-pnpm --yes
```
Expected: Next.js files created without overwriting `docs/` or `reference/`.

- [ ] **Step 2: Add core dependencies**

```bash
pnpm add prisma @prisma/client next-auth@beta bcryptjs zod
pnpm add -D @types/bcryptjs vitest @vitejs/plugin-react tsx
```

- [ ] **Step 3: Add test script + Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
```
Add to `package.json` scripts: `"test": "vitest run"`, `"db:seed": "tsx prisma/seed.ts"`.

- [ ] **Step 4: Verify it runs**

Run: `pnpm build`
Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js + TypeScript + Tailwind app"
```

---

### Task 2: Database schema (all MVP models)

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`, `src/lib/enums.ts`
- Modify: `.env` (DATABASE_URL)

**Interfaces:**
- Produces: `prisma` client singleton `db` from `@/lib/db`; the full data model; enum constants from `@/lib/enums`.

- [ ] **Step 1: Set datasource**

`.env`: `DATABASE_URL="file:./dev.db"`

- [ ] **Step 2: Write `prisma/schema.prisma`**

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }

model AppUser {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         String   // OWNER|PARTNER|SALES|INVENTORY|ACCOUNTANT|ADMIN
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model ProductStyle {
  id              String   @id @default(cuid())
  styleCode       String   @unique
  styleName       String
  genderAgeGroup  String?  // Mens|Ladies|Boys|Girls|Kids|Unisex
  category        String?
  seasonFlag      String?  // Winter|Summer|All
  grade           String?  // A|B-Grade|C-Grade|Mixed
  isBulkLot       Boolean  @default(false)
  standardCost    Decimal  @default(0)
  active          Boolean  @default(true)
  aliases         StyleAlias[]
  createdById     String?
  updatedById     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model StyleAlias {
  id        String       @id @default(cuid())
  aliasText String       @unique
  styleId   String
  style     ProductStyle @relation(fields: [styleId], references: [id], onDelete: Cascade)
}

model Customer {
  id                String   @id @default(cuid())
  name              String
  phone             String?
  defaultLocationId String?
  location          Location? @relation(fields: [defaultLocationId], references: [id])
  creditTerms       String?
  openingDueBalance Decimal  @default(0)
  active            Boolean  @default(true)
  createdById       String?
  updatedById       String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Supplier {
  id           String   @id @default(cuid())
  name         String
  contactPhone String?
  address      String?
  notes        String?
  active       Boolean  @default(true)
  createdById  String?
  updatedById  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Location {
  id           String   @id @default(cuid())
  areaName     String
  marketOrShop String?
  customers    Customer[]
  createdById  String?
  updatedById  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  entity    String
  entityId  String
  action    String   // CREATE|UPDATE|DELETE
  field     String?
  oldValue  String?
  newValue  String?
  at        DateTime @default(now())
}
```
> Later plans append: Period, PurchaseReceipt/ReceiptLine, InventoryPosition, SalesChallan/SaleLine, PaymentReceipt, ReceivableEntry, ExpenseCategory/Expense, Partner/CapitalMovement/TreasuryDeposit.

- [ ] **Step 3: Create client singleton `src/lib/db.ts`**

```ts
import { PrismaClient } from '@prisma/client'
const g = globalThis as unknown as { prisma?: PrismaClient }
export const db = g.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') g.prisma = db
```

- [ ] **Step 4: Create `src/lib/enums.ts`**

```ts
import { z } from 'zod'
export const ROLES = ['OWNER','PARTNER','SALES','INVENTORY','ACCOUNTANT','ADMIN'] as const
export const RoleEnum = z.enum(ROLES)
export type Role = (typeof ROLES)[number]
export const GENDER_GROUPS = ['Mens','Ladies','Boys','Girls','Kids','Unisex'] as const
export const SEASONS = ['Winter','Summer','All'] as const
export const GRADES = ['A','B-Grade','C-Grade','Mixed'] as const
```

- [ ] **Step 5: Migrate + generate**

```bash
pnpm prisma migrate dev --name init
```
Expected: `dev.db` created, client generated.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: prisma schema for users, masters, audit log"
```

---

### Task 3: Authentication (credentials + sessions)

**Files:**
- Create: `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/password.ts`, `src/app/login/page.tsx`, `src/app/login/actions.ts`
- Create test: `src/lib/password.test.ts`

**Interfaces:**
- Produces: `auth()` (server session getter), `signIn`/`signOut`, `hashPassword(pw)`, `verifyPassword(pw, hash)`.

- [ ] **Step 1: Write failing test for password hashing**

`src/lib/password.test.ts`:
```ts
import { expect, test } from 'vitest'
import { hashPassword, verifyPassword } from './password'
test('hash then verify roundtrips', async () => {
  const h = await hashPassword('secret123')
  expect(h).not.toBe('secret123')
  expect(await verifyPassword('secret123', h)).toBe(true)
  expect(await verifyPassword('wrong', h)).toBe(false)
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pnpm test src/lib/password.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/password.ts`**

```ts
import bcrypt from 'bcryptjs'
export const hashPassword = (pw: string) => bcrypt.hash(pw, 10)
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash)
```

- [ ] **Step 4: Run test — expect PASS**

Run: `pnpm test src/lib/password.test.ts` → PASS.

- [ ] **Step 5: Configure Auth.js in `src/auth.ts`**

```ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (c) => {
        const user = await db.appUser.findUnique({ where: { email: String(c?.email) } })
        if (!user || !user.active) return null
        if (!(await verifyPassword(String(c?.password), user.passwordHash))) return null
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => { if (user) token.role = (user as any).role; return token },
    session: ({ session, token }) => { (session.user as any).role = token.role; return session },
  },
})
```

- [ ] **Step 6: Route handler + login page + login action**

`src/app/api/auth/[...nextauth]/route.ts`:
```ts
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```
`src/app/login/actions.ts`:
```ts
'use server'
import { signIn } from '@/auth'
export async function login(_: unknown, formData: FormData) {
  try {
    await signIn('credentials', {
      email: formData.get('email'), password: formData.get('password'), redirectTo: '/',
    })
  } catch (e) { return 'Invalid email or password' }
}
```
`src/app/login/page.tsx`: a simple form (email, password) posting to the `login` action, showing the error string. (Full JSX in build.)

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: credentials auth with hashed passwords"
```

---

### Task 4: RBAC guard + seed owner

**Files:**
- Create: `src/lib/rbac.ts`, `prisma/seed.ts`, `middleware.ts`
- Create test: `src/lib/rbac.test.ts`

**Interfaces:**
- Consumes: `auth()` from `@/auth`.
- Produces: `can(role, action)`, `requireRole(...roles)` (throws/redirects), `requireUser()`.

- [ ] **Step 1: Failing test for permission matrix**

`src/lib/rbac.test.ts`:
```ts
import { expect, test } from 'vitest'
import { can } from './rbac'
test('sales cannot manage users; owner can', () => {
  expect(can('SALES', 'users.manage')).toBe(false)
  expect(can('OWNER', 'users.manage')).toBe(true)
  expect(can('INVENTORY', 'styles.write')).toBe(true)
  expect(can('SALES', 'styles.write')).toBe(false)
})
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement `src/lib/rbac.ts`**

```ts
import type { Role } from '@/lib/enums'
type Action =
  | 'users.manage' | 'styles.write' | 'customers.write' | 'suppliers.write'
  | 'locations.write' | 'masters.read'
const MATRIX: Record<Action, Role[]> = {
  'users.manage': ['OWNER','ADMIN'],
  'styles.write': ['OWNER','ADMIN','INVENTORY'],
  'customers.write': ['OWNER','ADMIN','SALES','ACCOUNTANT'],
  'suppliers.write': ['OWNER','ADMIN','INVENTORY','ACCOUNTANT'],
  'locations.write': ['OWNER','ADMIN','SALES','INVENTORY'],
  'masters.read': ['OWNER','ADMIN','SALES','INVENTORY','ACCOUNTANT','PARTNER'],
}
export const can = (role: Role, action: Action) => MATRIX[action].includes(role)
```

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: `requireUser`/`requireRole` server helpers + `middleware.ts`**

`src/lib/rbac.ts` (append):
```ts
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
export async function requireUser() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return session.user as { id: string; name: string; email: string; role: Role }
}
export async function requireRole(...roles: Role[]) {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect('/')
  return user
}
```
`middleware.ts` protects all routes except `/login` and `/api/auth` (redirect to `/login` when unauthenticated).

- [ ] **Step 6: Seed owner user `prisma/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'
const db = new PrismaClient()
async function main() {
  const email = 'owner@stocklot.local'
  await db.appUser.upsert({
    where: { email },
    update: {},
    create: { name: 'Owner', email, role: 'OWNER', passwordHash: await hashPassword('changeme123') },
  })
  console.log('Seeded owner:', email, '/ changeme123')
}
main().finally(() => db.$disconnect())
```
Run: `pnpm db:seed`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: RBAC guard, middleware, seed owner user"
```

---

### Task 5: App shell & role-aware navigation

**Files:**
- Create: `src/components/app-shell.tsx`, `src/components/nav.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx` (dashboard placeholder)
- Modify: `src/app/layout.tsx` (root html + Tailwind base)

**Interfaces:**
- Consumes: `requireUser()`.
- Produces: authenticated layout with sidebar/topbar; nav items filtered by `can(role, …)`.

- [ ] **Step 1:** Build `(app)/layout.tsx` calling `requireUser()`, rendering `<AppShell user=…>{children}</AppShell>`.
- [ ] **Step 2:** `AppShell` renders a responsive top bar (business name, user, sign-out) + a nav (Dashboard, Styles, Customers, Suppliers, Locations, Users) where each link is shown only if the user's role passes the matching `can(...)` check.
- [ ] **Step 3:** Dashboard placeholder page shows "Welcome, {name} ({role})".
- [ ] **Step 4: Manual verify** — `pnpm dev`, log in as owner, see all nav; confirm sign-out works.
- [ ] **Step 5: Commit** `feat: authenticated app shell with role-aware nav`.

---

### Task 6: Audit logging helper

**Files:**
- Create: `src/lib/audit.ts`
- Create test: `src/lib/audit.test.ts`

**Interfaces:**
- Produces: `writeAudit({userId, entity, entityId, action, changes?})` and `diff(oldObj,newObj)` used by every master action.

- [ ] **Step 1: Failing test for `diff`**

```ts
import { expect, test } from 'vitest'
import { diff } from './audit'
test('diff returns only changed fields', () => {
  expect(diff({a:1,b:2}, {a:1,b:3})).toEqual([{ field:'b', oldValue:'2', newValue:'3' }])
})
```

- [ ] **Step 2: Run — FAIL.**
- [ ] **Step 3: Implement `diff` + `writeAudit`**

```ts
import { db } from '@/lib/db'
export function diff(oldO: Record<string,any>, newO: Record<string,any>) {
  const out: {field:string; oldValue:string|null; newValue:string|null}[] = []
  for (const k of new Set([...Object.keys(oldO), ...Object.keys(newO)])) {
    const o = oldO[k], n = newO[k]
    if (String(o ?? '') !== String(n ?? ''))
      out.push({ field:k, oldValue: o==null?null:String(o), newValue: n==null?null:String(n) })
  }
  return out
}
export async function writeAudit(p:{userId?:string; entity:string; entityId:string; action:'CREATE'|'UPDATE'|'DELETE'; changes?:ReturnType<typeof diff>}) {
  if (p.action==='UPDATE' && p.changes)
    await db.auditLog.createMany({ data: p.changes.map(c => ({ ...c, userId:p.userId, entity:p.entity, entityId:p.entityId, action:p.action })) })
  else
    await db.auditLog.create({ data: { userId:p.userId, entity:p.entity, entityId:p.entityId, action:p.action } })
}
```

- [ ] **Step 4: Run — PASS.**
- [ ] **Step 5: Commit** `feat: audit logging helper`.

---

### Task 7: Style master (with standard cost + aliases)

**Files:**
- Create: `src/lib/validators/style.ts`, `src/app/(app)/styles/actions.ts`, `src/app/(app)/styles/page.tsx`, `src/app/(app)/styles/style-form.tsx`
- Create test: `src/lib/validators/style.test.ts`

**Interfaces:**
- Consumes: `requireRole('OWNER','ADMIN','INVENTORY')`, `writeAudit`, `db`.
- Produces: `styleSchema` (Zod), `createStyle`/`updateStyle`/`deactivateStyle` server actions, styles list + form UI.

- [ ] **Step 1: Failing test for `styleSchema`**

```ts
import { expect, test } from 'vitest'
import { styleSchema } from './style'
test('requires code and name; cost >= 0', () => {
  expect(styleSchema.safeParse({ styleCode:'', styleName:'x', standardCost:1 }).success).toBe(false)
  expect(styleSchema.safeParse({ styleCode:'TS-01', styleName:'Mens T-Shirt', standardCost:-1 }).success).toBe(false)
  expect(styleSchema.safeParse({ styleCode:'TS-01', styleName:'Mens T-Shirt', standardCost:40 }).success).toBe(true)
})
```

- [ ] **Step 2: Run — FAIL.**
- [ ] **Step 3: Implement `src/lib/validators/style.ts`**

```ts
import { z } from 'zod'
import { GENDER_GROUPS, SEASONS, GRADES } from '@/lib/enums'
export const styleSchema = z.object({
  styleCode: z.string().min(1),
  styleName: z.string().min(1),
  genderAgeGroup: z.enum(GENDER_GROUPS).optional(),
  category: z.string().optional(),
  seasonFlag: z.enum(SEASONS).optional(),
  grade: z.enum(GRADES).optional(),
  isBulkLot: z.boolean().default(false),
  standardCost: z.coerce.number().min(0),
})
export type StyleInput = z.infer<typeof styleSchema>
```

- [ ] **Step 4: Run — PASS.**
- [ ] **Step 5: Server actions `src/app/(app)/styles/actions.ts`** — `createStyle`/`updateStyle` validate with `styleSchema`, enforce `requireRole`, write via `db`, call `writeAudit`, `revalidatePath('/styles')`. Include an `addAlias(styleId, aliasText)` action.
- [ ] **Step 6: UI** — `page.tsx` lists styles (code, name, group, standard cost, active) with search; `style-form.tsx` create/edit; alias add/remove. Mobile-friendly table→cards.
- [ ] **Step 7: Manual verify** — create a style, edit its cost, add an alias; confirm audit rows exist (`pnpm prisma studio`).
- [ ] **Step 8: Commit** `feat: style master with standard cost and aliases`.

---

### Task 8: Customer master

**Files:**
- Create: `src/lib/validators/customer.ts`, `src/app/(app)/customers/{actions.ts,page.tsx,customer-form.tsx}`
- Create test: `src/lib/validators/customer.test.ts`

**Interfaces:**
- Consumes: `requireRole('OWNER','ADMIN','SALES','ACCOUNTANT')`, `writeAudit`, `db`, locations list.
- Produces: `customerSchema`, `createCustomer`/`updateCustomer`/`deactivateCustomer`.

- [ ] **Step 1:** Failing test: `customerSchema` requires non-empty `name`, `openingDueBalance >= 0`, optional `phone`, optional `defaultLocationId`.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement `customerSchema` (Zod), mirroring the style pattern.
- [ ] **Step 4:** Run — PASS.
- [ ] **Step 5:** Server actions with `requireRole` + `writeAudit`.
- [ ] **Step 6:** UI list + form with a location dropdown.
- [ ] **Step 7:** Manual verify create/edit; audit rows present.
- [ ] **Step 8: Commit** `feat: customer master`.

---

### Task 9: Supplier master

**Files:** `src/lib/validators/supplier.ts`, `src/app/(app)/suppliers/{actions.ts,page.tsx,supplier-form.tsx}`, test.

**Interfaces:** Consumes `requireRole('OWNER','ADMIN','INVENTORY','ACCOUNTANT')`. Produces `supplierSchema`, `createSupplier`/`updateSupplier`/`deactivateSupplier`.

- [ ] **Step 1:** Failing test: `supplierSchema` requires `name`; `contactPhone`, `address`, `notes` optional.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement schema.
- [ ] **Step 4:** Run — PASS.
- [ ] **Step 5:** Server actions (`requireRole` + `writeAudit`).
- [ ] **Step 6:** UI list + form.
- [ ] **Step 7:** Manual verify.
- [ ] **Step 8: Commit** `feat: supplier master`.

---

### Task 10: Location master

**Files:** `src/lib/validators/location.ts`, `src/app/(app)/locations/{actions.ts,page.tsx,location-form.tsx}`, test.

**Interfaces:** Consumes `requireRole('OWNER','ADMIN','SALES','INVENTORY')`. Produces `locationSchema`, `createLocation`/`updateLocation`.

- [ ] **Step 1:** Failing test: `locationSchema` requires `areaName`; `marketOrShop` optional.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement schema.
- [ ] **Step 4:** Run — PASS.
- [ ] **Step 5:** Server actions.
- [ ] **Step 6:** UI list + form.
- [ ] **Step 7:** Manual verify.
- [ ] **Step 8: Commit** `feat: location master`.

---

### Task 11: User management (admin)

**Files:** `src/lib/validators/user.ts`, `src/app/(app)/users/{actions.ts,page.tsx,user-form.tsx}`, test.

**Interfaces:** Consumes `requireRole('OWNER','ADMIN')`, `hashPassword`, `writeAudit`. Produces `userSchema`, `createUser`/`updateUser`/`toggleUserActive`/`resetPassword`.

- [ ] **Step 1:** Failing test: `userSchema` requires `name`, valid `email`, `role ∈ ROLES`; password min length on create.
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement schema using `RoleEnum`.
- [ ] **Step 4:** Run — PASS.
- [ ] **Step 5:** Server actions: create hashes password; update can change role/active; `resetPassword`; never expose `passwordHash`. Guard: an OWNER cannot be deactivated by a non-OWNER; audit every change.
- [ ] **Step 6:** UI list (name, email, role, active) + form; only visible to OWNER/ADMIN via nav gate.
- [ ] **Step 7:** Manual verify: create a SALES user, log in as them, confirm restricted nav.
- [ ] **Step 8: Commit** `feat: user & role management`.

---

### Task 12: Reference seed + smoke test + README

**Files:** Modify `prisma/seed.ts` (add sample masters); create `src/app/(app)/page.test.ts` smoke; update `README.md`.

- [ ] **Step 1:** Extend seed with a few locations (Uttara, Mirpur, Mouchak), a supplier, 3 customers (Raju Bhai, Shafique Bhai, Pintu Bhai — deduped), and 3 styles with standard costs — so the app isn't empty. Idempotent (`upsert`).
- [ ] **Step 2:** Add a Vitest that imports each validator and asserts the exported schemas parse a known-good object (guards against regressions).
- [ ] **Step 3:** Run full suite: `pnpm test` → all pass; `pnpm build` → succeeds.
- [ ] **Step 4:** README: how to install (`pnpm i`), migrate (`pnpm prisma migrate dev`), seed (`pnpm db:seed`), run (`pnpm dev`), default login, and the Postgres switch note.
- [ ] **Step 5: Commit** `chore: reference seed, smoke tests, README`.

---

## Self-Review

**Spec coverage (§ of design doc):**
- Users & roles (§3) → Tasks 3,4,11. ✅
- Master data incl. standard cost + aliases (§4.1.1, §5) → Tasks 2,7–10. ✅
- Audit trail (§3, §6.8) → Tasks 2,6 (used in 7–11). ✅
- Architecture/stack (§9) → Tasks 1,2. ✅
- RBAC (§3) → Task 4. ✅
- Portability note (§9) → Global Constraints + Task 2. ✅
- Sales, inventory, expenses, treasury, dashboards, import (§4.1.2–9, §8, §10) → **deferred to Plans 2–6** (out of scope for this foundation plan by design).

**Placeholder scan:** UI JSX is described rather than fully inlined for list/form pages (Tasks 5,7–11) — acceptable as these follow one repeated CRUD pattern established with full code in the validators/actions; the reviewer builds each from the Task 7 template. No TBD/TODO logic left.

**Type consistency:** `can(role, action)` action strings match those referenced in `requireRole`/nav gating; `styleSchema`/`customerSchema`/etc. names consistent across tasks; `writeAudit`/`diff` signatures fixed in Task 6 and reused. ✅

**Next plans:** 2 Inventory · 3 Sales & Receivables · 4 Expenses + Treasury · 5 Dashboards · 6 Excel import.
