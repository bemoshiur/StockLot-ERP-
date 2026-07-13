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

  expect(m.get('a')).toEqual({ received: 140, sold: 30, returned: 0, adjusted: 0, purchaseReturned: 0, closing: 110, negative: false })
  expect(m.get('b')).toEqual({ received: 10, sold: 25, returned: 0, adjusted: 0, purchaseReturned: 0, closing: -15, negative: true })
  expect(m.get('c')).toEqual({ received: 0, sold: 5, returned: 0, adjusted: 0, purchaseReturned: 0, closing: -5, negative: true })
})

test('returns add back to on-hand', () => {
  const m = aggregateStock(
    [{ styleId: 'a', quantity: 100 }],
    [{ styleId: 'a', quantity: 40 }],
    [{ styleId: 'a', quantity: 10 }], // 10 returned
  )
  expect(m.get('a')).toEqual({ received: 100, sold: 40, returned: 10, adjusted: 0, purchaseReturned: 0, closing: 70, negative: false })
})

test('stock adjustments add (positive) and remove (negative) from on-hand', () => {
  const m = aggregateStock(
    [{ styleId: 'a', quantity: 100 }],
    [{ styleId: 'a', quantity: 40 }],
    [],
    [
      { styleId: 'a', quantity: 5 }, // found 5 extra during count
      { styleId: 'a', quantity: -8 }, // 8 damaged
    ],
  )
  // 100 - 40 + (5 - 8) = 57
  expect(m.get('a')).toEqual({ received: 100, sold: 40, returned: 0, adjusted: -3, purchaseReturned: 0, closing: 57, negative: false })
})

test('purchase returns to supplier subtract from on-hand', () => {
  const m = aggregateStock(
    [{ styleId: 'a', quantity: 100 }],
    [{ styleId: 'a', quantity: 40 }],
    [],
    [],
    [{ styleId: 'a', quantity: 15 }], // 15 sent back to supplier
  )
  // 100 - 40 - 15 = 45
  expect(m.get('a')).toEqual({ received: 100, sold: 40, returned: 0, adjusted: 0, purchaseReturned: 15, closing: 45, negative: false })
})

test('all movement types combine into closing = received - sold + returned + adjusted - purchaseReturned', () => {
  const m = aggregateStock(
    [{ styleId: 'a', quantity: 200 }],
    [{ styleId: 'a', quantity: 60 }],
    [{ styleId: 'a', quantity: 10 }],
    [{ styleId: 'a', quantity: -4 }],
    [{ styleId: 'a', quantity: 25 }],
  )
  // 200 - 60 + 10 - 4 - 25 = 121
  expect(m.get('a')).toEqual({ received: 200, sold: 60, returned: 10, adjusted: -4, purchaseReturned: 25, closing: 121, negative: false })
})
