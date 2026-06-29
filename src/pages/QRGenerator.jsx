import { useState, useRef } from 'react'

const CHANNELS = ['WHS', 'PND', 'TLS']
const POSM_TYPES = [
  { key: 'FRIDGE',    label: 'Fridge Sticker' },
  { key: 'POSTER',    label: 'Poster A3' },
  { key: 'TENTCARD',  label: 'Tent Card' },
  { key: 'DUMPBIN',   label: 'Dumpbin' },
  { key: 'SUNBLIND',  label: 'Sunblind' },
  { key: 'BOTTLECUT', label: 'Bottle Cut Out' },
]

const BASE_URL = 'https://kawan-senja.vercel.app'
const CHANNEL_COLORS = { WHS: '#8F573A', PND: '#FF585D', TLS: '#E8A045' }
const CHANNEL_BG = { WHS: '#f5ede7', PND: '#fff0f0', TLS: '#fff8ee' }

function QRCodeSVG({ value, size = 160 }) {
  // Simple QR display using Google Charts API
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&color=2C1810&bgcolor=FDF6F0&margin=10`
  return (
    <img
      src={url}
      alt={value}
      width={size}
      height={size}
      style={{ borderRadius: 8, display: 'block' }}
    />
  )
}

export default function QRGenerator() {
  const [selectedChannel, setSelectedChannel] = useState('ALL')
  const [downloading, setDownloading] = useState(null)

  const allQRs = CHANNELS.flatMap(ch =>
    POSM_TYPES.map(posm => ({
      qr_id: `${ch}-${posm.key}`,
      channel: ch,
      posm_type: posm.label,
      posm_key: posm.key,
      url: `${BASE_URL}/?qr=${ch}-${posm.key}`,
      label: `${ch} — ${posm.label}`,
    }))
  )

  const filtered = selectedChannel === 'ALL'
    ? allQRs
    : allQRs.filter(q => q.channel === selectedChannel)

  async function downloadSingle(qr) {
    setDownloading(qr.qr_id)
    try {
      const imgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr.url)}&color=2C1810&bgcolor=FDF6F0&margin=20`
      const res = await fetch(imgUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `QR_KawanSenja_${qr.qr_id}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Download gagal. Coba lagi.') }
    setDownloading(null)
  }

  async function downloadAll() {
    setDownloading('ALL')
    for (const qr of filtered) {
      await downloadSingle(qr)
      await new Promise(r => setTimeout(r, 500))
    }
    setDownloading(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0e8e0', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#8F573A,#FF585D)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>QR Generator — Kawan Senja</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{allQRs.length} QR codes total · 3 channel · 6 POSM types</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/admin" style={{ padding: '8px 14px', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.4)', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>
              ← Dashboard
            </a>
            <button
              onClick={downloadAll}
              disabled={downloading === 'ALL'}
              style={{ padding: '8px 14px', background: '#fff', border: 'none', borderRadius: 8, color: '#8F573A', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {downloading === 'ALL' ? 'Downloading...' : `⬇️ Download ${filtered.length} QR`}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>

        {/* CHANNEL FILTER */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {['ALL', ...CHANNELS].map(ch => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(ch)}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: selectedChannel === ch ? 500 : 400,
                background: selectedChannel === ch
                  ? (ch === 'ALL' ? '#2C1810' : CHANNEL_COLORS[ch])
                  : '#fff',
                color: selectedChannel === ch ? '#fff' : '#8B6555',
                fontFamily: 'inherit',
              }}
            >
              {ch === 'ALL' ? `Semua (${allQRs.length})` : `${ch} (${allQRs.filter(q => q.channel === ch).length})`}
            </button>
          ))}
        </div>

        {/* QR GRID — grouped by channel */}
        {(selectedChannel === 'ALL' ? CHANNELS : [selectedChannel]).map(ch => (
          <div key={ch} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, background: CHANNEL_COLORS[ch], borderRadius: 2 }} />
              <h2 style={{ fontSize: 16, fontWeight: 500, color: '#2C1810' }}>
                {ch === 'WHS' ? 'WHS — Wholesale' : ch === 'PND' ? 'PND — Off Trade' : 'TLS — Off Trade'}
              </h2>
              <span style={{ fontSize: 12, color: '#8B6555' }}>6 QR codes</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
              {filtered.filter(q => q.channel === ch).map(qr => (
                <div
                  key={qr.qr_id}
                  style={{
                    background: '#fff',
                    border: `0.5px solid ${CHANNEL_COLORS[ch]}40`,
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {/* Channel + POSM badge */}
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: CHANNEL_BG[ch], color: CHANNEL_COLORS[ch] }}>
                      {qr.channel}
                    </span>
                    <span style={{ fontSize: 10, color: '#8B6555', fontFamily: 'monospace' }}>{qr.qr_id}</span>
                  </div>

                  {/* QR Code */}
                  <QRCodeSVG value={qr.url} size={140} />

                  {/* POSM Label */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#2C1810', marginBottom: 2 }}>{qr.posm_type}</div>
                    <div style={{ fontSize: 10, color: '#8B6555', wordBreak: 'break-all', lineHeight: 1.4 }}>{qr.url}</div>
                  </div>

                  {/* Download button */}
                  <button
                    onClick={() => downloadSingle(qr)}
                    disabled={downloading === qr.qr_id}
                    style={{
                      width: '100%', padding: '8px', background: CHANNEL_BG[ch],
                      border: `0.5px solid ${CHANNEL_COLORS[ch]}`,
                      borderRadius: 8, fontSize: 12, color: CHANNEL_COLORS[ch],
                      fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {downloading === qr.qr_id ? 'Downloading...' : '⬇️ Download PNG'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
