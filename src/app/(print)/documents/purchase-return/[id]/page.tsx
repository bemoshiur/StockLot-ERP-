import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { taka, shortDate } from '@/lib/format'
import { PrintButton } from '../../../print-button'

export default async function PurchaseReturnDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCan('inventory.read')
  const { id } = await params
  const [pr, settings] = await Promise.all([
    db.purchaseReturn.findUnique({
      where: { id },
      include: {
        supplier: true,
        lines: { include: { style: true } },
      },
    }),
    db.companySettings.findUnique({ where: { id: 'singleton' } }),
  ])
  if (!pr) notFound()

  const totalQty = pr.lines.reduce((a, l) => a + l.quantity, 0)

  return (
    <div className="text-black">
      <div className="mb-4 flex justify-end">
        <PrintButton />
      </div>

      {/* Document card: looks like paper on screen, clean when printed */}
      <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-300 pb-5">
          <div>
            <div className="text-3xl font-bold tracking-tight">{settings?.name ?? 'StockLot ERP'}</div>
            {settings?.address && <div className="mt-1 text-sm text-zinc-600">{settings.address}</div>}
            {(settings?.phone || settings?.email) && (
              <div className="text-sm text-zinc-600">
                {[settings.phone, settings.email].filter(Boolean).join(' · ')}
              </div>
            )}
            {settings?.tinBin && <div className="text-sm text-zinc-600">TIN / BIN: {settings.tinBin}</div>}
            {!settings?.address && !settings?.phone && !settings?.email && (
              <div className="mt-1 text-sm text-zinc-600">Wholesale operations</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">Purchase Return / Credit Note</div>
            <div className="mt-1 text-sm text-zinc-600">Return No. {pr.id.slice(0, 8) || '—'}</div>
            <div className="text-sm text-zinc-600">Date: {shortDate(pr.returnDate)}</div>
          </div>
        </div>

        {/* Returned to */}
        <div className="py-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Returned to</div>
          <div className="mt-1 text-base font-semibold">{pr.supplier?.name ?? 'No supplier'}</div>
          {pr.reason && <div className="text-sm text-zinc-600">{pr.reason}</div>}
        </div>

        {/* Line items */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-zinc-300 text-left text-zinc-600">
              <th className="py-2 pr-3 font-medium">Style</th>
              <th className="py-2 px-3 text-right font-medium">Qty</th>
              <th className="py-2 px-3 text-right font-medium">Unit cost</th>
              <th className="py-2 pl-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {pr.lines.map((l) => (
              <tr key={l.id} className="border-b border-zinc-200">
                <td className="py-2 pr-3 font-medium">{l.style.styleName}</td>
                <td className="py-2 px-3 text-right tabular-nums">{l.quantity.toLocaleString('en-US')}</td>
                <td className="py-2 px-3 text-right tabular-nums">{taka(Number(l.unitCost))}</td>
                <td className="py-2 pl-3 text-right tabular-nums">{taka(Number(l.lineAmount))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between pt-1">
              <span className="text-zinc-600">Total quantity</span>
              <span className="tabular-nums font-medium">{totalQty.toLocaleString('en-US')}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-300 pt-1 text-base font-bold">
              <span>Credit to supplier account</span>
              <span className="tabular-nums">{taka(Number(pr.creditAmount))}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-zinc-300 pt-4 text-center text-sm text-zinc-600">
          {settings?.footerNote ?? 'Goods returned as above. Please credit our account.'}
        </div>
      </div>
    </div>
  )
}
