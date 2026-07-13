import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { PageHeader, EmptyState } from '@/components/ui'
import { AdjustmentForm } from '../adjustment-form'

export default async function NewStockAdjustmentPage() {
  await requireCan('inventory.write')
  const styles = await db.productStyle.findMany({
    where: { active: true },
    orderBy: { styleName: 'asc' },
    select: { id: true, styleCode: true, styleName: true },
  })
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New stock adjustment" />
      {styles.length === 0 ? (
        <EmptyState message="Add at least one style first." />
      ) : (
        <AdjustmentForm styles={styles} today={today} />
      )}
    </div>
  )
}
