import { expect, test } from 'vitest'
import { styleSchema } from './style'

test('requires code and name', () => {
  expect(styleSchema.safeParse({ styleCode: '', styleName: 'x', standardCost: 1 }).success).toBe(false)
  expect(styleSchema.safeParse({ styleCode: 'TS-01', styleName: '', standardCost: 1 }).success).toBe(false)
})

test('standard cost must be >= 0 and coerces strings', () => {
  expect(styleSchema.safeParse({ styleCode: 'TS-01', styleName: 'Mens T-Shirt', standardCost: -1 }).success).toBe(false)
  const ok = styleSchema.safeParse({ styleCode: 'TS-01', styleName: 'Mens T-Shirt', standardCost: '40' })
  expect(ok.success).toBe(true)
  if (ok.success) expect(ok.data.standardCost).toBe(40)
})

test('rejects invalid enum values', () => {
  expect(
    styleSchema.safeParse({ styleCode: 'TS-01', styleName: 'x', standardCost: 1, genderAgeGroup: 'Alien' }).success,
  ).toBe(false)
})
