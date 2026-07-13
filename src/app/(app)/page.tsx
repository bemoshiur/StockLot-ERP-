import Link from 'next/link'
import { ShoppingCart, Boxes, Users, Wallet, ArrowRight } from 'lucide-react'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/guards'
import { can } from '@/lib/rbac'
import { computeNetStockAgg, activeChallanFilter } from '@/lib/queries'
import { challanTotals } from '@/lib/sales'
import { taka, shortDate, STATUS_STYLES, STATUS_LABELS } from '@/lib/format'
import { ROLE_LABELS } from '@/lib/enums'
import { NAV_ITEMS } from '@/lib/nav'
import { AreaChart } from '@/components/area-chart'
import { Card } from '@/components/ui'

export default async function DashboardPage() {
  const user = await requireUser()
  const canFinance = can(user.role, 'reports.read')

  const [salesCount, customers, netStockAgg, monthsRaw, recent] = await Promise.all([
    db.salesChallan.count({ where: activeChallanFilter }),
    db.customer.count({ where: { active: true } }),
    computeNetStockAgg(),
    db.salesChallan.findMany({ where: activeChallanFilter, distinct: ['periodMonth'], select: { periodMonth: true } }),
    db.salesChallan.findMany({
      where: activeChallanFilter,
      orderBy: [{ saleDate: 'desc' }, { createdAt: 'desc' }],
      take: 6,
      include: { customer: true, lines: true, payments: true },
    }),
  ])
  const netStock = [...netStockAgg.values()].reduce((a, v) => a + v.closing, 0)
  const latestMonth = monthsRaw.map((m) => m.periodMonth).sort().reverse()[0]

  const monthChallans = latestMonth
    ? await db.salesChallan.findMany({ where: { periodMonth: latestMonth, ...activeChallanFilter }, include: { lines: true, payments: true } })
    : []

  // Daily sales quantity for the latest month → chart series.
  const byDay = new Map<string, number>()
  let monthRevenue = 0
  let monthProfit = 0
  for (const c of monthChallans) {
    const day = c.saleDate.toISOString().slice(0, 10)
    const qty = c.lines.reduce((a, l) => a + l.quantity, 0)
    byDay.set(day, (byDay.get(day) ?? 0) + qty)
    const t = challanTotals(
      c.lines.map((l) => ({ quantity: l.quantity, unitPrice: Number(l.unitPrice), unitCost: Number(l.unitCostSnapshot) })),
      c.payments.map((p) => ({ amountCollected: Number(p.amountCollected), discountOrWaiver: Number(p.discountOrWaiver) })),
    )
    monthRevenue += t.invoiceTotal
    monthProfit += t.grossProfit
  }
  const chartData = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, qty]) => ({ label: shortDate(new Date(day)), value: qty }))

  const kpis = [
    { label: 'Sales challans', value: salesCount.toLocaleString('en-US'), icon: ShoppingCart, grad: 'from-[#006FEE] to-[#0059c9]' },
    { label: 'Net stock (pcs)', value: netStock.toLocaleString('en-US'), icon: Boxes, grad: 'from-[#12a150] to-[#0b7a3c]' },
    { label: 'Customers', value: customers.toLocaleString('en-US'), icon: Users, grad: 'from-[#7828c8] to-[#5b1e9b]' },
    canFinance
      ? { label: 'Revenue (latest mo.)', value: taka(monthRevenue), icon: Wallet, grad: 'from-[#f5a524] to-[#d98a0b]' }
      : { label: 'Styles', value: netStockAgg.size.toLocaleString('en-US'), icon: Wallet, grad: 'from-[#f5a524] to-[#d98a0b]' },
  ]

  const quickLinks = NAV_ITEMS.filter((i) => i.href !== '/' && (!i.action || can(user.role, i.action))).slice(0, 8)

  const monthLabel = latestMonth ? new Date(latestMonth + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ''

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-zinc-500">Signed in as {ROLE_LABELS[user.role]}</p>
      </div>

      {/* Gradient KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${k.grad} p-5 text-white shadow-sm`}>
            <k.icon className="absolute -right-3 -top-3 h-20 w-20 opacity-15" />
            <div className="text-2xl font-bold tabular-nums">{k.value}</div>
            <div className="mt-1 text-sm text-white/80">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-0">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Sales volume</h2>
              <p className="text-xs text-zinc-400">Pieces dispatched per day · {monthLabel}</p>
            </div>
            {canFinance && (
              <div className="text-right">
                <div className="text-sm font-semibold text-success">{taka(monthProfit)}</div>
                <div className="text-xs text-zinc-400">gross profit</div>
              </div>
            )}
          </div>
          <div className="px-2 pb-3 pt-2">
            <AreaChart data={chartData} />
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <div className="p-5 pb-2">
            <h2 className="text-sm font-semibold text-zinc-900">Recent sales</h2>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-zinc-400">No sales yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {recent.map((c) => {
                const t = challanTotals(
                  c.lines.map((l) => ({ quantity: l.quantity, unitPrice: Number(l.unitPrice), unitCost: Number(l.unitCostSnapshot) })),
                  c.payments.map((p) => ({ amountCollected: Number(p.amountCollected), discountOrWaiver: Number(p.discountOrWaiver) })),
                )
                return (
                  <li key={c.id}>
                    <Link href={`/sales/${c.id}`} className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm transition hover:bg-zinc-50">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-zinc-900">{c.customer.name}</div>
                        <div className="text-xs text-zinc-400">{shortDate(c.saleDate)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-zinc-700">{taka(t.invoiceTotal)}</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[c.status]}`}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Jump to</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <link.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="flex-1 font-medium text-zinc-900">{link.label}</span>
              <ArrowRight className="h-4 w-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
