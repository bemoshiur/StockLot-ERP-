import Link from 'next/link'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { can } from '@/lib/rbac'
import { PageHeader, Card, EmptyState } from '@/components/ui'
import { shortDate } from '@/lib/format'

export default async function InventoryPage() {
  const user = await requireCan('inventory.read')
  const writable = can(user.role, 'inventory.write')
  const receipts = await db.purchaseReceipt.findMany({
    orderBy: [{ receiptDate: 'desc' }, { createdAt: 'desc' }],
    include: { supplier: true, lines: { select: { quantity: true } } },
    take: 200,
  })

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Inventory — Receipts</h1>
        <div className="flex gap-2">
          <Link href="/inventory/net-stock" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Net stock
          </Link>
          {writable && (
            <Link href="/inventory/new" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
              New receipt
            </Link>
          )}
        </div>
      </div>

      {receipts.length === 0 ? (
        <EmptyState message="No goods-inward receipts yet. Record a receipt to bring stock into inventory." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Challan</th>
                  <th className="px-4 py-3 font-medium">Supplier</th>
                  <th className="px-4 py-3 text-right font-medium">Lines</th>
                  <th className="px-4 py-3 text-right font-medium">Total qty</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {receipts.map((r) => {
                  const qty = r.lines.reduce((a, l) => a + l.quantity, 0)
                  return (
                    <tr key={r.id} className="text-slate-900 dark:text-slate-100">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">{shortDate(r.receiptDate)}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {r.challanNo ?? '—'}
                        {r.isOpeningStock && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800">opening</span>}
                      </td>
                      <td className="px-4 py-3 font-medium">{r.supplier?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">{r.lines.length}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{qty.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/inventory/${r.id}`} className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Open</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
