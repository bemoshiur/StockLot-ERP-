export type CsvColumn = { key: string; label: string }

/** Escape a single field per RFC-4180 and neutralise spreadsheet formula
 *  injection: a text value starting with = + - @ (or tab/CR) is prefixed with
 *  a single quote so Excel/Sheets treats it as text, never a formula. Genuine
 *  numbers (including negatives like -5000) are left intact. */
function escapeField(value: string | number): string {
  let s = String(value)
  const isNumeric = typeof value === 'number' || /^-?\d+(\.\d+)?$/.test(s)
  if (!isNumeric && /^[=+\-@\t\r]/.test(s)) s = "'" + s
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

/** Serialise rows into an RFC-4180 CSV string. First line = column labels. */
export function toCsv(
  rows: Record<string, string | number>[],
  columns: CsvColumn[],
): string {
  const header = columns.map((c) => escapeField(c.label)).join(',')
  const body = rows.map((row) =>
    columns.map((c) => escapeField(row[c.key] ?? '')).join(','),
  )
  return [header, ...body].join('\n')
}
