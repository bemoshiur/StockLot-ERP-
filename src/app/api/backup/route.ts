import { auth } from '@/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/rbac'

/** Full database export for off-site backup. Owner/Admin only.
 *  Password hashes are redacted — after a restore, users reset their passwords. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.role) return new Response('Unauthorized', { status: 401 })
  if (!can(session.user.role, 'settings.manage')) return new Response('Forbidden', { status: 403 })

  const [
    companySettings, appUsers, productStyles, styleAliases, customers, suppliers, locations,
    salesChallans, saleLines, paymentReceipts, receivableEntries, salesReturns, returnLines,
    supplierPayments, periods, stockAdjustments, purchaseReturns, purchaseReturnLines,
    purchaseReceipts, receiptLines, expenseCategories, expenses, partners, capitalMovements,
    treasuryDeposits,
  ] = await Promise.all([
    db.companySettings.findMany(),
    db.appUser.findMany({ select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, updatedAt: true } }),
    db.productStyle.findMany(),
    db.styleAlias.findMany(),
    db.customer.findMany(),
    db.supplier.findMany(),
    db.location.findMany(),
    db.salesChallan.findMany(),
    db.saleLine.findMany(),
    db.paymentReceipt.findMany(),
    db.receivableEntry.findMany(),
    db.salesReturn.findMany(),
    db.returnLine.findMany(),
    db.supplierPayment.findMany(),
    db.period.findMany(),
    db.stockAdjustment.findMany(),
    db.purchaseReturn.findMany(),
    db.purchaseReturnLine.findMany(),
    db.purchaseReceipt.findMany(),
    db.receiptLine.findMany(),
    db.expenseCategory.findMany(),
    db.expense.findMany(),
    db.partner.findMany(),
    db.capitalMovement.findMany(),
    db.treasuryDeposit.findMany(),
  ])

  const data = {
    companySettings, appUsers, productStyles, styleAliases, customers, suppliers, locations,
    salesChallans, saleLines, paymentReceipts, receivableEntries, salesReturns, returnLines,
    supplierPayments, periods, stockAdjustments, purchaseReturns, purchaseReturnLines,
    purchaseReceipts, receiptLines, expenseCategories, expenses, partners, capitalMovements,
    treasuryDeposits,
  }
  const counts = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, (v as unknown[]).length]))

  const payload = {
    meta: {
      app: 'StockLot ERP',
      exportedAt: new Date().toISOString(),
      exportedBy: session.user.email ?? session.user.id ?? null,
      note: 'Password hashes are redacted; users reset passwords after a restore.',
      counts,
    },
    data,
  }

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="stocklot-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
