import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { PageHeader, Card, Field, TextInput } from '@/components/ui'
import { StyleForm } from '../style-form'
import { updateStyle, addAlias, removeAlias } from '../actions'

export default async function EditStylePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCan('styles.write')
  const { id } = await params
  const style = await db.productStyle.findUnique({
    where: { id },
    include: { aliases: { orderBy: { aliasText: 'asc' } } },
  })
  if (!style) notFound()

  const addAliasBound = addAlias.bind(null, style.id)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={`Edit: ${style.styleName}`} />
      <StyleForm
        action={updateStyle}
        submitLabel="Save changes"
        values={{
          id: style.id,
          styleCode: style.styleCode,
          styleName: style.styleName,
          genderAgeGroup: style.genderAgeGroup,
          category: style.category,
          seasonFlag: style.seasonFlag,
          grade: style.grade,
          isBulkLot: style.isBulkLot,
          standardCost: style.standardCost.toString(),
          reorderLevel: style.reorderLevel,
        }}
      />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Aliases <span className="font-normal text-slate-400">— old spellings that map to this style</span>
        </h2>
        <Card>
          <div className="p-5">
            {style.aliases.length === 0 ? (
              <p className="mb-4 text-sm text-slate-400">No aliases yet.</p>
            ) : (
              <ul className="mb-4 divide-y divide-slate-100 dark:divide-slate-800">
                {style.aliases.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-900 dark:text-slate-100">{a.aliasText}</span>
                    <form action={removeAlias.bind(null, a.id, style.id)}>
                      <button type="submit" className="text-xs font-medium text-red-600 hover:text-red-700">
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={addAliasBound} className="flex gap-2">
              <div className="flex-1">
                <Field label="Add alias" name="aliasText">
                  <TextInput id="aliasText" name="aliasText" placeholder="e.g. Ladies T-Shirt Solid" />
                </Field>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
