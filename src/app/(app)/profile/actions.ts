'use server'

import { db } from '@/lib/db'
import { requireUser } from '@/lib/guards'
import { writeAudit } from '@/lib/audit'
import { hashPassword, verifyPassword } from '@/lib/password'
import { changePasswordSchema } from '@/lib/validators/profile'
import type { FormState } from '@/components/ui'

export async function changeOwnPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const account = await db.appUser.findUnique({ where: { id: user.id } })
  if (!account) return { error: 'User not found' }

  const ok = await verifyPassword(parsed.data.currentPassword, account.passwordHash)
  if (!ok) return { error: 'Current password is incorrect' }

  await db.appUser.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  })
  await writeAudit({
    userId: user.id,
    entity: 'AppUser',
    entityId: user.id,
    action: 'UPDATE',
    changes: [{ field: 'password', oldValue: null, newValue: '(changed by self)' }],
  })

  return { error: undefined }
}
