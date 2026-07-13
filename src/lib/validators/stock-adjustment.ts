import { z } from 'zod'
import { optionalString } from './_shared'

export const ADJUSTMENT_REASONS = ['COUNT', 'DAMAGE', 'LOSS', 'FOUND', 'OTHER'] as const
export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number]

export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReason, string> = {
  COUNT: 'Count correction',
  DAMAGE: 'Damaged / written off',
  LOSS: 'Lost / shortage',
  FOUND: 'Found / surplus',
  OTHER: 'Other',
}

export const stockAdjustmentSchema = z
  .object({
    styleId: z.string().min(1, 'Pick a style'),
    adjustmentDate: z.string().min(1, 'Date is required'),
    quantity: z.coerce.number().int('Quantity must be a whole number'),
    reason: z.enum(ADJUSTMENT_REASONS),
    note: optionalString,
  })
  .refine((v) => v.quantity !== 0, { message: 'Quantity cannot be zero', path: ['quantity'] })

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>
