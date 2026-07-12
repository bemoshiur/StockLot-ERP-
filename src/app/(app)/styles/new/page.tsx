import { requireCan } from '@/lib/guards'
import { PageHeader } from '@/components/ui'
import { StyleForm } from '../style-form'
import { createStyle } from '../actions'

export default async function NewStylePage() {
  await requireCan('styles.write')
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New style" />
      <StyleForm action={createStyle} submitLabel="Create style" />
    </div>
  )
}
