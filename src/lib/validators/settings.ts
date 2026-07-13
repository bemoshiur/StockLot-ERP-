import { z } from 'zod'
import { optionalString } from './_shared'

export const settingsSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required'),
  address: optionalString,
  phone: optionalString,
  email: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.string().trim().email('Enter a valid email').optional(),
  ),
  tinBin: optionalString,
  footerNote: optionalString,
})

export type SettingsInput = z.infer<typeof settingsSchema>
