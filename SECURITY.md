# Security Policy

Thanks for helping keep **StockLot ERP** and its users safe. This document explains
which versions receive security fixes, how to report a vulnerability privately, what
security controls already ship in the app, and how operators should harden a
deployment.

## Supported versions

Security fixes are provided for the current **1.x** release line. Please make sure
you are running the latest `1.x` release before reporting an issue.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a vulnerability

**Please report vulnerabilities privately. Do not open a public GitHub issue,
pull request, or discussion for a security problem** — that would disclose the
issue before a fix is available.

Use either of these private channels:

- **Email:** [moshiur@publicpulse.com.bd](mailto:moshiur@publicpulse.com.bd)
- **GitHub private security advisories:** open a draft advisory via the repository's
  **Security → Advisories → Report a vulnerability** page.

Please include as much of the following as you can:

- A clear description of the vulnerability and its potential impact.
- The affected area (module, page, server action, or file) and the version/commit
  you tested against.
- Step-by-step reproduction instructions, including any required role or account.
- A proof of concept, request/response captures, or screenshots where relevant.
- Your assessment of severity and any suggested remediation.

### Response expectations

This is a small, community-maintained project, so responses are **best-effort**.
We aim to acknowledge reports as soon as reasonably possible and will keep you
updated on triage and remediation progress. Please give us reasonable time to
investigate and ship a fix before any public disclosure. Coordinated disclosure
is appreciated, and we're happy to credit reporters who want acknowledgement.

## Scope

**In scope** — the application code in this repository, including:

- Authentication and session handling.
- Role-based access control and server-action authorization.
- Input validation and data handling in server actions.
- Import/export (CSV and Excel) handling.
- Audit logging and period-lock integrity.

**Out of scope:**

- Third-party platforms and infrastructure (e.g. Vercel, Neon) — report those to
  the respective vendor.
- Vulnerabilities that require a pre-compromised host, stolen credentials, or a
  privileged operator acting maliciously.
- Weaknesses that exist only because an operator skipped the hardening steps below
  (e.g. leaving the default seeded login in place, or using a weak `AUTH_SECRET`).
- Denial of service through unrealistic traffic volumes, and social-engineering or
  phishing attacks.

## Security posture (already in the app)

The following controls ship in the application today:

- **Role-based access control on every action.** A central capability matrix
  (`can(role, action)` in `src/lib/rbac.ts`) is enforced through guards
  (`requireCan(action)` / `requireUser()` in `src/lib/guards.ts`) that gate every
  page and server action **before** any read or write. Routes are additionally
  gated at the edge by the Next.js proxy (`src/proxy.ts`).
- **Full audit logging.** `writeAudit()` / `diff()` (`src/lib/audit.ts`) record
  `CREATE` / `UPDATE` / `DELETE` operations with field-level before/after values
  into an `AuditLog` table.
- **bcrypt password hashing.** Passwords are hashed with `bcryptjs`; plaintext
  passwords are never stored.
- **JWT sessions.** Authentication uses Auth.js / NextAuth v5 with a credentials
  provider and JWT sessions, with the user's role carried in the token.
- **Zod input validation.** Every server action validates its input against a Zod
  schema (`src/lib/validators/`) before writing to the database.
- **CSV formula-injection guard on exports.** CSV serialization (`src/lib/csv.ts`)
  escapes fields per RFC 4180 and neutralizes spreadsheet formula injection: a text
  value beginning with `=`, `+`, `-`, `@` (or a tab/carriage-return) is prefixed
  with a single quote so Excel/Sheets treats it as text, never a formula.
- **Upload size cap.** File imports are rejected above a fixed size limit (5 MB) to
  limit abuse (`src/app/(app)/import/actions.ts`).
- **CVE-free Excel library.** The `xlsx` dependency was replaced with the patched,
  CVE-free `@e965/xlsx` fork for Excel import/export.

Additionally, monetary values use `Decimal` with a `roundMoney()` helper to avoid
float drift, and month-end **period locks** refuse writes to closed accounting
periods, preserving the integrity of reconciled figures.

## Hardening checklist for operators

When you deploy your own instance, please complete the following:

- [ ] **Rotate `AUTH_SECRET`.** Generate a fresh, high-entropy secret for each
      environment and never reuse the example value.
- [ ] **Use a strong database password.** Set strong credentials on your
      PostgreSQL / Neon database and restrict network access to it.
- [ ] **Change the seeded owner login.** The seed creates
      `owner@stocklot.local` / `changeme123`. Sign in and change this password (and
      ideally the email) immediately after the first sign-in.
- [ ] **Keep secrets out of the public repo.** Never commit `.env` or any real
      credentials. Use `.env.example` as the template and manage real values through
      your host's environment variable / secrets management.

---

Questions that are not security-sensitive are welcome as normal GitHub issues or
discussions. For anything that could put users at risk, please use the private
channels above. Thank you for contributing to a safer StockLot ERP.
