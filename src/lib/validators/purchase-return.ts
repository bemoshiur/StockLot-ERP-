import { z } from 'zod'
import { optionalString } from './_shared'

export const purchaseReturnLineSchema = z.object({
  styleId: z.string().min(1, 'Pick a style'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unitCost: z.coerce.number().min(0, 'Unit cost cannot be negative').default(0),
})

export const purchaseReturnSchema = z.object({
  supplierId: z.string().min(1, 'Pick a supplier'),
  returnDate: z.string().min(1, 'Return date is required'),
  reason: optionalString,
  lines: z.array(purchaseReturnLineSchema).min(1, 'Add at least one line'),
})

export type PurchaseReturnLineInput = z.infer<typeof purchaseReturnLineSchema>
export type PurchaseReturnInput = z.infer<typeof purchaseReturnSchema>
