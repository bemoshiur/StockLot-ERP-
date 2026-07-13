import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { challanTotals } from '@/lib/sales'
import { taka, shortDate, STATUS_LABELS } from '@/lib/format'
import { PrintButton } from '../../../print-button'

export default async function ChallanDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCan('sales.read')
  const { id } = await params
  const c = await db.salesChallan.findUnique({
    where: { id },
    include: {
      customer: true,
      location: true,
      lines: { include: { style: true } },
      payments: { orderBy: { receiptDate: 'asc' } },
    },
  })
  if (!c) notFound()

  const t = challanTotals(
    c.lines.map((l) => ({ quantity: l.quantity, unitPrice: Number(l.unitPrice), unitCost: Number(l.unitCostSnapshot) })),
    c.payments.map((p) => ({ amountCollected: Number(p.amountCollected), discountOrWaiver: Number(p.discountOrWaiver) })),
  )

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
            <div className="text-3xl font-bold tracking-tight">StockLot ERP</div>
            <div className="mt-1 text-sm text-slate-600">Wholesale operations</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">Challan / Invoice</div>
            <div className="mt-1 text-sm text-slate-600">No. {c.challanNo ?? '—'}</div>
            <div className="text-sm text-slate-600">Date: {shortDate(c.saleDate)}</div>
          </div>
        </div>

        {/* Bill to */}
        <div className="py-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bill to</div>
          <div className="mt-1 text-base font-semibold">{c.customer.name}</div>
          {c.location && <div className="text-sm text-slate-600">{c.location.areaName}</div>}
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
            {c.lines.map((l) => (
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
            <div className="flex justify-between">
              <span className="text-slate-600">Invoice total</span>
              <span className="tabular-nums font-medium">{taka(t.invoiceTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Collected</span>
              <span className="tabular-nums">{taka(t.collectedTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Discount</span>
              <span className="tabular-nums">{taka(t.discountTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-bold">
              <span>Due</span>
              <span className="tabular-nums">{taka(t.dueTotal)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-600">Status</span>
              <span className="font-medium">{STATUS_LABELS[c.status] ?? c.status}</span>
            </div>
          </div>
        </div>

        {/* Payments / money receipt */}
        {c.payments.length > 0 && (
          <div className="mt-6 border-t border-slate-300 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Money receipt</div>
            <ul className="mt-2 divide-y divide-slate-200 text-sm">
              {c.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span className="text-slate-600">
                    {shortDate(p.receiptDate)} · {p.method}
                    {p.notes ? ` · ${p.notes}` : ''}
                  </span>
                  <span className="tabular-nums">
                    {taka(Number(p.amountCollected))}
                    {Number(p.discountOrWaiver) > 0 && (
                      <span className="ml-2 text-xs text-slate-500">(disc {taka(Number(p.discountOrWaiver))})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-slate-300 pt-4 text-center text-sm text-slate-600">
          Thank you for your business.
        </div>
      </div>
    </div>
  )
}
