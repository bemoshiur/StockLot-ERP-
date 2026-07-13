import Link from 'next/link'

export type FormState = { error?: string } | undefined

export function PageHeader({
  title,
  action,
  secondary,
}: {
  title: string
  action?: { href: string; label: string }
  secondary?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
      {(secondary || action) && (
        <div className="flex items-center gap-2">
          {secondary}
          {action && (
            <Link
              href={action.href}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {action.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export function Field({
  label,
  name,
  children,
  hint,
  htmlFor,
}: {
  label: string
  name: string
  children: React.ReactNode
  hint?: string
  htmlFor?: string
}) {
  return (
    <div>
      <label htmlFor={htmlFor ?? name} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClass} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputClass} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={inputClass} />
}

export function Checkbox({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-700">
      <input type="checkbox" {...props} className="h-4 w-4 rounded border-zinc-300 accent-[var(--color-primary)]" />
      {label}
    </label>
  )
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
      {error}
    </p>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
      {message}
    </div>
  )
}

export function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? 'bg-success-50 text-success' : 'bg-zinc-100 text-zinc-500'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white shadow-sm ${className}`}>{children}</div>
  )
}
