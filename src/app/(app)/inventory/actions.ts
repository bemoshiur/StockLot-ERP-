'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { writeAudit } from '@/lib/audit'
import { receiptSchema } from '@/lib/validators/receipt'
import { stockAdjustmentSchema } from '@/lib/validators/stock-adjustment'
import { purchaseReturnSchema } from '@/lib/validators/purchase-return'
import { periodLockError } from '@/lib/period'
import { roundMoney } from '@/lib/sales'
import type { FormState } from '@/components/ui'

export async function createReceipt(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireCan('inventory.write')

  let lines: unknown
  try {
    lines = JSON.parse(String(formData.get('linesJson') ?? '[]'))
  } catch {
    return { error: 'Could not read the receipt lines' }
  }

  const parsed = receiptSchema.safeParse({
    supplierId: formData.get('supplierId'),
    receiptDate: formData.get('receiptDate'),
    challanNo: formData.get('challanNo'),
    isOpeningStock: formData.get('isOpeningStock') === 'on',
    remarks: formData.get('remarks'),
    lines,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  const data = parsed.data

  const styleIds = [...new Set(data.lines.map((l) => l.styleId))]
  const found = await db.productStyle.count({ where: { id: { in: styleIds } } })
  if (found !== styleIds.length) return { error: 'One of the selected styles no longer exists' }

  const periodMonth = data.receiptDate.slice(0, 7)
  const lock = await periodLockError(periodMonth)
  if (lock) return { error: lock }

  const billAmount = Number(formData.get('billAmount') ?? 0) || 0

  const receiptDate = new Date(data.receiptDate)
  const receipt = await db.purchaseReceipt.create({
    data: {
      challanNo: data.challanNo ?? null,
      receiptDate,
      periodMonth,
      supplierId: data.supplierId ?? null,
      isOpeningStock: data.isOpeningStock,
      billAmount,
      remarks: data.remarks ?? null,
      createdById: user.id,
      updatedById: user.id,
      lines: {
        create: data.lines.map((l) => ({
          styleId: l.styleId,
          quantity: l.quantity,
          subCategoryNote: l.subCategoryNote ?? null,
        })),
      },
    },
  })

  await writeAudit({ userId: user.id, entity: 'PurchaseReceipt', entityId: receipt.id, action: 'CREATE' })
  revalidatePath('/inventory')
  revalidatePath('/inventory/net-stock')
  redirect(`/inventory/${receipt.id}`)
}

export async function createStockAdjustment(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireCan('inventory.write')

  const parsed = stockAdjustmentSchema.safeParse({
    styleId: formData.get('styleId'),
    adjustmentDate: formData.get('adjustmentDate'),
    quantity: formData.get('quantity'),
    reason: formData.get('reason'),
    note: formData.get('note'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  const data = parsed.data

  const style = await db.productStyle.findUnique({ where: { id: data.styleId }, select: { id: true } })
  if (!style) return { error: 'The selected style no longer exists' }

  const periodMonth = data.adjustmentDate.slice(0, 7)
  const lock = await periodLockError(periodMonth)
  if (lock) return { error: lock }

  const adj = await db.stockAdjustment.create({
    data: {
      styleId: data.styleId,
      adjustmentDate: new Date(data.adjustmentDate),
      periodMonth,
      quantity: data.quantity,
      reason: data.reason,
      note: data.note ?? null,
      createdById: user.id,
    },
  })

  await writeAudit({ userId: user.id, entity: 'StockAdjustment', entityId: adj.id, action: 'CREATE' })
  revalidatePath('/inventory/adjustments')
  revalidatePath('/inventory/net-stock')
  redirect('/inventory/adjustments')
}

export async function createPurchaseReturn(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireCan('inventory.write')

  let lines: unknown
  try {
    lines = JSON.parse(String(formData.get('linesJson') ?? '[]'))
  } catch {
    return { error: 'Could not read the return lines' }
  }

  const parsed = purchaseReturnSchema.safeParse({
    supplierId: formData.get('supplierId'),
    returnDate: formData.get('returnDate'),
    reason: formData.get('reason'),
    lines,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  const data = parsed.data

  const supplier = await db.supplier.findUnique({ where: { id: data.supplierId }, select: { id: true } })
  if (!supplier) return { error: 'The selected supplier no longer exists' }

  const styleIds = [...new Set(data.lines.map((l) => l.styleId))]
  const found = await db.productStyle.count({ where: { id: { in: styleIds } } })
  if (found !== styleIds.length) return { error: 'One of the selected styles no longer exists' }

  const periodMonth = data.returnDate.slice(0, 7)
  const lock = await periodLockError(periodMonth)
  if (lock) return { error: lock }

  const lineData = data.lines.map((l) => ({
    styleId: l.styleId,
    quantity: l.quantity,
    unitCost: l.unitCost,
    lineAmount: roundMoney(l.quantity * l.unitCost),
  }))
  const creditAmount = roundMoney(lineData.reduce((a, l) => a + l.lineAmount, 0))

  const pr = await db.purchaseReturn.create({
    data: {
      supplierId: data.supplierId,
      returnDate: new Date(data.returnDate),
      periodMonth,
      reason: data.reason ?? null,
      creditAmount,
      createdById: user.id,
      lines: { create: lineData },
    },
  })

  await writeAudit({ userId: user.id, entity: 'PurchaseReturn', entityId: pr.id, action: 'CREATE' })
  revalidatePath('/inventory/purchase-returns')
  revalidatePath('/inventory/net-stock')
  revalidatePath('/payables')
  redirect('/inventory/purchase-returns')
}
