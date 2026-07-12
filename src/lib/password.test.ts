import { expect, test } from 'vitest'
import { hashPassword, verifyPassword } from './password'

test('hash then verify roundtrips', async () => {
  const h = await hashPassword('secret123')
  expect(h).not.toBe('secret123')
  expect(await verifyPassword('secret123', h)).toBe(true)
  expect(await verifyPassword('wrong', h)).toBe(false)
})
