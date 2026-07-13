import { z } from 'zod'
import { GENDER_GROUPS, SEASONS, GRADES } from '@/lib/enums'

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), z.enum(values).optional())

export const styleSchema = z.object({
  styleCode: z.string().trim().min(1, 'Style code is required'),
  styleName: z.string().trim().min(1, 'Style name is required'),
  genderAgeGroup: optionalEnum(GENDER_GROUPS),
  category: z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().optional()),
  seasonFlag: optionalEnum(SEASONS),
  grade: optionalEnum(GRADES),
  isBulkLot: z.coerce.boolean().default(false),
  standardCost: z.coerce.number().min(0, 'Cost cannot be negative'),
  reorderLevel: z.coerce.number().int('Reorder level must be a whole number').min(0, 'Reorder level cannot be negative').default(0),
})

export type StyleInput = z.infer<typeof styleSchema>
