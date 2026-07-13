import Link from 'next/link'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { can } from '@/lib/rbac'
import { Card, EmptyState } from '@/components/ui'
import { shortDate } from '@/lib/format'
import { ADJUSTMENT_REASON_LABELS, type AdjustmentReason } from '@/lib/validators/stock-adjustment'

export default async function StockAdjustmentsPage() {
  const user = await requireCan('inventory.read')
  const writable = can(user.role, 'inventory.write')

  const adjustments = await db.stockAdjustment.findMany({
    orderBy: [{ adjustmentDate: 'desc' }, { createdAt: 'desc' }],
    include: { style: true },
    take: 100,
  })

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Stock adjustments</h1>
        <div className="flex items-center gap-2">
          <Link href="/inventory" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            ← Inventory
          </Link>
          {writable && (
            <Link href="/inventory/adjustments/new" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
              New adjustment
            </Link>
          )}
        </div>
      </div>

      {adjustments.length === 0 ? (
        <EmptyState message="No stock adjustments yet. Use these to correct counts or write off damage/loss." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Style</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {adjustments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 text-slate-500">{shortDate(a.adjustmentDate)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{a.style.styleName}</td>
                    <td className="px-4 py-3 text-slate-500">{ADJUSTMENT_REASON_LABELS[a.reason as AdjustmentReason]}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${a.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {a.quantity > 0 ? '+' : ''}{a.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{a.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
