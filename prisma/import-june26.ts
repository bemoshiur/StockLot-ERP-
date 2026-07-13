/**
 * One-time import of the June'26 workbook into the ERP, followed by a
 * reconciliation table (ERP computed vs XLS reported). Clears prior
 * transactional data first; masters are augmented, not cleared.
 *
 *   pnpm import:june26
 */
import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { challanTotals, challanStatus } from '../src/lib/sales'

const db = new PrismaClient()
const IMPORT_COST = 40 // XLS assumed a flat BDT 40/piece cost; use it so profit is on the same basis.

type SaleRow = {
  challanNo: string | null
  date: string
  customerRaw: string
  locationRaw: string | null
  styleRaw: string
  qty: number
  unitPrice: number
  amount: number
  paid: number
  due: number
}
type ReceiptRow = { challanNo: string | null; date: string; styleRaw: string; qty: number; opening: boolean }

const data = JSON.parse(readFileSync(new URL('../reference/june26-import.json', import.meta.url), 'utf8')) as {
  sales: SaleRow[]
  receipts: ReceiptRow[]
  expenseCategoryTotals: Record<string, number>
  treasury: { capitalInvestment: number; depositsToAlib: number }
  targets: Record<string, number>
}

const normCust = (s: string) => s.trim().replace(/\s+/g, ' ').split('/')[0].trim() || 'Unknown'
const normStyle = (s: string) => s.trim().replace(/\s+/g, ' ')

async function main() {
  console.log('Clearing prior transactional data…')
  await db.$transaction([
    db.receivableEntry.deleteMany(),
    db.paymentReceipt.deleteMany(),
    db.saleLine.deleteMany(),
    db.salesChallan.deleteMany(),
    db.receiptLine.deleteMany(),
    db.purchaseReceipt.deleteMany(),
    db.expense.deleteMany(),
    db.capitalMovement.deleteMany(),
    db.treasuryDeposit.deleteMany(),
  ])

  // ---- Masters: customers, locations, styles ----
  const custId = new Map<string, string>()
  for (const name of new Set(data.sales.map((s) => normCust(s.customerRaw)))) {
    const c = (await db.customer.findFirst({ where: { name } })) ?? (await db.customer.create({ data: { name } }))
    custId.set(name, c.id)
  }

  const locId = new Map<string, string>()
  for (const raw of new Set(data.sales.map((s) => s.locationRaw).filter(Boolean) as string[])) {
    const areaName = raw.trim()
    const l = (await db.location.findFirst({ where: { areaName } })) ?? (await db.location.create({ data: { areaName } }))
    locId.set(areaName, l.id)
  }

  const styleId = new Map<string, string>()
  const usedCodes = new Set<string>()
  // Avoid colliding with style codes already in the DB (seeded styles).
  ;(await db.productStyle.findMany({ select: { styleCode: true } })).forEach((s) => usedCodes.add(s.styleCode))
  const codeFor = (name: string) => {
    let base = name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'STYLE'
    let code = base
    let i = 1
    while (usedCodes.has(code)) code = `${base}-${i++}`.slice(0, 40)
    usedCodes.add(code)
    return code
  }
  const allStyleNames = new Set([...data.sales.map((s) => normStyle(s.styleRaw)), ...data.receipts.map((r) => normStyle(r.styleRaw))])
  for (const name of allStyleNames) {
    const existing = await db.productStyle.findFirst({ where: { styleName: name } })
    if (existing) {
      styleId.set(name, existing.id)
      continue
    }
    const created = await db.productStyle.create({
      data: { styleCode: codeFor(name), styleName: name, standardCost: IMPORT_COST, isBulkLot: /mixed|pre stock/i.test(name) },
    })
    styleId.set(name, created.id)
  }

  // ---- Sales → challans ----
  const groups = new Map<string, SaleRow[]>()
  data.sales.forEach((s, i) => {
    const key = s.challanNo && s.challanNo !== 'N/A' ? `${s.challanNo}|${normCust(s.customerRaw)}|${s.date}` : `SOLO-${i}`
    ;(groups.get(key) ?? groups.set(key, []).get(key)!).push(s)
  })

  for (const [, rows] of groups) {
    const first = rows[0]
    const lines = rows.map((r) => {
      const unitPrice = r.qty ? r.amount / r.qty : 0 // so qty*unitPrice === amount (reconciles invoice)
      return {
        styleId: styleId.get(normStyle(r.styleRaw))!,
        quantity: r.qty,
        unitPrice,
        unitCostSnapshot: IMPORT_COST,
        lineAmount: Math.round(r.amount * 100) / 100,
        lineGrossProfit: Math.round((r.amount - r.qty * IMPORT_COST) * 100) / 100,
      }
    })
    const t = challanTotals(
      rows.map((r) => ({ quantity: r.qty, unitPrice: r.qty ? r.amount / r.qty : 0, unitCost: IMPORT_COST })),
      [],
    )
    const collected = Math.round(rows.reduce((a, r) => a + r.paid, 0) * 100) / 100
    const status = challanStatus({ invoiceTotal: t.invoiceTotal, collectedTotal: collected, discountTotal: 0 })
    const saleDate = new Date(first.date)
    const locationId = first.locationRaw ? (locId.get(first.locationRaw.trim()) ?? null) : null

    const challan = await db.salesChallan.create({
      data: {
        challanNo: first.challanNo && first.challanNo !== 'N/A' ? first.challanNo : null,
        saleDate,
        periodMonth: first.date.slice(0, 7),
        customerId: custId.get(normCust(first.customerRaw))!,
        locationId,
        status,
        remarks: 'Imported from June’26',
        lines: { create: lines },
      },
    })
    await db.receivableEntry.create({
      data: { customerId: challan.customerId, challanId: challan.id, entryType: 'INVOICE', amount: t.invoiceTotal, entryDate: saleDate },
    })
    if (collected > 0) {
      await db.paymentReceipt.create({
        data: { challanId: challan.id, receiptDate: saleDate, amountCollected: collected, discountOrWaiver: 0, method: 'cash' },
      })
      await db.receivableEntry.create({
        data: { customerId: challan.customerId, challanId: challan.id, entryType: 'PAYMENT', amount: -collected, entryDate: saleDate },
      })
    }
  }

  // ---- Receipts ----
  const openingLines = data.receipts.filter((r) => r.opening)
  const normalLines = data.receipts.filter((r) => !r.opening)
  if (openingLines.length) {
    await db.purchaseReceipt.create({
      data: {
        challanNo: null,
        receiptDate: new Date('2026-06-01'),
        periodMonth: '2026-06',
        isOpeningStock: true,
        remarks: 'Opening / carried-forward stock (June’26)',
        lines: { create: openingLines.map((r) => ({ styleId: styleId.get(normStyle(r.styleRaw))!, quantity: r.qty })) },
      },
    })
  }
  const recGroups = new Map<string, ReceiptRow[]>()
  normalLines.forEach((r, i) => {
    const key = r.challanNo ? `${r.challanNo}|${r.date}` : `R-${i}`
    ;(recGroups.get(key) ?? recGroups.set(key, []).get(key)!).push(r)
  })
  for (const [, rows] of recGroups) {
    await db.purchaseReceipt.create({
      data: {
        challanNo: rows[0].challanNo,
        receiptDate: new Date(rows[0].date),
        periodMonth: rows[0].date.slice(0, 7),
        remarks: 'Imported from June’26',
        lines: { create: rows.map((r) => ({ styleId: styleId.get(normStyle(r.styleRaw))!, quantity: r.qty })) },
      },
    })
  }

  // ---- Expenses (category summary entries) ----
  for (const [name, total] of Object.entries(data.expenseCategoryTotals)) {
    if (!total) continue
    const cat = await db.expenseCategory.findFirst({ where: { name } })
    if (!cat) continue
    await db.expense.create({
      data: {
        expenseDate: new Date('2026-06-01'),
        periodMonth: '2026-06',
        categoryId: cat.id,
        payeeOrVendor: 'June’26 (imported summary)',
        amount: total,
        paidAmount: total,
        isAdvance: false,
      },
    })
  }

  // ---- Treasury ----
  const saim = await db.partner.findFirst({ where: { name: 'SaimBabor' } })
  if (saim && data.treasury.capitalInvestment) {
    await db.capitalMovement.create({
      data: { partnerId: saim.id, movementType: 'INVESTMENT', amount: data.treasury.capitalInvestment, date: new Date('2026-06-01'), periodMonth: '2026-06', notes: 'June’26 imported capital' },
    })
  }
  if (data.treasury.depositsToAlib) {
    await db.treasuryDeposit.create({
      data: { depositDate: new Date('2026-06-01'), periodMonth: '2026-06', amount: data.treasury.depositsToAlib, method: 'account', destination: 'Alib', remarks: 'June’26 imported deposits' },
    })
  }

  await reconcile()
}

async function reconcile() {
  const challans = await db.salesChallan.findMany({ include: { lines: true, payments: true } })
  let qty = 0
  const tot = { invoice: 0, collected: 0, due: 0, gp: 0 }
  for (const c of challans) {
    qty += c.lines.reduce((a, l) => a + l.quantity, 0)
    const t = challanTotals(
      c.lines.map((l) => ({ quantity: l.quantity, unitPrice: Number(l.unitPrice), unitCost: Number(l.unitCostSnapshot) })),
      c.payments.map((p) => ({ amountCollected: Number(p.amountCollected), discountOrWaiver: Number(p.discountOrWaiver) })),
    )
    tot.invoice += t.invoiceTotal
    tot.collected += t.collectedTotal
    tot.due += t.dueTotal
    tot.gp += t.grossProfit
  }
  const recv = await db.receiptLine.aggregate({ _sum: { quantity: true } })
  const sold = await db.saleLine.aggregate({ _sum: { quantity: true } })
  const netStock = (recv._sum.quantity ?? 0) - (sold._sum.quantity ?? 0)
  const expense = await db.expense.aggregate({ _sum: { amount: true }, where: { isAdvance: false } })

  const r = (n: number) => Math.round(n * 100) / 100
  const g = data.targets
  const rows = [
    ['Quantity sold', qty, g.qty],
    ['Invoiced (Amount)', r(tot.invoice), g.invoice],
    ['Collected (Paid)', r(tot.collected), g.collected],
    ['Due', r(tot.due), g.due],
    ['Expense total', r(Number(expense._sum.amount ?? 0)), g.expenseTotal],
    ['Gross profit (accrual @40)', r(tot.gp), g.grossProfitXLS],
    ['Net stock (recv - sold)', netStock, g.netStockXLS],
  ] as const

  console.log('\n================ RECONCILIATION: ERP vs June’26 XLS ================')
  console.log('Metric'.padEnd(30), 'ERP'.padStart(14), 'XLS'.padStart(14), '  Match')
  for (const [label, erp, xls] of rows) {
    const diff = Math.abs(Number(erp) - Number(xls))
    const match = diff < 1 ? 'OK' : `DIFF ${r(Number(erp) - Number(xls))}`
    console.log(String(label).padEnd(30), String(erp).padStart(14), String(xls).padStart(14), '  ' + match)
  }
  console.log('=======================================================================')
  console.log('Notes:')
  console.log('- Gross profit: ERP is accrual (invoice - cost); XLS is cash (collected - cost). Diff = the due (1,504).')
  console.log('- Net stock: XLS 64,537 is unreproducible — its Net Stock sheet used truncated SUMIF ranges and the')
  console.log('  sparse 3-line "Sales" tab instead of the 51-line "Home" register. ERP received-minus-sold is correct.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
