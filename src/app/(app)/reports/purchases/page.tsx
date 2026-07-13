import Link from 'next/link'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { taka, shortDate } from '@/lib/format'
import { PageHeader, Card, EmptyState } from '@/components/ui'
import { ReportTabs } from '@/components/report-tabs'

export default async function PurchasesReportPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireCan('inventory.read')
  const sp = await searchParams

  // Purchases use receipt periodMonth, which may differ from the sales months.
  const receiptMonths = await db.purchaseReceipt.findMany({ distinct: ['periodMonth'], select: { periodMonth: true } })
  const months = [...new Set(receiptMonths.map((m) => m.periodMonth))].sort().reverse()
  const month = sp.month && months.includes(sp.month) ? sp.month : months[0]

  const fmtMonth = (m: string) => new Date(m + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  if (!month) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Reports" />
        <ReportTabs />
        <EmptyState message="No purchase receipts recorded yet. This report appears once you start receiving stock." />
      </div>
    )
  }

  const receipts = await db.purchaseReceipt.findMany({
    where: { periodMonth: month },
    include: { supplier: true, lines: { select: { quantity: true } } },
    orderBy: { receiptDate: 'desc' },
  })

  const receiptRows = receipts.map((r) => {
    const quantity = r.lines.reduce((a, l) => a + l.quantity, 0)
    return {
      id: r.id,
      date: r.receiptDate,
      challanNo: r.challanNo,
      supplierName: r.supplier?.name ?? '—',
      lines: r.lines.length,
      quantity,
      billAmount: Number(r.billAmount),
    }
  })

  const totalReceipts = receiptRows.length
  const totalQuantity = receiptRows.reduce((a, r) => a + r.quantity, 0)
  const totalBill = receiptRows.reduce((a, r) => a + r.billAmount, 0)

  // By supplier summary.
  const bySupplier = new Map<string, { quantity: number; billAmount: number }>()
  for (const r of receiptRows) {
    const s = bySupplier.get(r.supplierName) ?? { quantity: 0, billAmount: 0 }
    s.quantity += r.quantity
    s.billAmount += r.billAmount
    bySupplier.set(r.supplierName, s)
  }
  const supplierRows = [...bySupplier.entries()].sort((a, b) => b[1].billAmount - a[1].billAmount)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Reports" />
      <ReportTabs />

      {/* Month selector */}
      <div className="flex flex-wrap gap-2">
        {months.map((m) => (
          <Link
            key={m}
            href={`/reports/purchases?month=${m}`}
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

      {/* KPI tiles */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-700">Purchases — {fmtMonth(month)}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Receipts" value={totalReceipts.toLocaleString('en-US')} />
          <Stat label="Quantity received" value={totalQuantity.toLocaleString('en-US') + ' pcs'} />
          <Stat label="Bill amount" value={taka(totalBill)} />
        </div>
      </div>

      {/* Receipts table */}
      {receiptRows.length === 0 ? (
        <EmptyState message="No purchase receipts for this month." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-2.5 text-left font-medium">Date</th>
                  <th className="px-4 py-2.5 text-left font-medium">Challan</th>
                  <th className="px-4 py-2.5 text-left font-medium">Supplier</th>
                  <th className="px-4 py-2.5 text-right font-medium">Lines</th>
                  <th className="px-4 py-2.5 text-right font-medium">Quantity</th>
                  <th className="px-4 py-2.5 text-right font-medium">Bill amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {receiptRows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 text-zinc-700">{shortDate(r.date)}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{r.challanNo ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-700">{r.supplierName}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700">{r.lines.toLocaleString('en-US')}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700">{r.quantity.toLocaleString('en-US')}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-900">{taka(r.billAmount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-200 font-semibold text-zinc-900">
                  <td className="px-4 py-2.5" colSpan={3}>Total</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{totalReceipts.toLocaleString('en-US')}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{totalQuantity.toLocaleString('en-US')}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{taka(totalBill)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* By supplier */}
      {supplierRows.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">By supplier</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-400">
                    <th className="px-4 py-2.5 text-left font-medium">Supplier</th>
                    <th className="px-4 py-2.5 text-right font-medium">Quantity</th>
                    <th className="px-4 py-2.5 text-right font-medium">Bill amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {supplierRows.map(([name, s]) => (
                    <tr key={name}>
                      <td className="px-4 py-2.5 text-zinc-700">{name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700">{s.quantity.toLocaleString('en-US')}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-zinc-900">{taka(s.billAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-200 font-semibold text-zinc-900">
                    <td className="px-4 py-2.5">Total</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{totalQuantity.toLocaleString('en-US')}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{taka(totalBill)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-lg font-bold tabular-nums text-zinc-900">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  )
}
