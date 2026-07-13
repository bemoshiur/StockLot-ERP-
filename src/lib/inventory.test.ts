import { expect, test } from 'vitest'
import { aggregateStock } from './inventory'

test('closing = received - sold, flags negative stock', () => {
  const received = [
    { styleId: 'a', quantity: 100 },
    { styleId: 'a', quantity: 40 },
    { styleId: 'b', quantity: 10 },
  ]
  const sold = [
    { styleId: 'a', quantity: 30 },
    { styleId: 'b', quantity: 25 }, // more sold than received -> negative
    { styleId: 'c', quantity: 5 }, // sold, never received -> negative
  ]
  const m = aggregateStock(received, sold)

  expect(m.get('a')).toEqual({ received: 140, sold: 30, closing: 110, negative: false })
  expect(m.get('b')).toEqual({ received: 10, sold: 25, closing: -15, negative: true })
  expect(m.get('c')).toEqual({ received: 0, sold: 5, closing: -5, negative: true })
})
