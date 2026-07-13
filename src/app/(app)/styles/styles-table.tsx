'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, Badge } from '@/components/ui'
import { bulkSetStyleActive } from './actions'

export type StyleRow = {
  id: string
  styleCode: string
  styleName: string
  genderAgeGroup: string | null
  category: string | null
  standardCost: number
  aliasCount: number
  active: boolean
  isBulkLot: boolean
}

export function StylesTable({ rows, writable }: { rows: StyleRow[]; writable: boolean }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggleAll = () =>
    setSelected((s) => {
      if (rows.every((r) => s.has(r.id))) return new Set()
      return new Set(rows.map((r) => r.id))
    })

  const apply = (active: boolean) => {
    setError(undefined)
    const ids = [...selected]
    startTransition(async () => {
      const res = await bulkSetStyleActive(ids, active)
      if (!res.ok) setError(res.error ?? 'Could not update styles')
      else {
        setSelected(new Set())
        router.refresh()
      }
    })
  }

  return (
    <>
      {writable && selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => apply(true)}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-600 disabled:opacity-60"
            >
              Activate
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => apply(false)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60"
            >
              Deactivate
            </button>
          </div>
        </div>
      )}
      {error && <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <tr>
                {writable && (
                  <th className="px-4 py-3">
                    <input type="checkbox" aria-label="Select all on page" className="accent-primary" checked={allOnPage} onChange={toggleAll} />
                  </th>
                )}
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Group</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Std cost</th>
                <th className="px-4 py-3 font-medium">Aliases</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((s) => (
                <tr key={s.id} className={`text-slate-900 dark:text-slate-100 ${selected.has(s.id) ? 'bg-primary-50/50' : ''}`}>
                  {writable && (
                    <td className="px-4 py-3">
                      <input type="checkbox" aria-label={`Select ${s.styleName}`} className="accent-primary" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                    </td>
                  )}
                  <td className="px-4 py-3 font-mono text-xs">{s.styleCode}</td>
                  <td className="px-4 py-3 font-medium">
                    {s.styleName}
                    {s.isBulkLot && <span className="ml-2 text-xs text-amber-600">bulk</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.genderAgeGroup ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{s.category ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    ৳{s.standardCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.aliasCount}</td>
                  <td className="px-4 py-3"><Badge active={s.active} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/styles/${s.id}`} className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                      {writable ? 'Edit' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
