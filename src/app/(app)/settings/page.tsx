import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { PageHeader } from '@/components/ui'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  await requireCan('settings.manage')
  const settings = (await db.companySettings.findUnique({ where: { id: 'singleton' } })) ?? {
    name: 'StockLot ERP',
    address: null,
    phone: null,
    email: null,
    tinBin: null,
    footerNote: null,
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Company settings" />
      <SettingsForm values={settings} />
    </div>
  )
}
