'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Menu, LogOut, Boxes } from 'lucide-react'
import { Nav } from '@/components/nav'
import { logout } from '@/app/(app)/actions'
import { ROLE_LABELS, type Role } from '@/lib/enums'

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
        <Boxes className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold text-zinc-900">StockLot ERP</div>
        <div className="text-[11px] text-zinc-400">Wholesale operations</div>
      </div>
    </div>
  )
}

function UserFooter({ user }: { user: { name: string; role: Role } }) {
  const initials = user.name.trim().slice(0, 1).toUpperCase() || 'U'
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-zinc-900">{user.name}</div>
        <div className="truncate text-xs text-zinc-400">{ROLE_LABELS[user.role]}</div>
      </div>
      <form action={logout}>
        <button
          type="submit"
          title="Sign out"
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-danger"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </form>
    </div>
  )
}

export function AppShell({
  user,
  children,
}: {
  user: { name: string; role: Role }
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const sidebar = (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="pt-1">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        <Nav role={user.role} onNavigate={() => setOpen(false)} />
      </div>
      <UserFooter user={user} />
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[var(--page)]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-zinc-200 bg-white md:block">
        {sidebar}
      </aside>

      {/* Drawer (mobile) */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] border-r border-zinc-200 bg-white">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-md md:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-zinc-900 md:hidden">StockLot ERP</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-zinc-400 sm:block">{user.name}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary">
              {user.name.trim().slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
