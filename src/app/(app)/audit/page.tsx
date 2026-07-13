import Link from 'next/link'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { shortDate } from '@/lib/format'
import { PageHeader, Card, EmptyState, Field, Select } from '@/components/ui'

const PAGE_SIZE = 50

const ENTITIES = [
  'ProductStyle',
  'Customer',
  'Supplier',
  'Location',
  'AppUser',
  'SalesChallan',
  'PurchaseReceipt',
  'Expense',
  'CapitalMovement',
  'TreasuryDeposit',
  'CompanySettings',
]

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE']

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; action?: string; page?: string }>
}) {
  await requireCan('audit.read')
  const sp = await searchParams

  const entity = sp.entity && ENTITIES.includes(sp.entity) ? sp.entity : undefined
  const action = sp.action && ACTIONS.includes(sp.action) ? sp.action : undefined
  const page = Math.max(1, Number(sp.page) || 1)

  const where = {
    ...(entity ? { entity } : {}),
    ...(action ? { action } : {}),
  }

  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { at: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.auditLog.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const userIds = [...new Set(rows.map((r) => r.userId).filter((id): id is string => !!id))]
  const users = userIds.length
    ? await db.appUser.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
    : []
  const userMap = new Map(users.map((u) => [u.id, u.name]))

  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    if (entity) params.set('entity', entity)
    if (action) params.set('action', action)
    params.set('page', String(p))
    return `/audit?${params.toString()}`
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Audit log" />

      <form method="get" className="mb-5">
        <Card>
          <div className="flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-48">
              <Field label="Entity" name="entity">
                <Select name="entity" defaultValue={entity ?? ''}>
                  <option value="">All entities</option>
                  {ENTITIES.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="min-w-40">
              <Field label="Action" name="action">
                <Select name="action" defaultValue={action ?? ''}>
                  <option value="">All actions</option>
                  {ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Apply
            </button>
          </div>
        </Card>
      </form>

      {rows.length === 0 ? (
        <EmptyState message="No audit entries match these filters." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Field</th>
                  <th className="px-4 py-3 font-medium">Old → New</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.id} className="text-slate-900 dark:text-slate-100">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {shortDate(r.at)} {r.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.userId ? userMap.get(r.userId) ?? r.userId : 'system'}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.entity}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          ACTION_STYLES[r.action] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.field ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="tabular-nums">{r.oldValue ?? '—'}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      <span className="tabular-nums">{r.newValue ?? '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            {total} {total === 1 ? 'entry' : 'entries'} · Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildHref(page - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Prev
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-300 dark:border-slate-800 dark:text-slate-600">
                Prev
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={buildHref(page + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-300 dark:border-slate-800 dark:text-slate-600">
                Next
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
