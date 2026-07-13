import Link from 'next/link'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { can } from '@/lib/rbac'
import { Card, EmptyState } from '@/components/ui'
import { taka, shortDate } from '@/lib/format'

export default async function PurchaseReturnsPage() {
  const user = await requireCan('inventory.read')
  const writable = can(user.role, 'inventory.write')

  const returns = await db.purchaseReturn.findMany({
    orderBy: [{ returnDate: 'desc' }, { createdAt: 'desc' }],
    include: { supplier: true, lines: true },
    take: 100,
  })

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Returns to supplier</h1>
        <div className="flex gap-2">
          <Link href="/inventory" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            ← Inventory
          </Link>
          {writable && (
            <Link href="/inventory/purchase-returns/new" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
              New return
            </Link>
          )}
        </div>
      </div>

      {returns.length === 0 ? (
        <EmptyState message="No purchase returns yet. Record goods sent back to a supplier for credit." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Supplier</th>
                  <th className="px-4 py-3 text-right font-medium">Items</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Credit</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {returns.map((p) => {
                  const qty = p.lines.reduce((a, l) => a + l.quantity, 0)
                  return (
                    <tr key={p.id} className="text-slate-900 dark:text-slate-100">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">{shortDate(p.returnDate)}</td>
                      <td className="px-4 py-3 font-medium">{p.supplier?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">{p.lines.length}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{qty.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{taka(Number(p.creditAmount))}</td>
                      <td className="px-4 py-3 text-right">
                        <a href={`/documents/purchase-return/${p.id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Credit note</a>
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
