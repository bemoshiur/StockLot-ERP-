import { ImageResponse } from 'next/og'

// Maskable PWA icon rendered at the requested size (?size=192|512).
// Full-bleed brand background keeps it safe inside any mask shape.
export function GET(req: Request) {
  const url = new URL(req.url)
  const size = Math.min(1024, Math.max(48, Number(url.searchParams.get('size')) || 512))
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#006FEE',
          color: 'white',
          fontSize: size * 0.5,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        S
      </div>
    ),
    { width: size, height: size },
  )
}
