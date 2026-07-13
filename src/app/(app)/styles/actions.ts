'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { writeAudit, diff } from '@/lib/audit'
import { styleSchema } from '@/lib/validators/style'
import type { FormState } from '@/components/ui'

function parse(formData: FormData) {
  return styleSchema.safeParse({
    styleCode: formData.get('styleCode'),
    styleName: formData.get('styleName'),
    genderAgeGroup: formData.get('genderAgeGroup'),
    category: formData.get('category'),
    seasonFlag: formData.get('seasonFlag'),
    grade: formData.get('grade'),
    isBulkLot: formData.get('isBulkLot') === 'on',
    standardCost: formData.get('standardCost'),
    reorderLevel: formData.get('reorderLevel'),
  })
}

export async function createStyle(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireCan('styles.write')
  const parsed = parse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  try {
    const created = await db.productStyle.create({
      data: { ...parsed.data, createdById: user.id, updatedById: user.id },
    })
    await writeAudit({ userId: user.id, entity: 'ProductStyle', entityId: created.id, action: 'CREATE' })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      return { error: `Style code "${parsed.data.styleCode}" already exists` }
    throw e
  }
  revalidatePath('/styles')
  redirect('/styles')
}

export async function updateStyle(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireCan('styles.write')
  const id = String(formData.get('id'))
  const parsed = parse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  const before = await db.productStyle.findUnique({ where: { id } })
  if (!before) return { error: 'Style not found' }
  try {
    const after = await db.productStyle.update({
      where: { id },
      data: { ...parsed.data, updatedById: user.id },
    })
    await writeAudit({
      userId: user.id,
      entity: 'ProductStyle',
      entityId: id,
      action: 'UPDATE',
      changes: diff(
        { ...before, standardCost: before.standardCost.toString() },
        { ...parsed.data, standardCost: String(after.standardCost) },
      ),
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      return { error: `Style code "${parsed.data.styleCode}" already exists` }
    throw e
  }
  revalidatePath('/styles')
  redirect('/styles')
}

export async function toggleStyleActive(id: string, active: boolean) {
  const user = await requireCan('styles.write')
  await db.productStyle.update({ where: { id }, data: { active, updatedById: user.id } })
  await writeAudit({
    userId: user.id,
    entity: 'ProductStyle',
    entityId: id,
    action: 'UPDATE',
    changes: [{ field: 'active', oldValue: String(!active), newValue: String(active) }],
  })
  revalidatePath('/styles')
}

export async function addAlias(styleId: string, formData: FormData) {
  await requireCan('styles.write')
  const aliasText = String(formData.get('aliasText') ?? '').trim()
  if (!aliasText) return
  try {
    await db.styleAlias.create({ data: { styleId, aliasText } })
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e
  }
  revalidatePath(`/styles/${styleId}`)
}

export async function removeAlias(aliasId: string, styleId: string) {
  await requireCan('styles.write')
  await db.styleAlias.delete({ where: { id: aliasId } })
  revalidatePath(`/styles/${styleId}`)
}
