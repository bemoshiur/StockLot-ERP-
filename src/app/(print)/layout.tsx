import { requireUser } from '@/lib/guards'

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireUser()
  return <div className="mx-auto max-w-3xl p-6 print:p-0">{children}</div>
}
