'use server'

import * as XLSX from '@e965/xlsx'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireCan } from '@/lib/guards'
import { writeAudit } from '@/lib/audit'
import { customerSchema } from '@/lib/validators/customer'
import { styleSchema } from '@/lib/validators/style'

export type ImportResult = {
  error?: string
  summary?: {
    entity: string
    created: number
    skippedDuplicate: number
    errors: { row: number; message: string }[]
    previewOnly: boolean
  }
}

/** Lowercase and strip everything but a-z0-9 so headers match loosely. */
const normKey = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Build a lookup from normalized header -> raw cell value for one row. */
function rowLookup(row: Record<string, unknown>): (keys: string[]) => unknown {
  const map = new Map<string, unknown>()
  for (const [k, v] of Object.entries(row)) map.set(normKey(k), v)
  return (keys: string[]) => {
    for (const k of keys) {
      const v = map.get(normKey(k))
      if (v !== undefined && v !== '') return v
    }
    return undefined
  }
}

const str = (v: unknown): string => (v == null ? '' : String(v).trim())

export async function runImport(_prev: ImportResult | undefined, formData: FormData): Promise<ImportResult> {
  const entity = String(formData.get('entity') ?? '')
  const previewOnly = formData.get('previewOnly') === 'on'

  if (entity !== 'customers' && entity !== 'styles') return { error: 'Choose an entity to import' }

  const user = await requireCan(entity === 'customers' ? 'customers.write' : 'styles.write')

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Upload a .csv, .xlsx or .xls file' }
  if (file.size > 5 * 1024 * 1024) return { error: 'File is too large (max 5 MB)' }

  let rows: Record<string, unknown>[]
  try {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    if (!sheet) return { error: 'The file has no sheets' }
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[]
  } catch {
    return { error: 'Could not read the file. Make sure it is a valid CSV or Excel file.' }
  }

  if (rows.length === 0) return { error: 'The file has no data rows' }

  const errors: { row: number; message: string }[] = []
  let created = 0
  let skippedDuplicate = 0

  if (entity === 'customers') {
    // Resolve area names -> Location id (case-insensitive).
    const locations = await db.location.findMany({ select: { id: true, areaName: true } })
    const locByArea = new Map(locations.map((l) => [l.areaName.trim().toLowerCase(), l.id]))

    for (let i = 0; i < rows.length; i++) {
      const rowNo = i + 2 // header is row 1
      const get = rowLookup(rows[i])
      const areaName = str(get(['location', 'area', 'areaname']))
      const defaultLocationId = areaName ? (locByArea.get(areaName.toLowerCase()) ?? null) : null

      const parsed = customerSchema.safeParse({
        name: str(get(['name', 'customer', 'customername'])),
        phone: str(get(['phone'])),
        defaultLocationId: defaultLocationId ?? '',
        creditTerms: str(get(['creditterms'])),
        openingDueBalance: str(get(['openingduebalance', 'openingdue', 'due'])) || 0,
      })
      if (!parsed.success) {
        errors.push({ row: rowNo, message: parsed.error.issues[0]?.message ?? 'Invalid row' })
        continue
      }

      const dup = await db.customer.findFirst({ where: { name: parsed.data.name } })
      if (dup) {
        skippedDuplicate++
        continue
      }

      if (!previewOnly) {
        const c = await db.customer.create({
          data: { ...parsed.data, createdById: user.id, updatedById: user.id },
        })
        await writeAudit({ userId: user.id, entity: 'Customer', entityId: c.id, action: 'CREATE' })
      }
      created++ // counts as "would create" in preview, "created" when saved
    }
  } else {
    for (let i = 0; i < rows.length; i++) {
      const rowNo = i + 2
      const get = rowLookup(rows[i])

      const parsed = styleSchema.safeParse({
        styleCode: str(get(['stylecode', 'code'])),
        styleName: str(get(['stylename', 'name', 'style'])),
        genderAgeGroup: str(get(['genderagegroup', 'gender'])),
        category: str(get(['category'])),
        seasonFlag: str(get(['seasonflag', 'season'])),
        grade: str(get(['grade'])),
        standardCost: str(get(['standardcost', 'cost'])) || 0,
      })
      if (!parsed.success) {
        errors.push({ row: rowNo, message: parsed.error.issues[0]?.message ?? 'Invalid row' })
        continue
      }

      const dup = await db.productStyle.findUnique({ where: { styleCode: parsed.data.styleCode } })
      if (dup) {
        skippedDuplicate++
        continue
      }

      if (!previewOnly) {
        const s = await db.productStyle.create({
          data: { ...parsed.data, createdById: user.id, updatedById: user.id },
        })
        await writeAudit({ userId: user.id, entity: 'ProductStyle', entityId: s.id, action: 'CREATE' })
      }
      created++ // counts as "would create" in preview, "created" when saved
    }
  }

  if (!previewOnly && created > 0) {
    revalidatePath(entity === 'customers' ? '/customers' : '/styles')
  }

  return {
    summary: {
      entity: entity === 'customers' ? 'Customers' : 'Styles',
      created,
      skippedDuplicate,
      errors,
      previewOnly,
    },
  }
}
