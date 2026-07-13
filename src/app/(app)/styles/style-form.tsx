'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Field, TextInput, Select, Checkbox, FormError, Card, type FormState } from '@/components/ui'
import { GENDER_GROUPS, SEASONS, GRADES } from '@/lib/enums'

type StyleValues = {
  id?: string
  styleCode?: string
  styleName?: string
  genderAgeGroup?: string | null
  category?: string | null
  seasonFlag?: string | null
  grade?: string | null
  isBulkLot?: boolean
  standardCost?: string | number
}

export function StyleForm({
  action,
  values = {},
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  values?: StyleValues
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <Card>
      <form action={formAction} className="space-y-4 p-5">
        {values.id && <input type="hidden" name="id" value={values.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Style code" name="styleCode">
            <TextInput id="styleCode" name="styleCode" defaultValue={values.styleCode ?? ''} required />
          </Field>
          <Field label="Style name" name="styleName">
            <TextInput id="styleName" name="styleName" defaultValue={values.styleName ?? ''} required />
          </Field>
          <Field label="Gender / age group" name="genderAgeGroup">
            <Select id="genderAgeGroup" name="genderAgeGroup" defaultValue={values.genderAgeGroup ?? ''}>
              <option value="">—</option>
              {GENDER_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
          </Field>
          <Field label="Category" name="category">
            <TextInput id="category" name="category" defaultValue={values.category ?? ''} placeholder="T-Shirt, Hoodie…" />
          </Field>
          <Field label="Season" name="seasonFlag">
            <Select id="seasonFlag" name="seasonFlag" defaultValue={values.seasonFlag ?? ''}>
              <option value="">—</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Grade" name="grade">
            <Select id="grade" name="grade" defaultValue={values.grade ?? ''}>
              <option value="">—</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
          </Field>
          <Field label="Standard cost (BDT/piece)" name="standardCost" hint="Used to compute real profit on sales.">
            <TextInput
              id="standardCost"
              name="standardCost"
              type="number"
              step="0.01"
              min="0"
              defaultValue={values.standardCost != null ? String(values.standardCost) : '0'}
              required
            />
          </Field>
          <div className="flex items-end">
            <Checkbox name="isBulkLot" label="Bulk / mixed lot (e.g. Pre Stock, Mixed Item)" defaultChecked={values.isBulkLot} />
          </div>
        </div>

        <FormError error={state?.error} />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {pending ? 'Saving…' : submitLabel}
          </button>
          <Link
            href="/styles"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  )
}
