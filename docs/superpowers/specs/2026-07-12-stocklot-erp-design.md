# StockLot ERP — Design Document

**Date:** 2026-07-12
**Status:** Draft for owner review
**Author:** Claude (from deep analysis of `Copy of Jun'26.xlsx`)
**Replaces:** The monthly Excel workbook currently used to run the business.

---

## 1. Purpose & goals

The business runs a **StockLot (surplus / overrun apparel) wholesale operation** in Bangladesh (currency: BDT) entirely inside one shared Excel file that is copied forward each month. This project replaces that workbook with a **multi-user, collaborative web application** the team uses from phones (in the market/warehouse) and desktops (office).

**Primary goals**

1. **One source of truth.** Enter each sale, receipt, expense, and payment exactly once — no more triplicate `Home` / `Daily Sales` / `Sales` re-keying that silently diverges.
2. **Real dues.** Track exactly who owes what, record partial payments, and keep **discounts/waivers separate from genuine receivables**.
3. **Live, correct inventory.** Received − Sold per style, updated automatically, with **negative-stock alerts** (no more −5,000 TankTop).
4. **Real, automatic profit & monthly summary.** Gross/net profit, expenses, capital, and the partner-balance waterfall computed automatically — no fragile linked formulas.
5. **Safe collaboration.** Several staff work at once without corrupting a shared file; every change is attributed and logged (audit trail); role-based access.

**Success criteria**

- The team stops using Excel for daily operations.
- June'26 data is imported and reproduces the same headline figures (or explains every difference).
- A sale entered on a phone immediately updates stock, the customer's due, and the dashboard for everyone.
- The owner can open one screen and see the month's P&L, dues, inventory, and partner balances — accurate and current.

---

## 2. Decisions locked with the owner

| Decision | Choice |
|---|---|
| Team & access | Small team (~3–8), cloud web app, phones + office desktop |
| Interface language | **English** (data may still be typed as-is) |
| Top priorities | Dues, live stock, auto profit/summary, multi-user + audit — **all four** |
| Deliverable order | **Full written spec + implementation plan first, then build** |
| Product cost basis | **Per-style standard cost** — one cost per style in the master; `profit = price − standard cost` |
| MVP scope | 7 core modules **+ Treasury & Partner-Capital** in v1 |

---

## 3. Users & roles

Role-based access control (RBAC). A user has exactly one role; permissions are additive by role.

| Role | Can do | Cannot do |
|---|---|---|
| **Owner / Proprietor** | Everything: all modules, dashboards, partner capital, period close, user management | — |
| **Partner / Investor** (SaimBabor, ShahAlam Bhai, Mr. Sharif) | View dashboards & their own capital ledger; record capital movements & deposits-to-Alib | Edit sales/stock/expenses; manage users |
| **Sales Operator** | Create sales challans, record payments, look up customer dues, view own sales | See partner capital, profit dashboards, expenses, or edit stock master |
| **Inventory Clerk** | Record goods-inward, maintain style master, view net stock | See financials, partner capital, or edit sales |
| **Accountant / Cashier** | Enter expenses, payroll/advances, receivables; run month-end consolidation | Manage users; edit partner capital allocations (view only) |
| **System Admin** | Manage users, roles, masters, period locking | (Operational role; may be same person as Owner) |

Every transactional record stores `created_by`, `created_at`, `updated_by`, `updated_at`. A separate **audit log** records field-level changes.

---

## 4. Scope

### 4.1 In scope — MVP (v1)

1. **Master data** — Style/SKU master (with **standard cost**), Customer master, Supplier master, Location master, and a **style-alias table** mapping legacy free-text spellings → canonical style.
2. **Sales & dispatch** — one challan → many style lines; real unit price; auto invoice/collected/discount/due totals.
3. **Payments & receivables** — partial payments; **discount separate from due**; per-customer due ledger with aging.
4. **Inventory** — goods-inward receiving; opening-stock carry-forward; live net stock per style; **negative-stock alerts**; opaque bulk lots ("Pre Stock", "Mixed Item") supported as manually-drawn-down items.
5. **Expenses** — categorized (controlled list); **advances flagged separately**; billed-vs-paid amounts.
6. **Treasury & partner-capital** — capital-investment ledger; **Deposit-to-Alib** ledger; partner-balance waterfall; cash-collected-vs-deposited reconciliation with a variance check.
7. **Reporting & dashboards** — monthly P&L; daily sales; expense-by-category; inventory position; receivables aging; treasury/partner balances; invoiced-vs-collected.
8. **Users, roles & audit trail** — RBAC, concurrent access, who-changed-what logging.
9. **Excel import (June'26)** — a one-time importer that seeds masters + opening balances + optionally the month's transactions from the current workbook.

### 4.2 Phase 2 (after MVP is in daily use)

- **Payroll** — employee master; salary / advance / bonus / honorarium; monthly payroll run; advance-recovery against salary.
- **Period management & close** — period open/lock; opening = prior-period closing carry-forward (partner balances, stock, receivables); closing snapshots.
- **Contact management & alerts** — customer/supplier phone directory; due reminders; low-stock alerts.

### 4.3 Later

- **Purchase costing & valuation** — capture actual cost per receipt lot; BDT inventory valuation; supplier reconciliation. (Upgrade path from per-style standard cost.)
- **Advanced analytics** — period-over-period trends; top buyers/styles; dead-stock & reorder intelligence; margin analysis.
- **Formal accounting / GL** — double-entry, chart of accounts, statutory statements (VAT/tax) if ever required.

### 4.4 Explicitly out of scope (v1)

- Multi-currency (everything is BDT).
- Mobile-money channel-level reconciliation beyond a `method` field (cash / bank / bKash / Nagad captured as a tag).
- Barcode/scanning hardware.
- Public customer-facing portal.

---

## 5. Data model

Normalized relational model (fixes the denormalized, side-by-side Excel blocks). Money stored as `Decimal(14,2)` (BDT); quantities as `Int`. Every table has `id`, `created_by`, `created_at`, `updated_by`, `updated_at` unless noted.

### Master data

**product_style** — the canonical item.
- `style_code` (unique human key), `style_name`, `gender_age_group` (Mens/Ladies/Boys/Girls/Kids/Unisex), `category` (T-Shirt/Hoodie/Keeper/Boxer/Plazo/…), `season_flag` (Winter/Summer/All), `grade` (A/B-Grade/C-Grade/Mixed), `is_bulk_lot` (bool — true for "Pre Stock"/"Mixed Item All Style"), **`standard_cost`** (Decimal, BDT/piece — drives profit), `active`.
- Has many `sale_line`, `receipt_line`, `style_alias`, one `inventory_position` per period.

**style_alias** — legacy spelling → canonical style (so imported/typed "Shipe Shirt", "Ladies T-Shirt Solid" resolve correctly).
- `alias_text` (unique), `style_id` (FK).

**customer** — `name` (normalized/deduped), `phone`, `default_location_id` (FK), `credit_terms`, `opening_due_balance`. Has many `sales_challan`, `receivable_entry`.

**supplier** — `name`, `contact_phone`, `address`, `notes`. Has many `purchase_receipt`.

**location** — `area_name` (Uttara/Mirpur/Mouchak/Malibagh/DEPZ Sonia Market/Salna), `market_or_shop`.

### Inventory

**purchase_receipt** — `challan_no` (supplier note, e.g. 25589), `receipt_date` (real DATE), `supplier_id` (FK), `period_id` (FK), `is_opening_stock` (bool), `remarks`. Derived `total_quantity`. Has many `receipt_line`.

**receipt_line** — `receipt_id` (FK), `style_id` (FK), `quantity`, `sub_category_note` (e.g. "Long Sleve"). (Actual `unit_cost` deferred to "later" costing phase.)

**inventory_position** (per style, per period, derived + cached) — `opening_qty`, `received_qty`, `sold_qty`, `closing_qty`, `negative_flag`. Recomputed on each receipt/sale; `negative_flag` raises an alert.

### Sales & receivables

**sales_challan** — `challan_no` (outgoing 198–416; nullable/"N/A" allowed), `sale_date` (DATE), `customer_id` (FK), `location_id` (FK), `period_id` (FK), `status` (draft/dispatched/partially_paid/paid), `remarks`. Derived: `invoice_total`, `collected_total`, `discount_total`, `due_total`. Has many `sale_line`, `payment_receipt`.

**sale_line** — `challan_id` (FK), `style_id` (FK), `quantity`, `unit_price` (real rate), `unit_cost_snapshot` (= style.standard_cost at time of sale), derived `line_amount` (= qty × unit_price), derived `line_gross_profit` (= line_amount − qty × unit_cost_snapshot).

**payment_receipt** — `challan_id` (FK), `receipt_date` (DATE), `amount_collected`, **`discount_or_waiver`** (separate from due), `method` (cash/bank/bKash/Nagad/account), `collected_by`, `notes`. Posts to `receivable_entry`.

**receivable_entry** (append-only ledger) — `customer_id` (FK), `challan_id` (FK, nullable for opening), `entry_type` (invoice/payment/waiver/opening), `amount` (signed), `entry_date`, derived running `balance_after`.

### Expenses & payroll

**expense_category** — `name` (controlled: Daily/Petty · Suppliers & Others · Office Rent & Commission · Salary & Honorarium · Bonus & Others), `parent_category`.

**expense** — `expense_date` (DATE), `category_id` (FK), `payee_or_vendor`, `detail`, `amount` (billed), `paid_amount` (actually paid), **`is_advance`** (keep advances out of period expense), `authorized_by`, `period_id` (FK), `remarks`.

**employee** *(phase 2)* — `name`, `role`, `monthly_salary`. **salary_record** *(phase 2)* — `employee_id`, `period_id`, `type` (salary/advance/bonus/honorarium), `amount`, `pay_date`.

### Treasury & partner-capital

**partner** — `name` (SaimBabor/ShahAlam Bhai/Mr. Sharif), `opening_capital_balance`.

**capital_movement** — `partner_id` (FK), `period_id` (FK), `movement_type` (investment/withdrawal/settlement), `amount`, `date`, `notes`.

**treasury_deposit** ("Deposit To Alib") — `period_id` (FK), `deposit_date` (DATE), `payer_partner_id` (FK), `amount`, `method` (cash/bank/account), `destination` (default "Alib"), `other_income` (nullable), `remarks`.

### System

**period** — `month` (e.g. 2026-06), `status` (open/closed), `opening_stock_qty`, `closing_stock_qty`, `closing_balances_json` (snapshot of partner/creative/office balances at close).

**app_user** — `name`, `email`, `password_hash`, `role`, `active`.

**audit_log** — `user_id`, `entity`, `entity_id`, `field`, `old_value`, `new_value`, `at`.

> **Note on cost model:** MVP uses **per-style standard cost** (`product_style.standard_cost`), snapshotted onto each `sale_line` at sale time so historical margins don't shift when the standard cost is later edited. The `receipt_line.unit_cost` / valuation path is deferred to the "later" costing phase — the schema leaves room for it without rework.

---

## 6. Key business rules

1. **Sale entered once.** Creating a sales challan is the single act that (a) records revenue, (b) decrements inventory for each style, (c) posts an `invoice` receivable entry, and (d) feeds the dashboard. No parallel registers.
2. **Discount ≠ due.** At payment, `amount_collected` and `discount_or_waiver` are captured separately. `due = invoice_total − collected_total − discount_total`. A rounding waiver never inflates the receivables figure.
3. **Profit is real.** `gross_profit = Σ(line_amount − qty × standard_cost)`. No blanket ৳40/piece.
4. **Stock can't go silently wrong.** Sales pick a style from the master (typeahead + alias resolution). If a sale would drive a style's `closing_qty` negative, the system raises a **negative-stock alert**. **v1 default: warn-and-allow** (the sale saves, the style is flagged red on the inventory dashboard and in an exceptions list) — chosen because bulk/mixed lots are legitimately dispatched ahead of itemized receipts; a per-style "hard block" toggle is available in settings.
5. **Bulk / opening lots** ("Pre Stock Mixed Item", "Mixed Item All Style") are real styles with `is_bulk_lot = true`; they are drawn down manually and reported separately so they never distort per-style accuracy.
6. **Dates are real dates.** No text "06.06.26"; all dates are proper DATE values, sortable/filterable, tied to a `period`.
7. **Treasury reconciliation.** The dashboard shows **total cash collected vs total deposited to Alib** with an explicit variance and an alert when they differ (surfacing the current ~৳341 gap).
8. **Everything is attributed.** Who created/changed each record is stored; sensitive fields are in the audit log.

---

## 7. Core workflows

| Workflow | Who | Steps |
|---|---|---|
| Goods inward | Inventory Clerk | New receipt → pick supplier + challan no + date → add style lines (qty) → save → stock updates |
| Opening carry-forward | Accountant | At period start, prior closing stock/balances seed the new period |
| Sales dispatch | Sales Operator | New challan → pick customer + location → add style lines (qty, price) → save → stock ↓, invoice posted |
| Payment collection | Sales Operator | Open challan → record amount + discount + method → due recalculated |
| Receivables follow-up | Sales/Accountant | Open customer → see aged dues → record collection |
| Expense entry | Accountant | New expense → category, payee, amount, paid, advance? → save |
| Capital injection | Owner/Partner | Record capital_movement (investment) |
| Deposit to Alib | Partner/Owner | Record treasury_deposit (payer, amount, method) |
| Monthly reconciliation | Owner/Accountant | Review P&L, dues, inventory, treasury; investigate variance; (phase 2) close period |

---

## 8. Reports & dashboards

- **Monthly P&L** — Gross Profit, Total Expense, Net Profit (± other income). Reproduces the *Monthly Summery* KPI panel.
- **Daily sales performance** — quantity, cash sales, gross profit per day, biggest-day highlight.
- **Expenditure by category** — auto-rolled with drill-down to lines.
- **Cash reconciliation** — collected vs deposited-to-Alib with variance alert.
- **Partner capital & balances** — capital, per-partner cash, Creative Balance, After-Bank-Transfer Balance, Final Balance — each step traceable to source.
- **Accounts receivable / dues** — clean per-customer due (credit separated from waivers), aged by challan date.
- **Net stock / inventory** — closing on-hand per style, negative-stock exceptions, zero-stock (sold-out vs never-stocked) distinction, largest holdings, dead-stock candidates.
- **Invoiced vs collected** — gross invoiced amount (which Excel never totals) vs cash collected vs discount vs due.
- Sales by customer / style / location.

---

## 9. Architecture & technology

**Shape:** a single mobile-friendly full-stack web app.

- **Frontend + backend:** Next.js (React, App Router, **TypeScript**) — one deployable codebase; server actions / API routes for data.
- **Database:** PostgreSQL, accessed via **Prisma ORM** (typed schema = the model in §5). Runs in Docker for local trial and in the cloud for production.
- **Auth & RBAC:** email + password (hashed), session-based; middleware enforces role permissions per route/action.
- **UI:** Tailwind CSS + shadcn/ui components; responsive tables & forms tuned for phone entry; typeahead pickers for style/customer.
- **Charts:** Recharts for dashboards.
- **Audit:** Prisma middleware writes `audit_log` on create/update of tracked entities.
- **Money/precision:** Decimal columns; server-side rounding to 2 dp — no fractional-BDT artifacts.
- **Excel import:** a Node script using `xlsx`/`exceljs` to parse `Copy of Jun'26.xlsx`, resolve styles/customers via alias mapping, and seed masters + opening balances (+ optional transactions).

**Why this stack:** standard, well-documented, cheap to host for a small team, one language (TypeScript) end-to-end, and an easy local-first trial (`docker compose up`) before committing to a host.

**Deployment options (decide at build time):** (a) Vercel + managed Postgres (Neon/Supabase) — least ops; or (b) a single cheap VPS with Docker Compose (app + Postgres) — lowest cost, full control. Local trial uses Docker Compose regardless.

**Non-functional targets:** concurrent multi-user; optimistic UI with server validation; works on low-end Android browsers over mobile data; daily automated DB backup; English UI; BDT throughout.

---

## 10. Excel → ERP migration

A one-time, re-runnable importer:

1. **Build masters** from the workbook: distinct styles (from *Stock Received* + *Net Stock* + *Sales/Home*), customers (from *Home* "Address" column), suppliers (challan issuers), locations (from "Remarks").
2. **Alias map** legacy spellings → canonical styles/customers (owner reviews/approves the mapping).
3. **Seed opening stock** (incl. the 52,512-pc "Pre Stock Mixed Item" as an `is_bulk_lot` style) and **partner opening balances** (SaimBabor 21,347; ShahAlam 12,810; etc.).
4. **Optionally load June transactions** (sales challans, receipts, expenses, deposits) for continuity and validation.
5. **Reconcile:** the importer prints the resulting totals next to the workbook's (sales, qty, dues, profit, net stock) and flags every difference for owner sign-off.

---

## 11. Assumptions & open questions

**Working assumptions (correct me if wrong):**
- "Alib" is the head-office/owner account cash is swept to (treated as a treasury destination, not an external supplier payable). *(To confirm.)*
- Buyers are mostly cash-on-dispatch with occasional small dues; credit terms are informal.
- Stock is a single pooled quantity (not per-warehouse) in v1, even though sales note a delivery area.
- Advances (staff, prepaid wifi) are **not** period expenses when paid; they're tracked separately and recognized later.
- Partner profit-split rules are not automated in v1 (balances are tracked; allocation is manual) — *pending the ownership/split definition.*

**Open questions for the owner (can be answered during build):**
1. Confirm what "Alib" is and whether Deposit-to-Alib is a settlement, transfer, or distribution.
2. Do you have real per-style **standard costs** to seed, or should we derive starting values from the workbook?
3. Exact **expense categories** you want enforced, and advance-recovery handling.
4. The precise definitions of **Creative Balance / Final Balance / Office Net Balance** (some appear to be internal cross-checks).
5. Should opening balances carry automatically from prior-month close (needs accurate seed figures for month one)?
6. Any VAT/tax or audit obligation the system must support, or is this purely internal management accounting?

---

## 12. Risks

- **Data-quality debt on import** — free-text styles/customers require an owner-reviewed alias mapping; garbage-in if skipped.
- **Adoption** — staff used to Excel; mitigated by a fast, phone-friendly entry UI and a short parallel-run period.
- **Opaque bulk lots** — 81% of stock sits in "Pre Stock Mixed Item"; per-style accuracy is only as good as how that lot is itemized over time.
- **Hosting/connectivity** — mobile-data reliability in the field; mitigated by lightweight pages and optimistic UI.

---

## 13. Out-of-the-box deliverable at MVP

A running web app where the team logs in by role and: receives stock, creates sales challans (stock/dues/profit update instantly), records payments (discount vs due separated), enters expenses, records capital & Alib deposits, and where the owner sees an accurate live monthly P&L, dues, inventory, and partner-balance dashboard — with June'26 imported and reconciled.
