'use client'

import { useActionState } from 'react'
import { Field, TextInput, FormError, Card, type FormState } from '@/components/ui'
import { changeOwnPassword } from './actions'

export function ProfileForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(changeOwnPassword, undefined)
  const success = state != null && !state.error

  return (
    <Card>
      <form action={formAction} className="space-y-4 p-5">
        <Field label="Current password" name="currentPassword">
          <TextInput id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
        </Field>
        <Field label="New password" name="newPassword" hint="At least 8 characters.">
          <TextInput id="newPassword" name="newPassword" type="password" autoComplete="new-password" required />
        </Field>
        <Field label="Confirm new password" name="confirmPassword">
          <TextInput id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        </Field>

        <FormError error={state?.error} />
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            Password changed
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {pending ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </Card>
  )
}
