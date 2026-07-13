'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function SearchBox() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = inputRef.current?.value.trim() ?? ''
    if (q.length >= 2) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={submit} className="relative hidden sm:block" role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        ref={inputRef}
        type="search"
        name="q"
        placeholder="Search…"
        aria-label="Search customers, styles, suppliers, sales"
        className="w-48 rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:w-64 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </form>
  )
}
