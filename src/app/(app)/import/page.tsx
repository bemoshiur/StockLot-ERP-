import { requireUser } from '@/lib/guards'
import { PageHeader } from '@/components/ui'
import { ImportClient } from './import-client'

export default async function ImportPage() {
  await requireUser()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Import" />
      <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">
        Upload a spreadsheet to bulk-create records. The first sheet is read; headers are matched loosely
        (case and punctuation are ignored). Rows that fail validation or duplicate an existing record are
        reported and skipped. Access is checked per entity.
      </p>
      <div className="mb-5 grid gap-3 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">Customers columns</p>
          <p>name, phone, location (area name), openingDue, creditTerms</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">Styles columns</p>
          <p>styleCode, styleName, genderAgeGroup, category, standardCost, seasonFlag, grade</p>
        </div>
      </div>
      <ImportClient />
    </div>
  )
}
