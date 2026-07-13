export const metadata = { title: 'Offline — StockLot ERP' }

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--page)] p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">S</div>
      <h1 className="text-lg font-semibold text-zinc-900">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        StockLot ERP needs a connection to load live data. Check your network and try again — your work is safe on the server.
      </p>
    </div>
  )
}
