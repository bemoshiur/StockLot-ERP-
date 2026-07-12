import Link from 'next/link'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/guards'
import { ROLE_LABELS } from '@/lib/enums'

export default async function DashboardPage() {
  const user = await requireUser()
  const [styles, customers, suppliers, locations] = await Promise.all([
    db.productStyle.count({ where: { active: true } }),
    db.customer.count({ where: { active: true } }),
    db.supplier.count({ where: { active: true } }),
    db.location.count(),
  ])

  const cards = [
    { label: 'Active styles', value: styles, href: '/styles' },
    { label: 'Customers', value: customers, href: '/customers' },
    { label: 'Suppliers', value: suppliers, href: '/suppliers' },
    { label: 'Locations', value: locations, href: '/locations' },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Welcome, {user.name}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Signed in as {ROLE_LABELS[user.role]}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{c.value}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white/50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
        Sales, inventory, dues, expenses, and profit dashboards arrive in the next build phases.
        For now, set up your master data using the menu.
      </div>
    </div>
  )
}
