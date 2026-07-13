import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { taka, shortDate } from '@/lib/format'
import { PrintButton } from '../../../print-button'

export default async function CreditNoteDocumentPage({ params }: { params: Promise<{ returnId: string }> }) {
  await requireCan('sales.read')
  const { returnId } = await params
  const [ret, settings] = await Promise.all([
    db.salesReturn.findUnique({
      where: { id: returnId },
      include: {
        lines: { include: { style: true } },
        challan: { include: { customer: true } },
      },
    }),
    db.companySettings.findUnique({ where: { id: 'singleton' } }),
  ])
  if (!ret) notFound()

  const creditAmount = ret.lines.reduce((a, l) => a + Number(l.lineAmount), 0)

  return (
    <div className="text-black">
      <div className="mb-4 flex justify-end">
        <PrintButton />
      </div>

      {/* Document card: looks like paper on screen, clean when printed */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 pb-5">
          <div>
            <div className="text-3xl font-bold tracking-tight">{settings?.name ?? 'StockLot ERP'}</div>
            {settings?.address && <div className="mt-1 text-sm text-slate-600">{settings.address}</div>}
            {(settings?.phone || settings?.email) && (
              <div className="text-sm text-slate-600">
                {[settings.phone, settings.email].filter(Boolean).join(' · ')}
              </div>
            )}
            {settings?.tinBin && <div className="text-sm text-slate-600">TIN / BIN: {settings.tinBin}</div>}
            {!settings?.address && !settings?.phone && !settings?.email && (
              <div className="mt-1 text-sm text-slate-600">Wholesale operations</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">Credit Note</div>
            <div className="mt-1 text-sm text-slate-600">against Challan #{ret.challan.challanNo ?? '—'}</div>
            <div className="text-sm text-slate-600">Date: {shortDate(ret.returnDate)}</div>
          </div>
        </div>

        {/* Bill to */}
        <div className="py-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</div>
          <div className="mt-1 text-base font-semibold">{ret.challan.customer.name}</div>
        </div>

        {/* Line items */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-300 text-left text-slate-600">
              <th className="py-2 pr-3 font-medium">Style</th>
              <th className="py-2 px-3 text-right font-medium">Qty</th>
              <th className="py-2 px-3 text-right font-medium">Unit price</th>
              <th className="py-2 pl-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {ret.lines.map((l) => (
              <tr key={l.id} className="border-b border-slate-200">
                <td className="py-2 pr-3 font-medium">{l.style.styleName}</td>
                <td className="py-2 px-3 text-right tabular-nums">{l.quantity}</td>
                <td className="py-2 px-3 text-right tabular-nums">{taka(Number(l.unitPrice))}</td>
                <td className="py-2 pl-3 text-right tabular-nums">{taka(Number(l.lineAmount))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-bold">
              <span>Credit amount</span>
              <span className="tabular-nums">{taka(creditAmount)}</span>
            </div>
          </div>
        </div>

        {/* Reason */}
        {ret.reason && (
          <div className="mt-6 border-t border-slate-300 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</div>
            <div className="mt-1 text-sm text-slate-700">{ret.reason}</div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-slate-300 pt-4 text-center text-sm text-slate-600">
          {settings?.footerNote ?? 'Thank you for your business.'}
        </div>
      </div>
    </div>
  )
}
