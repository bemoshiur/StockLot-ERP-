'use client'

import { useActionState } from 'react'
import { Boxes } from 'lucide-react'
import { login } from './actions'

const inputClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20'

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, undefined)

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--page)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
            <Boxes className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">StockLot ERP</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to continue</p>
        </div>
        <form action={formAction} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-700">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
          </div>
          {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
