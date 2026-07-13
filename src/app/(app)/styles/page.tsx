import Link from 'next/link'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { can } from '@/lib/rbac'
import { PageHeader, EmptyState } from '@/components/ui'
import { SearchBar, Pagination, parseListParams, PAGE_SIZE } from '@/components/list-controls'
import { StylesTable } from './styles-table'
import type { Prisma } from '@prisma/client'

export default async function StylesPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const user = await requireCan('styles.write')
  const writable = can(user.role, 'styles.write')
  const sp = await searchParams
  const { q, page } = parseListParams(sp)

  const where: Prisma.ProductStyleWhereInput = q
    ? { OR: [{ styleName: { contains: q, mode: 'insensitive' } }, { styleCode: { contains: q, mode: 'insensitive' } }] }
    : {}

  const [styles, total] = await Promise.all([
    db.productStyle.findMany({
      where,
      orderBy: [{ active: 'desc' }, { styleName: 'asc' }],
      include: { _count: { select: { aliases: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.productStyle.count({ where }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Styles"
        action={writable ? { href: '/styles/new', label: 'New style' } : undefined}
        secondary={
          <>
            {writable && (
              <Link
                href="/styles/reconcile"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Reconcile
              </Link>
            )}
            <a
              href="/api/export/styles"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Export CSV
            </a>
          </>
        }
      />
      <div className="mb-4">
        <SearchBar q={q} placeholder="Search styles…" />
      </div>
      {styles.length === 0 ? (
        <EmptyState message="No styles yet. Add your first garment style to start tracking stock and profit." />
      ) : (
        <StylesTable
          writable={writable}
          rows={styles.map((s) => ({
            id: s.id,
            styleCode: s.styleCode,
            styleName: s.styleName,
            genderAgeGroup: s.genderAgeGroup,
            category: s.category,
            standardCost: Number(s.standardCost),
            aliasCount: s._count.aliases,
            active: s.active,
            isBulkLot: s.isBulkLot,
          }))}
        />
      )}
      <Pagination page={page} totalPages={totalPages} params={{ q }} />
    </div>
  )
}
