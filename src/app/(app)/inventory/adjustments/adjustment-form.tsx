'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Field, TextInput, Select, Textarea, FormError, Card, type FormState } from '@/components/ui'
import { ADJUSTMENT_REASONS, ADJUSTMENT_REASON_LABELS } from '@/lib/validators/stock-adjustment'
import { createStockAdjustment } from '../actions'

type StyleOpt = { id: string; styleCode: string; styleName: string }

export function AdjustmentForm({ styles, today }: { styles: StyleOpt[]; today: string }) {
  const [state, formAction, pending] = useActionState(createStockAdjustment, undefined)

  return (
    <form action={formAction} className="space-y-5">
      <Card>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Style" name="styleId">
            <Select id="styleId" name="styleId" defaultValue="" required>
              <option value="">Select style…</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>{s.styleName} ({s.styleCode})</option>
              ))}
            </Select>
          </Field>
          <Field label="Adjustment date" name="adjustmentDate">
            <TextInput id="adjustmentDate" name="adjustmentDate" type="date" defaultValue={today} required />
          </Field>
          <Field
            label="Quantity"
            name="quantity"
            hint="Positive adds stock (found/surplus), negative removes (damage/loss)."
          >
            <TextInput id="quantity" name="quantity" type="number" step="1" required />
          </Field>
          <Field label="Reason" name="reason">
            <Select id="reason" name="reason" defaultValue="COUNT">
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r} value={r}>{ADJUSTMENT_REASON_LABELS[r]}</option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Note" name="note">
              <Textarea id="note" name="note" rows={2} />
            </Field>
          </div>
        </div>
      </Card>

      <FormError error={state?.error} />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
          {pending ? 'Saving…' : 'Save adjustment'}
        </button>
        <Link href="/inventory/adjustments" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          Cancel
        </Link>
      </div>
    </form>
  )
}
