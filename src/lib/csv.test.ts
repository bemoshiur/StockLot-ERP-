import { expect, test } from 'vitest'
import { toCsv } from './csv'

const cols = [
  { key: 'name', label: 'Name' },
  { key: 'amount', label: 'Amount' },
]

test('first line is the labels', () => {
  const csv = toCsv([], cols)
  expect(csv).toBe('Name,Amount')
})

test('numbers pass through unquoted', () => {
  const csv = toCsv([{ name: 'Shirt', amount: 1250.5 }], cols)
  expect(csv).toBe('Name,Amount\nShirt,1250.5')
})

test('a value containing a comma is wrapped in quotes', () => {
  const csv = toCsv([{ name: 'Rahman, Sons', amount: 10 }], cols)
  expect(csv).toBe('Name,Amount\n"Rahman, Sons",10')
})

test('a value containing a quote is wrapped and internal quotes doubled', () => {
  const csv = toCsv([{ name: 'The "Big" Shop', amount: 10 }], cols)
  expect(csv).toBe('Name,Amount\n"The ""Big"" Shop",10')
})

test('a value containing a newline is wrapped in quotes', () => {
  const csv = toCsv([{ name: 'Line1\nLine2', amount: 10 }], cols)
  expect(csv).toBe('Name,Amount\n"Line1\nLine2",10')
})

test('missing keys render as empty cells', () => {
  const csv = toCsv([{ name: 'Only name' }], cols)
  expect(csv).toBe('Name,Amount\nOnly name,')
})

test('formula-injection text is neutralised with a leading quote', () => {
  expect(toCsv([{ name: '=cmd()', amount: 10 }], cols)).toBe("Name,Amount\n'=cmd(),10")
  expect(toCsv([{ name: '@SUM(A1)', amount: 10 }], cols)).toBe("Name,Amount\n'@SUM(A1),10")
})

test('negative numbers are NOT mistaken for formulas', () => {
  expect(toCsv([{ name: 'Loss', amount: -5000 }], cols)).toBe('Name,Amount\nLoss,-5000')
  expect(toCsv([{ name: 'x', amount: '-42.5' }], cols)).toBe('Name,Amount\nx,-42.5')
})
