import { auth } from '@/auth'
import { db } from '@/lib/db'
import { can, type Action } from '@/lib/rbac'
import { toCsv, type CsvColumn } from '@/lib/csv'
import { challanTotals, roundMoney } from '@/lib/sales'
import { agingBuckets } from '@/lib/aging'
import { computeNetStockAgg, activeChallanFilter } from '@/lib/queries'

type Row = Record<string, string | number>
type Dataset = { perm: Action; columns: CsvColumn[]; rows: () => Promise<Row[]> }

const isoDate = (d: Date): string => d.toISOString().slice(0, 10)

const DATASETS: Record<string, Dataset> = {
  sales: {
    perm: 'sales.read',
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'challanNo', label: 'Challan' },
      { key: 'customer', label: 'Customer' },
      { key: 'invoice', label: 'Invoice' },
      { key: 'collected', label: 'Collected' },
      { key: 'discount', label: 'Discount' },
      { key: 'due', label: 'Due' },
      { key: 'status', label: 'Status' },
    ],
    rows: async () => {
      const challans = await db.salesChallan.findMany({
        orderBy: [{ saleDate: 'desc' }, { createdAt: 'desc' }],
        include: { customer: true, lines: true, payments: true },
        take: 200,
      })
      return challans.map((c) => {
        const t = challanTotals(
          c.lines.map((l) => ({ quantity: l.quantity, unitPrice: Number(l.unitPrice), unitCost: Number(l.unitCostSnapshot) })),
          c.payments.map((p) => ({ amountCollected: Number(p.amountCollected), discountOrWaiver: Number(p.discountOrWaiver) })),
        )
        return {
          date: isoDate(c.saleDate),
          challanNo: c.challanNo ?? '',
          customer: c.customer.name,
          invoice: t.invoiceTotal,
          collected: t.collectedTotal,
          discount: t.discountTotal,
          due: t.dueTotal,
          status: c.status,
        }
      })
    },
  },

  dues: {
    perm: 'sales.read',
    columns: [
      { key: 'customer', label: 'Customer' },
      { key: 'current', label: 'Current' },
      { key: 'd1_30', label: '1-30d' },
      { key: 'd31_60', label: '31-60d' },
      { key: 'd60plus', label: '60d+' },
      { key: 'total', label: 'Total' },
    ],
    rows: async () => {
      const asOf = new Date()
      const customers = await db.customer.findMany({
        where: { active: true },
        include: { challans: { where: activeChallanFilter, include: { lines: true, payments: true } } },
      })
      return customers
        .map((cust) => {
          const opening = Number(cust.openingDueBalance)
          const challanDues = cust.challans.map((c) => ({
            saleDate: c.saleDate,
            due: challanTotals(
              c.lines.map((l) => ({ quantity: l.quantity, unitPrice: Number(l.unitPrice), unitCost: Number(l.unitCostSnapshot) })),
              c.payments.map((p) => ({ amountCollected: Number(p.amountCollected), discountOrWaiver: Number(p.discountOrWaiver) })),
            ).dueTotal,
          }))
          const agingItems = [...challanDues]
          if (opening > 0) agingItems.push({ saleDate: new Date(0), due: opening })
          const b = agingBuckets(agingItems, asOf)
          return { name: cust.name, b }
        })
        .filter((r) => r.b.total > 0)
        .sort((a, b) => b.b.total - a.b.total)
        .map((r) => ({
          customer: r.name,
          current: r.b.current,
          d1_30: r.b.d1_30,
          d31_60: r.b.d31_60,
          d60plus: r.b.d60plus,
          total: r.b.total,
        }))
    },
  },

  netstock: {
    perm: 'inventory.read',
    columns: [
      { key: 'styleCode', label: 'Style code' },
      { key: 'styleName', label: 'Style name' },
      { key: 'received', label: 'Received' },
      { key: 'sold', label: 'Sold' },
      { key: 'onHand', label: 'On hand' },
    ],
    rows: async () => {
      const agg = await computeNetStockAgg()
      const movedIds = [...agg.keys()]
      const styles = await db.productStyle.findMany({
        where: { OR: [{ active: true }, { id: { in: movedIds } }] },
        select: { id: true, styleCode: true, styleName: true },
      })
      return styles
        .map((s) => {
          const a = agg.get(s.id) ?? { received: 0, sold: 0, returned: 0, closing: 0, negative: false }
          return { styleCode: s.styleCode, styleName: s.styleName, received: a.received, sold: a.sold, onHand: a.closing }
        })
        .sort((x, y) => y.onHand - x.onHand)
    },
  },

  expenses: {
    perm: 'expenses.read',
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'category', label: 'Category' },
      { key: 'payee', label: 'Payee' },
      { key: 'amount', label: 'Amount' },
      { key: 'paid', label: 'Paid' },
      { key: 'isAdvance', label: 'Is advance' },
    ],
    rows: async () => {
      const expenses = await db.expense.findMany({
        orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
        take: 300,
        include: { category: true },
      })
      return expenses.map((e) => ({
        date: isoDate(e.expenseDate),
        category: e.category.name,
        payee: e.payeeOrVendor ?? '',
        amount: roundMoney(Number(e.amount)),
        paid: roundMoney(Number(e.paidAmount)),
        isAdvance: String(e.isAdvance),
      }))
    },
  },

  customers: {
    perm: 'customers.write',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'location', label: 'Location' },
      { key: 'openingDue', label: 'Opening due' },
      { key: 'active', label: 'Active' },
    ],
    rows: async () => {
      const customers = await db.customer.findMany({
        orderBy: [{ active: 'desc' }, { name: 'asc' }],
        include: { location: true },
      })
      return customers.map((c) => ({
        name: c.name,
        phone: c.phone ?? '',
        location: c.location?.areaName ?? '',
        openingDue: roundMoney(Number(c.openingDueBalance)),
        active: String(c.active),
      }))
    },
  },

  styles: {
    perm: 'styles.write',
    columns: [
      { key: 'styleCode', label: 'Style code' },
      { key: 'styleName', label: 'Style name' },
      { key: 'genderAgeGroup', label: 'Group' },
      { key: 'category', label: 'Category' },
      { key: 'standardCost', label: 'Standard cost' },
      { key: 'active', label: 'Active' },
    ],
    rows: async () => {
      const styles = await db.productStyle.findMany({
        orderBy: [{ active: 'desc' }, { styleName: 'asc' }],
      })
      return styles.map((s) => ({
        styleCode: s.styleCode,
        styleName: s.styleName,
        genderAgeGroup: s.genderAgeGroup ?? '',
        category: s.category ?? '',
        standardCost: roundMoney(Number(s.standardCost)),
        active: String(s.active),
      }))
    },
  },

  receipts: {
    perm: 'inventory.read',
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'challanNo', label: 'Challan' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'totalQty', label: 'Total qty' },
    ],
    rows: async () => {
      const receipts = await db.purchaseReceipt.findMany({
        orderBy: [{ receiptDate: 'desc' }, { createdAt: 'desc' }],
        include: { supplier: true, lines: { select: { quantity: true } } },
        take: 200,
      })
      return receipts.map((r) => ({
        date: isoDate(r.receiptDate),
        challanNo: r.challanNo ?? '',
        supplier: r.supplier?.name ?? '',
        totalQty: r.lines.reduce((a, l) => a + l.quantity, 0),
      }))
    },
  },
}

export async function GET(_req: Request, { params }: { params: Promise<{ dataset: string }> }) {
  const session = await auth()
  if (!session?.user?.role) return new Response('Unauthorized', { status: 401 })

  const { dataset } = await params
  const def = DATASETS[dataset]
  if (!def) return new Response('Not found', { status: 404 })
  if (!can(session.user.role, def.perm)) return new Response('Forbidden', { status: 403 })

  const csv = toCsv(await def.rows(), def.columns)
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${dataset}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
