import { db } from '@/lib/db'
import { aggregateStock, type StockAgg } from '@/lib/inventory'

/** Challan statuses that count toward stock, dues and reports (excludes DRAFT and VOID). */
export const ACTIVE_CHALLAN_STATUSES = ['DISPATCHED', 'PARTIALLY_PAID', 'PAID'] as const
export const activeChallanFilter = { status: { in: [...ACTIVE_CHALLAN_STATUSES] } }

/** Whether a challan status counts toward the books. */
export const isActiveChallan = (status: string): boolean =>
  (ACTIVE_CHALLAN_STATUSES as readonly string[]).includes(status)

/** Net stock per style = received − sold + salesReturned + adjusted − purchaseReturned,
 *  counting only active challans for sales/returns. */
export async function computeNetStockAgg(): Promise<Map<string, StockAgg>> {
  const [received, sold, returned, adjusted, purchaseReturned] = await Promise.all([
    db.receiptLine.groupBy({ by: ['styleId'], _sum: { quantity: true } }),
    db.saleLine.groupBy({ by: ['styleId'], _sum: { quantity: true }, where: { challan: activeChallanFilter } }),
    db.returnLine.groupBy({ by: ['styleId'], _sum: { quantity: true }, where: { return: { challan: activeChallanFilter } } }),
    db.stockAdjustment.groupBy({ by: ['styleId'], _sum: { quantity: true } }),
    db.purchaseReturnLine.groupBy({ by: ['styleId'], _sum: { quantity: true } }),
  ])
  return aggregateStock(
    received.map((r) => ({ styleId: r.styleId, quantity: r._sum.quantity ?? 0 })),
    sold.map((s) => ({ styleId: s.styleId, quantity: s._sum.quantity ?? 0 })),
    returned.map((r) => ({ styleId: r.styleId, quantity: r._sum.quantity ?? 0 })),
    adjusted.map((a) => ({ styleId: a.styleId, quantity: a._sum.quantity ?? 0 })),
    purchaseReturned.map((p) => ({ styleId: p.styleId, quantity: p._sum.quantity ?? 0 })),
  )
}
