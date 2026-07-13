import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Browser-tab favicon: a brand-blue rounded tile with an "S" monogram.
export default function Icon() {
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
          fontSize: 22,
          fontWeight: 700,
          borderRadius: 7,
        }}
      >
        S
      </div>
    ),
    size,
  )
}
