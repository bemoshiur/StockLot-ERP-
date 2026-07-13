import { db } from '@/lib/db'
import { requireUser } from '@/lib/guards'
import { PageHeader, Card } from '@/components/ui'
import { ROLE_LABELS, type Role } from '@/lib/enums'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const user = await requireUser()
  const account = await db.appUser.findUnique({ where: { id: user.id } })
  if (!account) return null

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My profile" />

      <Card>
        <dl className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex justify-between gap-4 px-5 py-3 text-sm">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{account.name}</dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-3 text-sm">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{account.email}</dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-3 text-sm">
            <dt className="text-slate-500">Role</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {ROLE_LABELS[account.role as Role]}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Change password</h2>
        <ProfileForm />
      </div>
    </div>
  )
}
