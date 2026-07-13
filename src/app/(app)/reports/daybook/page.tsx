import Link from 'next/link'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { challanTotals } from '@/lib/sales'
import { activeChallanFilter } from '@/lib/queries'
import { taka, shortDate } from '@/lib/format'
import { PageHeader, Card, EmptyState } from '@/components/ui'
import { ReportTabs } from '@/components/report-tabs'

export default async function DaybookPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireCan('reports.read')
  const sp = await searchParams

  const saleMonths = await db.salesChallan.findMany({ distinct: ['periodMonth'], select: { periodMonth: true } })
  const months = [...new Set(saleMonths.map((m) => m.periodMonth))].sort().reverse()
  const month = sp.month && months.includes(sp.month) ? sp.month : months[0]

  const fmtMonth = (m: string) => new Date(m + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  if (!month) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Reports" />
        <ReportTabs />
        <EmptyState message="No sales recorded yet. The day book appears once you start entering challans." />
      </div>
    )
  }

  const challans = await db.salesChallan.findMany({
    where: { periodMonth: month, ...activeChallanFilter },
    include: { lines: true, payments: true },
  })

  // Group by sale day (YYYY-MM-DD).
  type Row = { key: string; date: Date; challans: number; qty: number; invoiced: number; collected: number; grossProfit: number }
  const byDay = new Map<string, Row>()
  for (const c of challans) {
    const key = c.saleDate.toISOString().slice(0, 10)
    let row = byDay.get(key)
    if (!row) {
      row = { key, date: c.saleDate, challans: 0, qty: 0, invoiced: 0, collected: 0, grossProfit: 0 }
      byDay.set(key, row)
    }
    const t = challanTotals(
      c.lines.map((l) => ({ quantity: l.quantity, unitPrice: Number(l.unitPrice), unitCost: Number(l.unitCostSnapshot) })),
      c.payments.map((p) => ({ amountCollected: Number(p.amountCollected), discountOrWaiver: Number(p.discountOrWaiver) })),
    )
    row.challans += 1
    row.qty += c.lines.reduce((a, l) => a + l.quantity, 0)
    row.invoiced += t.invoiceTotal
    row.collected += t.collectedTotal
    row.grossProfit += t.grossProfit
  }

  const rows = [...byDay.values()].sort((a, b) => a.key.localeCompare(b.key))
  const totals = rows.reduce(
    (acc, r) => ({
      challans: acc.challans + r.challans,
      qty: acc.qty + r.qty,
      invoiced: acc.invoiced + r.invoiced,
      collected: acc.collected + r.collected,
      grossProfit: acc.grossProfit + r.grossProfit,
    }),
    { challans: 0, qty: 0, invoiced: 0, collected: 0, grossProfit: 0 },
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Reports" />
      <ReportTabs />

      {/* Month selector */}
      <div className="flex flex-wrap gap-2">
        {months.map((m) => (
          <Link
            key={m}
            href={`/reports/daybook?month=${m}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              m === month
                ? 'bg-primary text-white'
                : 'border border-zinc-300 text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {fmtMonth(m)}
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-700">Day book — {fmtMonth(month)}</h2>
        {rows.length === 0 ? (
          <EmptyState message="No active challans for this month." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-400">
                    <th className="px-4 py-2.5 text-left font-medium">Date</th>
                    <th className="px-4 py-2.5 text-right font-medium">Challans</th>
                    <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                    <th className="px-4 py-2.5 text-right font-medium">Invoiced</th>
                    <th className="px-4 py-2.5 text-right font-medium">Collected</th>
                    <th className="px-4 py-2.5 text-right font-medium">Gross profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((r) => (
                    <tr key={r.key}>
                      <td className="px-4 py-2.5 text-zinc-700">{shortDate(r.date)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700">{r.challans.toLocaleString('en-US')}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700">{r.qty.toLocaleString('en-US')}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-900">{taka(r.invoiced)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-900">{taka(r.collected)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-900">{taka(r.grossProfit)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-200 font-semibold text-zinc-900">
                    <td className="px-4 py-2.5">Total</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{totals.challans.toLocaleString('en-US')}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{totals.qty.toLocaleString('en-US')}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{taka(totals.invoiced)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{taka(totals.collected)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{taka(totals.grossProfit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
