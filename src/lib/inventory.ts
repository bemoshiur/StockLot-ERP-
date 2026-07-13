export type StockAgg = { received: number; sold: number; returned: number; closing: number; negative: boolean }

type Qty = { styleId: string; quantity: number }

/** Merge received, sold and returned quantities per style into closing positions.
 *  closing = received − sold + returned (returns come back into stock). */
export function aggregateStock(received: Qty[], sold: Qty[], returned: Qty[] = []): Map<string, StockAgg> {
  const m = new Map<string, StockAgg>()
  const bump = (id: string, field: 'received' | 'sold' | 'returned', qty: number) => {
    const a = m.get(id) ?? { received: 0, sold: 0, returned: 0, closing: 0, negative: false }
    a[field] += qty
    m.set(id, a)
  }
  for (const r of received) bump(r.styleId, 'received', r.quantity)
  for (const s of sold) bump(s.styleId, 'sold', s.quantity)
  for (const r of returned) bump(r.styleId, 'returned', r.quantity)
  for (const a of m.values()) {
    a.closing = a.received - a.sold + a.returned
    a.negative = a.closing < 0
  }
  return m
}
