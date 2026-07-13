import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { PageHeader, Card } from '@/components/ui'
import { shortDate } from '@/lib/format'

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCan('inventory.read')
  const { id } = await params
  const r = await db.purchaseReceipt.findUnique({
    where: { id },
    include: { supplier: true, lines: { include: { style: true } } },
  })
  if (!r) notFound()
  const totalQty = r.lines.reduce((a, l) => a + l.quantity, 0)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={`Receipt ${r.challanNo ? `#${r.challanNo}` : ''}`} action={{ href: '/inventory', label: '← All receipts' }} />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{r.supplier?.name ?? 'No supplier'}</div>
            <div className="text-sm text-slate-500">
              {shortDate(r.receiptDate)}{r.isOpeningStock ? ' · opening stock' : ''}{r.remarks ? ` · ${r.remarks}` : ''}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{totalQty.toLocaleString('en-US')}</div>
            <div className="text-xs text-slate-500">pieces</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Style</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 text-right font-medium">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {r.lines.map((l) => (
                <tr key={l.id} className="text-slate-900 dark:text-slate-100">
                  <td className="px-4 py-3 font-medium">{l.style.styleName}</td>
                  <td className="px-4 py-3 text-slate-500">{l.subCategoryNote ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.quantity.toLocaleString('en-US')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
