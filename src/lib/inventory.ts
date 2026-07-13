export type StockAgg = { received: number; sold: number; closing: number; negative: boolean }

/** Merge received and sold quantities per style into closing positions. */
export function aggregateStock(
  received: { styleId: string; quantity: number }[],
  sold: { styleId: string; quantity: number }[],
): Map<string, StockAgg> {
  const m = new Map<string, StockAgg>()
  const bump = (id: string, field: 'received' | 'sold', qty: number) => {
    const a = m.get(id) ?? { received: 0, sold: 0, closing: 0, negative: false }
    a[field] += qty
    m.set(id, a)
  }
  for (const r of received) bump(r.styleId, 'received', r.quantity)
  for (const s of sold) bump(s.styleId, 'sold', s.quantity)
  for (const a of m.values()) {
    a.closing = a.received - a.sold
    a.negative = a.closing < 0
  }
  return m
}
