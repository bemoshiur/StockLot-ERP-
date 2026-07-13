'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/lib/enums'
import { can } from '@/lib/rbac'
import { NAV_ITEMS } from '@/lib/nav'

export function Nav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname()
  const items = NAV_ITEMS.filter((i) => !i.action || can(role, i.action))

  // Preserve group order as first-seen.
  const groups: string[] = []
  for (const i of items) if (!groups.includes(i.group)) groups.push(i.group)

  return (
    <nav className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group}>
          <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{group}</div>
          <div className="flex flex-col gap-0.5">
            {items
              .filter((i) => i.group === group)
              .map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-primary-50 text-primary'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] ${active ? 'text-primary' : 'text-zinc-400'}`} strokeWidth={2} />
                    {item.label}
                  </Link>
                )
              })}
          </div>
        </div>
      ))}
    </nav>
  )
}
