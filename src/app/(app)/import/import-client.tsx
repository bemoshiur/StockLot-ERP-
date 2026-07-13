'use client'

import { useActionState } from 'react'
import { Field, Select, Checkbox, FormError, Card } from '@/components/ui'
import { runImport } from './actions'

export function ImportClient() {
  const [state, formAction, pending] = useActionState(runImport, undefined)
  const summary = state?.summary

  return (
    <div className="space-y-5">
      <Card>
        <form action={formAction} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Entity" name="entity">
              <Select id="entity" name="entity" defaultValue="customers" required>
                <option value="customers">Customers</option>
                <option value="styles">Styles</option>
              </Select>
            </Field>
            <Field label="File" name="file" hint="Accepts .csv, .xlsx or .xls (first sheet).">
              <input
                id="file"
                name="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-sm file:font-medium file:text-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:file:bg-white dark:file:text-slate-900"
              />
            </Field>
          </div>

          <Checkbox name="previewOnly" label="Preview only (validate without saving)" />

          <FormError error={state?.error} />

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {pending ? 'Importing…' : 'Import'}
          </button>
        </form>
      </Card>

      {summary && (
        <Card>
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{summary.entity} import</h2>
              {summary.previewOnly && (
                <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Preview only — nothing saved
                </span>
              )}
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-green-700 dark:text-green-400">{summary.created}</span> created,{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{summary.skippedDuplicate}</span>{' '}
              skipped as duplicates,{' '}
              <span className="font-semibold text-red-700 dark:text-red-400">{summary.errors.length}</span> errors.
            </p>

            {summary.errors.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-2 font-medium">Row</th>
                      <th className="px-4 py-2 font-medium">Problem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {summary.errors.map((e) => (
                      <tr key={e.row} className="text-slate-900 dark:text-slate-100">
                        <td className="px-4 py-2 font-mono text-xs tabular-nums text-slate-500">{e.row}</td>
                        <td className="px-4 py-2">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
