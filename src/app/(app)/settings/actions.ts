'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { writeAudit } from '@/lib/audit'
import { settingsSchema } from '@/lib/validators/settings'
import type { FormState } from '@/components/ui'

export async function updateSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireCan('settings.manage')
  const parsed = settingsSchema.safeParse({
    name: formData.get('name'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    tinBin: formData.get('tinBin'),
    footerNote: formData.get('footerNote'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  await db.companySettings.upsert({
    where: { id: 'singleton' },
    update: { ...parsed.data, updatedById: user.id },
    create: { id: 'singleton', ...parsed.data },
  })
  await writeAudit({ userId: user.id, entity: 'CompanySettings', entityId: 'singleton', action: 'UPDATE' })

  revalidatePath('/settings')
  revalidatePath('/')
  return { error: undefined }
}
