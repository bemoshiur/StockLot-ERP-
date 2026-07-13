import { z } from 'zod'
import { optionalString } from './_shared'

export const returnLineSchema = z.object({
  styleId: z.string().min(1),
  quantity: z.coerce.number().int().min(0),
})

export const returnSchema = z.object({
  reason: optionalString,
  returnDate: z.string().min(1, 'Return date is required'),
  lines: z.array(returnLineSchema).min(1, 'Add at least one line'),
})

export type ReturnInput = z.infer<typeof returnSchema>
