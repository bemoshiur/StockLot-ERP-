import { AppShell } from '@/components/app-shell'
import { PwaRegister } from '@/components/pwa-register'
import { requireUser } from '@/lib/guards'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <>
      <PwaRegister />
      <AppShell user={{ name: user.name, role: user.role }}>{children}</AppShell>
    </>
  )
}
