export type StockAgg = {
  received: number
  sold: number
  returned: number
  adjusted: number
  purchaseReturned: number
  closing: number
  negative: boolean
}

type Qty = { styleId: string; quantity: number }

const emptyAgg = (): StockAgg => ({ received: 0, sold: 0, returned: 0, adjusted: 0, purchaseReturned: 0, closing: 0, negative: false })

/** Merge all stock movements per style into closing positions.
 *  closing = received − sold + salesReturned + adjusted − purchaseReturned.
 *  `adjusted` quantities are signed (a stock-count correction may be negative). */
export function aggregateStock(
  received: Qty[],
  sold: Qty[],
  returned: Qty[] = [],
  adjusted: Qty[] = [],
  purchaseReturned: Qty[] = [],
): Map<string, StockAgg> {
  const m = new Map<string, StockAgg>()
  const bump = (id: string, field: keyof StockAgg, qty: number) => {
    const a = m.get(id) ?? emptyAgg()
    ;(a[field] as number) += qty
    m.set(id, a)
  }
  for (const r of received) bump(r.styleId, 'received', r.quantity)
  for (const s of sold) bump(s.styleId, 'sold', s.quantity)
  for (const r of returned) bump(r.styleId, 'returned', r.quantity)
  for (const a of adjusted) bump(a.styleId, 'adjusted', a.quantity)
  for (const p of purchaseReturned) bump(p.styleId, 'purchaseReturned', p.quantity)
  for (const a of m.values()) {
    a.closing = a.received - a.sold + a.returned + a.adjusted - a.purchaseReturned
    a.negative = a.closing < 0
  }
  return m
}
