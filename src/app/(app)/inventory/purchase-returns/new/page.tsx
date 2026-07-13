import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { PageHeader, EmptyState } from '@/components/ui'
import { PurchaseReturnForm } from '../purchase-return-form'

export default async function NewPurchaseReturnPage() {
  await requireCan('inventory.write')
  const [suppliers, styles] = await Promise.all([
    db.supplier.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    db.productStyle.findMany({
      where: { active: true },
      orderBy: { styleName: 'asc' },
      select: { id: true, styleCode: true, styleName: true },
    }),
  ])
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Return goods to supplier" />
      {suppliers.length === 0 || styles.length === 0 ? (
        <EmptyState message="Add a supplier and at least one style first." />
      ) : (
        <PurchaseReturnForm suppliers={suppliers} styles={styles} today={today} />
      )}
    </div>
  )
}
