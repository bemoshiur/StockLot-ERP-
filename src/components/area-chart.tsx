/** Lightweight dependency-free area chart (SVG). Renders a gradient area + line
 *  over evenly-spaced points, with a few horizontal gridlines and end labels. */
export function AreaChart({
  data,
  height = 220,
  color = 'var(--color-primary)',
  valuePrefix = '',
}: {
  data: { label: string; value: number }[]
  height?: number
  color?: string
  valuePrefix?: string
}) {
  const width = 720
  const padX = 8
  const padY = 16
  const max = Math.max(1, ...data.map((d) => d.value))
  const n = data.length
  const x = (i: number) => padX + (i * (width - padX * 2)) / Math.max(1, n - 1)
  const y = (v: number) => padY + (1 - v / max) * (height - padY * 2)

  const id = 'ac' + Math.round(max) + n
  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ')
  const areaPts = `${padX},${height - padY} ${linePts} ${width - padX},${height - padY}`
  const gridY = [0.25, 0.5, 0.75].map((f) => padY + f * (height - padY * 2))

  if (n === 0) return <div className="p-8 text-center text-sm text-zinc-400">No data for this period.</div>

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((gy, i) => (
        <line key={i} x1={padX} x2={width - padX} y1={gy} y2={gy} stroke="#f1f1f4" strokeWidth={1} />
      ))}
      <polygon points={areaPts} fill={`url(#${id})`} />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r={n > 40 ? 0 : 2.5} fill="#fff" stroke={color} strokeWidth={1.5} />
      ))}
      <text x={padX} y={height - 2} fontSize="11" fill="#a1a1aa">{data[0]?.label}</text>
      <text x={width - padX} y={height - 2} fontSize="11" fill="#a1a1aa" textAnchor="end">{data[n - 1]?.label}</text>
      <text x={padX} y={padY - 4} fontSize="11" fill="#a1a1aa">{valuePrefix}{max.toLocaleString('en-US')}</text>
    </svg>
  )
}
