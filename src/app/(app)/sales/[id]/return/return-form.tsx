'use client'

import { useActionState, useState } from 'react'
import { Field, TextInput, FormError, Card, type FormState } from '@/components/ui'
import { taka } from '@/lib/format'
import { createReturn } from '../../actions'

type Line = { styleId: string; styleName: string; unitPrice: number; maxQty: number }

export function ReturnForm({ challanId, lines, today }: { challanId: string; lines: Line[]; today: string }) {
  const action = createReturn.bind(null, challanId) as (prev: FormState, formData: FormData) => Promise<FormState>
  const [state, formAction, pending] = useActionState(action, undefined)
  const [qtys, setQtys] = useState<Record<string, string>>({})

  const qtyOf = (styleId: string) => qtys[styleId] ?? ''
  const num = (s: string) => (s === '' ? 0 : Number(s))

  const returnTotal = lines.reduce((a, l) => a + num(qtyOf(l.styleId)) * l.unitPrice, 0)

  const linesJson = JSON.stringify(lines.map((l) => ({ styleId: l.styleId, quantity: num(qtyOf(l.styleId)) })))

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="linesJson" value={linesJson} />
      <Card>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Return date" name="returnDate">
            <TextInput id="returnDate" name="returnDate" type="date" defaultValue={today} required />
          </Field>
          <Field label="Reason (optional)" name="reason">
            <TextInput id="reason" name="reason" />
          </Field>
        </div>
      </Card>

      <Card>
        <div className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Items</h2>
          <div className="space-y-2">
            {lines.map((l) => (
              <div key={l.styleId} className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-6 text-sm font-medium text-slate-900 dark:text-slate-100">{l.styleName}</div>
                <div className="col-span-3 text-sm text-slate-500">sold/returnable {l.maxQty}</div>
                <div className="col-span-3">
                  <TextInput
                    aria-label={`Return quantity for ${l.styleName}`}
                    type="number"
                    min="0"
                    max={l.maxQty}
                    placeholder="Qty"
                    value={qtyOf(l.styleId)}
                    onChange={(e) => setQtys((q) => ({ ...q, [l.styleId]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end border-t border-slate-200 pt-3 text-sm dark:border-slate-800">
            <div className="text-right">
              <div className="text-slate-500">Return total</div>
              <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{taka(returnTotal)}</div>
            </div>
          </div>
        </div>
      </Card>

      <FormError error={state?.error} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {pending ? 'Saving…' : 'Create credit note'}
      </button>
    </form>
  )
}
