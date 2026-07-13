'use client'

import { useActionState } from 'react'
import { Field, TextInput, Textarea, FormError, Card, type FormState } from '@/components/ui'
import { updateSettings } from './actions'

type SettingsValues = {
  name?: string
  address?: string | null
  phone?: string | null
  email?: string | null
  tinBin?: string | null
  footerNote?: string | null
}

export function SettingsForm({ values = {} }: { values?: SettingsValues }) {
  const [state, formAction, pending] = useActionState(updateSettings, undefined)
  const saved = state !== undefined && !state.error && !pending

  return (
    <Card>
      <form action={formAction} className="space-y-4 p-5">
        <Field label="Company name" name="name">
          <TextInput id="name" name="name" defaultValue={values.name ?? ''} required />
        </Field>
        <Field label="Address" name="address">
          <Textarea id="address" name="address" rows={2} defaultValue={values.address ?? ''} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" name="phone">
            <TextInput id="phone" name="phone" defaultValue={values.phone ?? ''} />
          </Field>
          <Field label="Email" name="email">
            <TextInput id="email" name="email" type="email" defaultValue={values.email ?? ''} />
          </Field>
          <Field label="TIN / BIN" name="tinBin">
            <TextInput id="tinBin" name="tinBin" defaultValue={values.tinBin ?? ''} />
          </Field>
        </div>
        <Field label="Footer note" name="footerNote" hint="Shown at the bottom of printed documents">
          <Textarea id="footerNote" name="footerNote" rows={2} defaultValue={values.footerNote ?? ''} />
        </Field>

        <FormError error={state?.error} />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {pending ? 'Saving…' : 'Save settings'}
          </button>
          {saved && <span className="text-sm font-medium text-green-600 dark:text-green-400">Saved</span>}
        </div>
      </form>
    </Card>
  )
}
