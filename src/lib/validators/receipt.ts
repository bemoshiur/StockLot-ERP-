import { z } from 'zod'
import { optionalString } from './_shared'

export const receiptLineSchema = z.object({
  styleId: z.string().min(1, 'Pick a style'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  subCategoryNote: optionalString,
})

export const receiptSchema = z.object({
  supplierId: optionalString,
  receiptDate: z.string().min(1, 'Receipt date is required'),
  challanNo: optionalString,
  isOpeningStock: z.coerce.boolean().default(false),
  remarks: optionalString,
  lines: z.array(receiptLineSchema).min(1, 'Add at least one line'),
})

export type ReceiptLineInput = z.infer<typeof receiptLineSchema>
export type ReceiptInput = z.infer<typeof receiptSchema>
