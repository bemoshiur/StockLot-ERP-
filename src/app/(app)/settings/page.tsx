import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { PageHeader, Card } from '@/components/ui'
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
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Company settings" />
      <SettingsForm values={settings} />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-700">Backup</h2>
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-zinc-900">Download a full data backup</div>
              <p className="text-xs text-zinc-500">
                A JSON snapshot of every record (password hashes excluded). Keep it somewhere safe and off-site.
              </p>
            </div>
            <a
              href="/api/backup"
              className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600"
            >
              Download backup
            </a>
          </div>
        </Card>
      </div>
    </div>
  )
}
