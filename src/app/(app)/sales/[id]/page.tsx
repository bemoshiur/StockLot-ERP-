import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { can } from '@/lib/rbac'
import { Card } from '@/components/ui'
import { challanTotals } from '@/lib/sales'
import { taka, shortDate, STATUS_STYLES, STATUS_LABELS } from '@/lib/format'
import Link from 'next/link'
import { PaymentForm } from '../payment-form'
import { confirmDraft, voidChallan } from '../actions'

const RETURNABLE_STATUSES = ['DISPATCHED', 'PARTIALLY_PAID', 'PAID']

export default async function ChallanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCan('sales.read')
  const { id } = await params
  const c = await db.salesChallan.findUnique({
    where: { id },
    include: {
      customer: true,
      location: true,
      lines: { include: { style: true } },
      payments: { orderBy: { receiptDate: 'asc' } },
      returns: { include: { lines: { include: { style: true } } }, orderBy: { returnDate: 'asc' } },
    },
  })
  if (!c) notFound()

  const t = challanTotals(
    c.lines.map((l) => ({ quantity: l.quantity, unitPrice: Number(l.unitPrice), unitCost: Number(l.unitCostSnapshot) })),
    c.payments.map((p) => ({ amountCollected: Number(p.amountCollected), discountOrWaiver: Number(p.discountOrWaiver) })),
  )
  const canPay = can(user.role, 'payments.write')
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{`Sale ${c.challanNo ? `#${c.challanNo}` : ''}`}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/documents/challan/${c.id}`}
            target="_blank"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Print / Invoice
          </Link>
          {c.status === 'DRAFT' && (
            <form action={confirmDraft.bind(null, c.id)}>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Confirm & post
              </button>
            </form>
          )}
          {RETURNABLE_STATUSES.includes(c.status) && (
            <Link
              href={`/sales/${c.id}/return`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Return / credit note
            </Link>
          )}
          {RETURNABLE_STATUSES.includes(c.status) && c.payments.length === 0 && (
            <form action={voidChallan.bind(null, c.id)}>
              <button
                type="submit"
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                Void
              </button>
            </form>
          )}
          <Link
            href="/sales"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            ← All sales
          </Link>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{c.customer.name}</div>
            <div className="text-sm text-slate-500">
              {shortDate(c.saleDate)}{c.location ? ` · ${c.location.areaName}` : ''}
            </div>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[c.status]}`}>{STATUS_LABELS[c.status] ?? c.status}</span>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Style</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {c.lines.map((l) => (
                <tr key={l.id} className="text-slate-900 dark:text-slate-100">
                  <td className="px-4 py-3 font-medium">{l.style.styleName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{taka(Number(l.unitPrice))}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{taka(Number(l.lineAmount))}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-green-700 dark:text-green-400">{taka(Number(l.lineGrossProfit))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 font-semibold dark:border-slate-800">
              <tr>
                <td className="px-4 py-3" colSpan={3}>Invoice total</td>
                <td className="px-4 py-3 text-right tabular-nums">{taka(t.invoiceTotal)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-green-700 dark:text-green-400">{taka(t.grossProfit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Collected" value={taka(t.collectedTotal)} />
        <Stat label="Discount" value={taka(t.discountTotal)} />
        <Stat label="Due" value={taka(t.dueTotal)} highlight={t.dueTotal > 0} />
      </div>

      {c.payments.length > 0 && (
        <Card>
          <div className="p-5">
            <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Payments</h2>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {c.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-500">{shortDate(p.receiptDate)} · {p.method}{p.notes ? ` · ${p.notes}` : ''}</span>
                  <span className="tabular-nums text-slate-900 dark:text-slate-100">
                    {taka(Number(p.amountCollected))}
                    {Number(p.discountOrWaiver) > 0 && <span className="ml-2 text-xs text-slate-400">(disc {taka(Number(p.discountOrWaiver))})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {c.returns.length > 0 && (
        <Card>
          <div className="p-5">
            <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Returns</h2>
            <div className="space-y-4">
              {c.returns.map((r) => (
                <div key={r.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{shortDate(r.returnDate)}</span>
                    {r.reason && <span className="text-slate-500">{r.reason}</span>}
                  </div>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {r.lines.map((l) => (
                      <li key={l.id} className="flex items-center justify-between py-1.5 text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{l.style.styleName} × {l.quantity}</span>
                        <span className="tabular-nums text-slate-900 dark:text-slate-100">{taka(Number(l.lineAmount))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {c.status === 'DRAFT' && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-primary dark:text-slate-400">
          Draft — not yet posted to dues or reports.
        </p>
      )}

      {c.status === 'VOID' && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          This challan is void — excluded from stock, dues and reports.
        </p>
      )}

      {canPay && c.status !== 'DRAFT' && c.status !== 'VOID' && t.dueTotal > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Record payment</h2>
          <Card>
            <PaymentForm challanId={c.id} today={today} />
          </Card>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-primary">
      <div className={`text-lg font-bold tabular-nums ${highlight ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  )
}
