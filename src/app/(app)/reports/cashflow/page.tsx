import Link from 'next/link'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { taka } from '@/lib/format'
import { PageHeader, Card, EmptyState } from '@/components/ui'
import { ReportTabs } from '@/components/report-tabs'

export default async function CashflowPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireCan('reports.read')
  const sp = await searchParams

  // Available months across sales, expenses, and treasury (union of distinct period keys).
  const [saleMonths, expMonths, depMonths] = await Promise.all([
    db.salesChallan.findMany({ distinct: ['periodMonth'], select: { periodMonth: true } }),
    db.expense.findMany({ distinct: ['periodMonth'], select: { periodMonth: true } }),
    db.treasuryDeposit.findMany({ distinct: ['periodMonth'], select: { periodMonth: true } }),
  ])
  const months = [...new Set([...saleMonths, ...expMonths, ...depMonths].map((m) => m.periodMonth))]
    .sort()
    .reverse()
  const month = sp.month && months.includes(sp.month) ? sp.month : months[0]

  if (!month) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Reports" />
        <ReportTabs />
        <EmptyState message="No transactions recorded yet. Cash flow appears once you start entering payments, expenses, and deposits." />
      </div>
    )
  }

  // Date range for models keyed by a real date (paymentReceipt.receiptDate) — UTC month window.
  const [y, m] = month.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 1))

  const [collected, capital, treasury, expensesPaid, supplierPaid] = await Promise.all([
    db.paymentReceipt.aggregate({ _sum: { amountCollected: true }, where: { receiptDate: { gte: start, lt: end } } }),
    db.capitalMovement.aggregate({ _sum: { amount: true }, where: { periodMonth: month, amount: { gt: 0 } } }),
    db.treasuryDeposit.aggregate({ _sum: { otherIncome: true, amount: true }, where: { periodMonth: month } }),
    db.expense.aggregate({ _sum: { paidAmount: true }, where: { periodMonth: month } }),
    db.supplierPayment.aggregate({ _sum: { amount: true }, where: { periodMonth: month } }),
  ])

  // Cash in.
  const paymentsCollected = Number(collected._sum.amountCollected ?? 0)
  const capitalInvested = Number(capital._sum.amount ?? 0)
  const otherIncome = Number(treasury._sum.otherIncome ?? 0)
  const cashIn = paymentsCollected + capitalInvested + otherIncome

  // Cash out.
  const operatingExpenses = Number(expensesPaid._sum.paidAmount ?? 0)
  const supplierPayments = Number(supplierPaid._sum.amount ?? 0)
  const depositsToAlib = Number(treasury._sum.amount ?? 0)
  const cashOut = operatingExpenses + supplierPayments + depositsToAlib

  const net = cashIn - cashOut

  const fmtMonth = (mo: string) => new Date(mo + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const inRows: [string, number][] = [
    ['Payments collected', paymentsCollected],
    ['Capital investments', capitalInvested],
    ['Other income', otherIncome],
  ]
  const outRows: [string, number][] = [
    ['Operating expenses paid', operatingExpenses],
    ['Supplier payments', supplierPayments],
    ['Deposits to Alib', depositsToAlib],
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Reports" />
      <ReportTabs />

      {/* Month selector */}
      <div className="flex flex-wrap gap-2">
        {months.map((mo) => (
          <Link
            key={mo}
            href={`/reports/cashflow?month=${mo}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              mo === month
                ? 'bg-primary text-white'
                : 'border border-zinc-300 text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {fmtMonth(mo)}
          </Link>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-zinc-700">Cash flow — {fmtMonth(month)}</h2>

      {/* Cash in / Cash out */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FlowCard title="Cash in" rows={inRows} total={cashIn} tone="green" />
        <FlowCard title="Cash out" rows={outRows} total={cashOut} tone="red" />
      </div>

      {/* Net movement */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-sm text-zinc-500">Net cash movement (in − out)</div>
        <div
          className={`mt-1 text-2xl font-bold tabular-nums ${
            net >= 0 ? 'text-green-700' : 'text-red-600'
          }`}
        >
          {taka(net)}
        </div>
      </div>
    </div>
  )
}

function FlowCard({
  title,
  rows,
  total,
  tone,
}: {
  title: string
  rows: [string, number][]
  total: number
  tone: 'green' | 'red'
}) {
  const totalColor = tone === 'green' ? 'text-green-700' : 'text-red-600'
  return (
    <Card className="p-5">
      <div className="text-sm font-semibold text-zinc-700">{title}</div>
      <table className="mt-3 w-full text-sm">
        <tbody className="divide-y divide-zinc-100">
          {rows.map(([label, amount]) => (
            <tr key={label}>
              <td className="py-2.5 text-zinc-600">{label}</td>
              <td className="py-2.5 text-right tabular-nums text-zinc-900">{taka(amount)}</td>
            </tr>
          ))}
          <tr className="border-t border-zinc-200 font-semibold">
            <td className="py-2.5 text-zinc-900">Total</td>
            <td className={`py-2.5 text-right tabular-nums ${totalColor}`}>{taka(total)}</td>
          </tr>
        </tbody>
      </table>
    </Card>
  )
}
