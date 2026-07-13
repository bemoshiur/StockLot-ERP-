import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { PageHeader } from '@/components/ui'
import { ReturnForm } from './return-form'

const RETURNABLE_STATUSES = ['DISPATCHED', 'PARTIALLY_PAID', 'PAID']

export default async function ReturnPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCan('sales.write')
  const { id } = await params
  const c = await db.salesChallan.findUnique({
    where: { id },
    include: {
      lines: { include: { style: true } },
      returns: { include: { lines: true } },
    },
  })
  if (!c) notFound()
  if (!RETURNABLE_STATUSES.includes(c.status)) redirect(`/sales/${id}`)

  // Per style: sold quantity (summed across lines) minus quantity already returned.
  const soldByStyle = new Map<string, { styleName: string; unitPrice: number; quantity: number }>()
  for (const l of c.lines) {
    const cur = soldByStyle.get(l.styleId) ?? { styleName: l.style.styleName, unitPrice: Number(l.unitPrice), quantity: 0 }
    cur.quantity += l.quantity
    soldByStyle.set(l.styleId, cur)
  }
  const returnedByStyle = new Map<string, number>()
  for (const r of c.returns) for (const rl of r.lines) returnedByStyle.set(rl.styleId, (returnedByStyle.get(rl.styleId) ?? 0) + rl.quantity)

  const lines = [...soldByStyle.entries()].map(([styleId, s]) => ({
    styleId,
    styleName: s.styleName,
    unitPrice: s.unitPrice,
    maxQty: s.quantity - (returnedByStyle.get(styleId) ?? 0),
  }))

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={`Return — ${c.challanNo ? `#${c.challanNo}` : id}`} />
      <ReturnForm challanId={c.id} lines={lines} today={today} />
    </div>
  )
}
