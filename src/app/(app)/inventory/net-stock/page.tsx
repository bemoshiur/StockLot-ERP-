import Link from 'next/link'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { PageHeader, Card, EmptyState } from '@/components/ui'
import { computeNetStockAgg } from '@/lib/queries'

export default async function NetStockPage() {
  await requireCan('inventory.read')

  const agg = await computeNetStockAgg()

  // Include every active style PLUS any style that has movement even if inactive,
  // so the total and negative-stock alerts never silently drop stock.
  const movedIds = [...agg.keys()]
  const styles = await db.productStyle.findMany({
    where: { OR: [{ active: true }, { id: { in: movedIds } }] },
    select: { id: true, styleCode: true, styleName: true, isBulkLot: true, active: true, reorderLevel: true },
  })

  const emptyAgg = { received: 0, sold: 0, returned: 0, adjusted: 0, purchaseReturned: 0, closing: 0, negative: false }
  const rows = styles
    .map((s) => {
      const a = agg.get(s.id) ?? emptyAgg
      // Low stock: a reorder level is set and on-hand is at/below it (but not negative — that's a separate alert).
      const lowStock = s.reorderLevel > 0 && a.closing >= 0 && a.closing <= s.reorderLevel
      return { ...s, ...a, lowStock }
    })
    .sort((x, y) => y.closing - x.closing)

  const totalClosing = rows.reduce((a, r) => a + r.closing, 0)
  const negatives = rows.filter((r) => r.negative)
  const lowStocks = rows.filter((r) => r.lowStock)

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Net stock"
        action={{ href: '/inventory', label: '← Receipts' }}
        secondary={
          <>
            <Link
              href="/styles/reconcile"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Reconcile
            </Link>
            <a
              href="/api/export/netstock"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Export CSV
            </a>
          </>
        }
      />

      {styles.length === 0 ? (
        <EmptyState message="No styles yet." />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total on hand" value={totalClosing.toLocaleString('en-US') + ' pcs'} />
            <Stat label="Styles tracked" value={String(rows.length)} />
            <Stat label="Low-stock styles" value={String(lowStocks.length)} warn={lowStocks.length > 0} tone="amber" />
            <Stat label="Negative-stock styles" value={String(negatives.length)} warn={negatives.length > 0} />
          </div>

          {negatives.length > 0 && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <strong>{negatives.length} style{negatives.length > 1 ? 's' : ''} sold more than received.</strong>{' '}
              This means a sale was recorded for stock never received (or a style-name mismatch) — check{' '}
              {negatives.map((n) => n.styleName).join(', ')}.
            </div>
          )}

          {lowStocks.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <strong>{lowStocks.length} style{lowStocks.length > 1 ? 's' : ''} at or below reorder level.</strong>{' '}
              Consider restocking: {lowStocks.map((n) => `${n.styleName} (${n.closing}/${n.reorderLevel})`).join(', ')}.
            </div>
          )}

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Style</th>
                    <th className="px-4 py-3 text-right font-medium">Received</th>
                    <th className="px-4 py-3 text-right font-medium">Sold</th>
                    <th className="px-4 py-3 text-right font-medium">Reorder</th>
                    <th className="px-4 py-3 text-right font-medium">On hand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((r) => (
                    <tr key={r.id} className={r.negative ? 'bg-red-50/60 dark:bg-red-950/30' : r.lowStock ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''}>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        <Link href={`/styles/${r.id}`} className="hover:underline">{r.styleName}</Link>
                        {r.isBulkLot && <span className="ml-2 text-xs text-amber-600">bulk</span>}
                        {r.lowStock && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">low</span>}
                        {!r.active && <span className="ml-2 text-xs text-slate-400">inactive</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">{r.received.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">{r.sold.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-400">{r.reorderLevel > 0 ? r.reorderLevel.toLocaleString('en-US') : '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${r.negative ? 'text-red-600' : r.lowStock ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {r.closing.toLocaleString('en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, warn, tone }: { label: string; value: string; warn?: boolean; tone?: 'amber' }) {
  const warnColor = tone === 'amber' ? 'text-amber-700 dark:text-amber-400' : 'text-red-600'
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-primary">
      <div className={`text-2xl font-bold tabular-nums ${warn ? warnColor : 'text-slate-900 dark:text-white'}`}>{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  )
}
