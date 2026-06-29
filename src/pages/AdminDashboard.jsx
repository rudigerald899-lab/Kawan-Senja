import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase.js'
import TestingPanel from './TestingPanel.jsx'

const REFRESH_INTERVAL = 30000
const CHANNEL_COLORS = { WHS: '#8F573A', PND: '#FF585D', TLS: '#E8A045' }
const CHANNEL_BG = { WHS: '#f5ede7', PND: '#fff0f0', TLS: '#fff8ee' }
const POSM_ICONS = {
  'Fridge Sticker': '❄️', 'Poster A3': '📋', 'Tent Card': '🪧',
  'Dumpbin': '🗑️', 'Sunblind': '☀️', 'Bottle Cut Out': '🍺'
}

const NAV_ITEMS = [
  { key: 'overview', icon: '📊', label: 'Overview' },
  { key: 'channel', icon: '📡', label: 'Channel' },
  { key: 'posm', icon: '🖼️', label: 'POSM' },
  { key: 'klaim', icon: '🎁', label: 'Data Klaim' },
  { key: 'visitor', icon: '👥', label: 'Visitor' },
  { key: 'foto', icon: '📸', label: 'Foto POSM' },
  { key: 'stock', icon: '📦', label: 'Stok Hadiah' },
  { key: 'qr', icon: '⬛', label: 'QR Manager' },
  { key: 'testing', icon: '🔧', label: 'Testing' },
]

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, padding: '20px 24px', borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#8B6555', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 22 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 600, color: '#2C1810', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#8B6555', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#2C1810' }}>{children}</h2>
      {action}
    </div>
  )
}

function ExportBtn({ onClick, label = 'Export CSV' }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 16px', background: '#8F573A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
      ⬇️ {label}
    </button>
  )
}

export default function AdminDashboard() {
  const [claims, setClaims] = useState([])
  const [visits, setVisits] = useState([])
  const [stock, setStock] = useState([])
  const [qrCodes, setQrCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [claimsRes, visitsRes, stockRes, qrRes] = await Promise.all([
        supabase.from('ks_claims').select('*').order('created_at', { ascending: false }),
        supabase.from('ks_visits').select('*').order('visited_at', { ascending: false }),
        supabase.from('ks_stock').select('*'),
        supabase.from('ks_qr_codes').select('*').order('channel').order('posm_type'),
      ])
      if (claimsRes.data) setClaims(claimsRes.data)
      if (visitsRes.data) setVisits(visitsRes.data)
      if (stockRes.data) setStock(stockRes.data)
      if (qrRes.data) setQrCodes(qrRes.data)
      setLastUpdate(new Date())
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  const totalClaims = claims.length
  const totalVisits = visits.length
  const convRate = totalVisits > 0 ? ((totalClaims / totalVisits) * 100).toFixed(1) : 0
  const t1 = claims.filter(c => c.tier === 't1').length
  const t2 = claims.filter(c => c.tier === 't2').length
  const t3 = claims.filter(c => c.tier === 't3').length
  const withPhoto = claims.filter(c => c.foto_posm_url).length
  const pending = claims.filter(c => c.status === 'pending').length

  const channelStats = ['WHS', 'PND', 'TLS'].map(ch => ({
    channel: ch,
    scans: visits.filter(v => v.channel === ch).length,
    claims: claims.filter(c => c.channel === ch).length,
    conv: visits.filter(v => v.channel === ch).length > 0
      ? ((claims.filter(c => c.channel === ch).length / visits.filter(v => v.channel === ch).length) * 100).toFixed(1) : '0.0',
  }))

  const posmTypes = ['Fridge Sticker', 'Poster A3', 'Tent Card', 'Dumpbin', 'Sunblind', 'Bottle Cut Out']
  const posmStats = posmTypes.map(posm => ({
    posm,
    scans: visits.filter(v => v.posm_type === posm).length,
    claims: claims.filter(c => c.posm_type === posm).length,
  }))
  const maxPosmScans = Math.max(...posmStats.map(p => p.scans), 1)

  const trendMap = {}
  claims.forEach(c => {
    const d = new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    trendMap[d] = (trendMap[d] || 0) + 1
  })
  const trendDays = Object.entries(trendMap).slice(-7).reverse()
  const maxTrend = Math.max(...trendDays.map(([, v]) => v), 1)

  function exportCSV(data, filename) {
    if (!data.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = filename; a.click()
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#faf7f5', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: '3px solid #f0e4dc', borderTopColor: '#FF585D', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 14, color: '#8B6555' }}>Memuat dashboard...</div>
    </div>
  )

  const SIDEBAR_W = sidebarOpen ? 240 : 64

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#faf7f5', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif' }}>

      {/* SIDEBAR */}
      <div style={{ width: SIDEBAR_W, minHeight: '100vh', background: '#2C1810', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, transition: 'width .2s ease', overflow: 'hidden' }}>

        {/* Logo area */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#8F573A,#FF585D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🍺</div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Kawan Senja</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Admin Dashboard</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(255,88,93,.15)' : 'transparent',
                  color: active ? '#FF585D' : 'rgba(255,255,255,.55)',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 500 : 400,
                  marginBottom: 2, textAlign: 'left', transition: 'all .15s',
                  borderLeft: active ? '2px solid #FF585D' : '2px solid transparent',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Toggle + bottom */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            {sidebarOpen ? '◀ Collapse' : '▶'}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ marginLeft: SIDEBAR_W, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left .2s ease' }}>

        {/* TOP BAR */}
        <div style={{ background: '#fff', borderBottom: '1px solid #f0e4dc', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#2C1810', margin: 0 }}>
              {NAV_ITEMS.find(n => n.key === activeTab)?.icon} {NAV_ITEMS.find(n => n.key === activeTab)?.label}
            </h1>
            <div style={{ fontSize: 12, color: '#8B6555', marginTop: 2 }}>
              Update: {lastUpdate ? lastUpdate.toLocaleTimeString('id-ID') : '-'} · Auto-refresh 30 detik
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="/" target="_blank" style={{ padding: '8px 14px', background: '#f5ede7', color: '#8F573A', borderRadius: 8, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
              🔗 Shopper App
            </a>
            <button onClick={fetchData} style={{ padding: '8px 14px', background: '#FF585D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ padding: '28px 32px', flex: 1 }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
                <StatCard label="Total Klaim" value={totalClaims} sub={`${pending} pending fulfillment`} color="#FF585D" icon="🎁" />
                <StatCard label="Total Visitor" value={totalVisits} sub="yang buka app" color="#8F573A" icon="👥" />
                <StatCard label="Conversion Rate" value={`${convRate}%`} sub="visitor → klaim" color="#E8A045" icon="📈" />
                <StatCard label="Foto POSM" value={withPhoto} sub={`dari ${totalClaims} klaim`} color="#48A111" icon="📸" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Channel cards */}
                <div style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, padding: 24 }}>
                  <SectionTitle>Performa Channel</SectionTitle>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {channelStats.map(ch => (
                      <div key={ch.channel} style={{ flex: 1, background: CHANNEL_BG[ch.channel], borderRadius: 10, padding: '14px 12px', border: `1px solid ${CHANNEL_COLORS[ch.channel]}30` }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: CHANNEL_COLORS[ch.channel], marginBottom: 8 }}>{ch.channel}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#2C1810' }}>{ch.scans}</div>
                        <div style={{ fontSize: 11, color: '#8B6555' }}>scan</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: CHANNEL_COLORS[ch.channel], marginTop: 6 }}>{ch.claims}</div>
                        <div style={{ fontSize: 11, color: '#8B6555' }}>klaim · {ch.conv}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tier breakdown */}
                <div style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, padding: 24 }}>
                  <SectionTitle>Tier Hadiah</SectionTitle>
                  {[
                    { label: '💳 Tier 1 — Voucher E-Money', count: t1, color: '#FF585D' },
                    { label: '🎁 Tier 2 — Merchandise', count: t2, color: '#E8A045' },
                    { label: '📦 Tier 3 — Paket Spesial', count: t3, color: '#8F573A' },
                  ].map(t => {
                    const pct = totalClaims > 0 ? Math.round((t.count / totalClaims) * 100) : 0
                    return (
                      <div key={t.label} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: '#2C1810' }}>{t.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: t.color }}>{t.count} <span style={{ color: '#8B6555', fontWeight: 400 }}>({pct}%)</span></span>
                        </div>
                        <div style={{ background: '#f5ede7', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: t.color, borderRadius: 99 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Trend */}
              <div style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, padding: 24 }}>
                <SectionTitle>Trend Klaim 7 Hari Terakhir</SectionTitle>
                {trendDays.length === 0
                  ? <div style={{ textAlign: 'center', padding: 40, color: '#8B6555' }}>Belum ada data klaim</div>
                  : (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, paddingTop: 20 }}>
                      {trendDays.map(([day, count]) => (
                        <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1810' }}>{count}</div>
                          <div style={{ width: '100%', background: 'linear-gradient(180deg,#FF585D,#8F573A)', borderRadius: '6px 6px 0 0', height: `${(count / maxTrend) * 120}px`, minHeight: 6 }} />
                          <div style={{ fontSize: 11, color: '#8B6555', whiteSpace: 'nowrap' }}>{day}</div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* CHANNEL */}
          {activeTab === 'channel' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 24 }}>
                {channelStats.map(ch => (
                  <div key={ch.channel} style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, padding: 24, borderTop: `4px solid ${CHANNEL_COLORS[ch.channel]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#2C1810' }}>{ch.channel}</div>
                        <div style={{ fontSize: 12, color: '#8B6555' }}>{ch.channel === 'WHS' ? 'Wholesale' : 'Off Trade'}</div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: CHANNEL_COLORS[ch.channel], padding: '6px 12px', background: CHANNEL_BG[ch.channel], borderRadius: 99 }}>
                        {ch.conv}%
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                      {[{ l: 'Scan', v: ch.scans }, { l: 'Klaim', v: ch.claims }, { l: 'Drop', v: ch.scans - ch.claims }].map(s => (
                        <div key={s.l} style={{ textAlign: 'center', padding: '12px 8px', background: '#faf7f5', borderRadius: 8 }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: '#2C1810' }}>{s.v}</div>
                          <div style={{ fontSize: 11, color: '#8B6555' }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid #f0e4dc', paddingTop: 14 }}>
                      <div style={{ fontSize: 12, color: '#8B6555', marginBottom: 10, fontWeight: 500 }}>Breakdown POSM</div>
                      {posmTypes.map(posm => {
                        const cnt = claims.filter(c => c.channel === ch.channel && c.posm_type === posm).length
                        const scan = visits.filter(v => v.channel === ch.channel && v.posm_type === posm).length
                        return (
                          <div key={posm} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #faf7f5' }}>
                            <span style={{ fontSize: 12, color: '#2C1810' }}>{POSM_ICONS[posm]} {posm}</span>
                            <span style={{ fontSize: 12 }}>
                              <span style={{ color: '#8B6555' }}>{scan}</span>
                              <span style={{ color: '#e8d5c9', margin: '0 4px' }}>·</span>
                              <span style={{ color: CHANNEL_COLORS[ch.channel], fontWeight: 500 }}>{cnt}</span>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POSM */}
          {activeTab === 'posm' && (
            <div>
              <div style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <SectionTitle>Ranking POSM berdasarkan Scan</SectionTitle>
                {[...posmStats].sort((a, b) => b.scans - a.scans).map((p, i) => (
                  <div key={p.posm} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#E8A045' : i === 1 ? '#c4845e' : '#f5ede7', color: i < 2 ? '#fff' : '#8B6555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, color: '#2C1810', fontWeight: 500 }}>{POSM_ICONS[p.posm]} {p.posm}</span>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <span style={{ fontSize: 13, color: '#8B6555' }}>{p.scans} scan</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#FF585D' }}>{p.claims} klaim</span>
                        </div>
                      </div>
                      <div style={{ background: '#f5ede7', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${(p.scans / maxPosmScans) * 100}%`, height: '100%', background: '#FF585D', borderRadius: 99 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
                {posmStats.map(p => (
                  <div key={p.posm} style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{POSM_ICONS[p.posm]}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#2C1810', marginBottom: 14 }}>{p.posm}</div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      <div style={{ flex: 1, textAlign: 'center', padding: 10, background: '#faf7f5', borderRadius: 8 }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#2C1810' }}>{p.scans}</div>
                        <div style={{ fontSize: 11, color: '#8B6555' }}>Scan</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center', padding: 10, background: '#fff0f0', borderRadius: 8 }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#FF585D' }}>{p.claims}</div>
                        <div style={{ fontSize: 11, color: '#8B6555' }}>Klaim</div>
                      </div>
                    </div>
                    {['WHS', 'PND', 'TLS'].map(ch => {
                      const cnt = claims.filter(c => c.posm_type === p.posm && c.channel === ch).length
                      return cnt > 0 ? (
                        <div key={ch} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #faf7f5' }}>
                          <span style={{ fontSize: 12, color: CHANNEL_COLORS[ch], fontWeight: 500 }}>{ch}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#2C1810' }}>{cnt}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KLAIM */}
          {activeTab === 'klaim' && (
            <div>
              <SectionTitle action={<ExportBtn onClick={() => exportCSV(claims, 'ks_claims.csv')} />}>
                {totalClaims} Total Klaim
              </SectionTitle>
              <div style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#faf7f5', borderBottom: '1px solid #f0e4dc' }}>
                        {['Tanggal', 'Kode', 'Nama', 'WhatsApp', 'Channel', 'POSM', 'Tier', 'Skor', 'Lokasi', 'Status', 'Foto'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#8B6555', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {claims.length === 0
                        ? <tr><td colSpan={11} style={{ padding: 40, textAlign: 'center', color: '#8B6555' }}>Belum ada klaim</td></tr>
                        : claims.map((c, i) => (
                          <tr key={c.id} style={{ borderBottom: '1px solid #faf7f5', background: i % 2 === 0 ? '#fff' : '#fdfbfa' }}>
                            <td style={{ padding: '12px 16px', color: '#8B6555', whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#FF585D' }}>{c.kode}</td>
                            <td style={{ padding: '12px 16px', color: '#2C1810', fontWeight: 500 }}>{c.nama}</td>
                            <td style={{ padding: '12px 16px', color: '#2C1810' }}>{c.whatsapp}</td>
                            <td style={{ padding: '12px 16px' }}>
                              {c.channel ? <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: CHANNEL_BG[c.channel], color: CHANNEL_COLORS[c.channel] }}>{c.channel}</span> : '—'}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#2C1810', whiteSpace: 'nowrap' }}>{c.posm_type ? `${POSM_ICONS[c.posm_type]} ${c.posm_type}` : '—'}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: c.tier === 't1' ? '#fff0f0' : c.tier === 't2' ? '#fff8ee' : '#f5ede7', color: c.tier === 't1' ? '#d93f44' : c.tier === 't2' ? '#7a5010' : '#6B3E27' }}>
                                {c.tier === 't1' ? 'T1' : c.tier === 't2' ? 'T2' : 'T3'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#2C1810' }}>{c.quiz_score}</td>
                            <td style={{ padding: '12px 16px', color: '#8B6555', whiteSpace: 'nowrap' }}>{c.kota_ip || '—'}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: c.status === 'pending' ? '#fff8ee' : '#eaf3de', color: c.status === 'pending' ? '#7a5010' : '#3B6D11' }}>{c.status}</span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              {c.foto_posm_url ? <button onClick={() => setSelectedPhoto(c.foto_posm_url)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>🖼️</button> : <span style={{ color: '#e8d5c9' }}>—</span>}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VISITOR */}
          {activeTab === 'visitor' && (
            <div>
              <SectionTitle action={<ExportBtn onClick={() => exportCSV(visits, 'ks_visits.csv')} label="Export Visitor CSV" />}>
                {totalVisits} Total Visitor
              </SectionTitle>
              <div style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#faf7f5', borderBottom: '1px solid #f0e4dc' }}>
                        {['Waktu', 'Channel', 'POSM', 'Kota', 'Provinsi', 'Negara', 'IP Address'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#8B6555', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visits.map((v, i) => (
                        <tr key={v.id} style={{ borderBottom: '1px solid #faf7f5', background: i % 2 === 0 ? '#fff' : '#fdfbfa' }}>
                          <td style={{ padding: '12px 16px', color: '#8B6555', whiteSpace: 'nowrap' }}>{new Date(v.visited_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {v.channel ? <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: CHANNEL_BG[v.channel], color: CHANNEL_COLORS[v.channel] }}>{v.channel}</span> : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#2C1810' }}>{v.posm_type ? `${POSM_ICONS[v.posm_type] || ''} ${v.posm_type}` : '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#2C1810' }}>{v.kota || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#2C1810' }}>{v.provinsi || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#2C1810' }}>{v.negara || '—'}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#8B6555', fontSize: 12 }}>{v.ip_address || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* FOTO */}
          {activeTab === 'foto' && (
            <div>
              <SectionTitle>{withPhoto} Foto POSM Terupload</SectionTitle>
              {withPhoto === 0
                ? <div style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, padding: 60, textAlign: 'center', color: '#8B6555' }}>Belum ada foto yang diupload</div>
                : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
                    {claims.filter(c => c.foto_posm_url).map(c => (
                      <div key={c.id} onClick={() => setSelectedPhoto(c.foto_posm_url)} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0e4dc', cursor: 'pointer', background: '#fff', transition: 'transform .15s', ':hover': { transform: 'scale(1.02)' } }}>
                        <img src={c.foto_posm_url} alt="POSM" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                            {c.channel && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: CHANNEL_BG[c.channel], color: CHANNEL_COLORS[c.channel], fontWeight: 600 }}>{c.channel}</span>}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#FF585D', fontFamily: 'monospace' }}>{c.kode}</div>
                          <div style={{ fontSize: 11, color: '#8B6555', marginTop: 2 }}>{c.posm_type || '—'}</div>
                          <div style={{ fontSize: 11, color: '#c4845e', marginTop: 2 }}>{new Date(c.created_at).toLocaleDateString('id-ID')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* STOCK */}
          {activeTab === 'stock' && (
            <div>
              <SectionTitle>Status Stok Hadiah</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
                {stock.map(s => {
                  const claimed = s.tier === 't1' ? t1 : s.tier === 't2' ? t2 : t3
                  const original = s.jumlah + claimed
                  const pct = original > 0 ? Math.round((claimed / original) * 100) : 0
                  const isLow = s.jumlah <= 5
                  return (
                    <div key={s.tier} style={{ background: '#fff', border: `1px solid ${isLow ? '#FF585D' : '#f0e4dc'}`, borderRadius: 12, padding: 24, borderTop: `4px solid ${isLow ? '#FF585D' : '#48A111'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#2C1810' }}>{s.nama_hadiah}</div>
                          <div style={{ fontSize: 12, color: '#8B6555', marginTop: 2 }}>{s.tier === 't1' ? 'Tier 1 — Skor 8–10' : s.tier === 't2' ? 'Tier 2 — Skor 5–7' : 'Tier 3 — Skor 1–4'}</div>
                        </div>
                        {isLow && <span style={{ padding: '4px 12px', background: '#fff0f0', color: '#d93f44', borderRadius: 99, fontSize: 12, fontWeight: 600, height: 'fit-content' }}>⚠️ Hampir habis</span>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                        {[{ l: 'Stok Awal', v: original, c: '#2C1810', bg: '#faf7f5' }, { l: 'Terklaim', v: claimed, c: '#FF585D', bg: '#fff0f0' }, { l: 'Sisa', v: s.jumlah, c: isLow ? '#d93f44' : '#3B6D11', bg: isLow ? '#fff0f0' : '#eaf3de' }].map(x => (
                          <div key={x.l} style={{ textAlign: 'center', padding: 14, background: x.bg, borderRadius: 10 }}>
                            <div style={{ fontSize: 28, fontWeight: 700, color: x.c }}>{x.v}</div>
                            <div style={{ fontSize: 11, color: '#8B6555', marginTop: 2 }}>{x.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: '#f5ede7', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#d93f44' : '#FF585D', borderRadius: 99, transition: 'width .6s ease' }} />
                      </div>
                      <div style={{ fontSize: 12, color: '#8B6555', marginTop: 8, textAlign: 'right' }}>{pct}% terklaim</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* QR MANAGER */}
          {activeTab === 'qr' && (
            <div>
              <SectionTitle action={
                <a href="/admin/qr" style={{ padding: '8px 16px', background: '#FF585D', color: '#fff', borderRadius: 8, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                  🖨️ Buka QR Generator
                </a>
              }>
                18 QR Codes — 3 Channel × 6 POSM
              </SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
                {qrCodes.map(qr => (
                  <div key={qr.qr_id} style={{ background: '#fff', border: `1px solid ${CHANNEL_COLORS[qr.channel]}30`, borderRadius: 12, padding: 20, borderTop: `3px solid ${CHANNEL_COLORS[qr.channel]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: CHANNEL_BG[qr.channel], color: CHANNEL_COLORS[qr.channel] }}>{qr.channel}</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#8B6555' }}>{qr.qr_id}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#2C1810', marginBottom: 14 }}>{POSM_ICONS[qr.posm_type] || '📌'} {qr.posm_type}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f0e4dc' }}>
                      <div>
                        <span style={{ fontSize: 24, fontWeight: 700, color: CHANNEL_COLORS[qr.channel] }}>{qr.scan_count}</span>
                        <span style={{ fontSize: 12, color: '#8B6555', marginLeft: 4 }}>scan</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#FF585D' }}>{claims.filter(c => c.qr_id === qr.qr_id).length}</span>
                        <span style={{ fontSize: 12, color: '#8B6555', marginLeft: 4 }}>klaim</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TESTING */}
          {activeTab === 'testing' && <TestingPanel />}

        </div>
      </div>

      {/* LIGHTBOX */}
      {selectedPhoto && (
        <div onClick={() => setSelectedPhoto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <img src={selectedPhoto} alt="POSM" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
          <button onClick={() => setSelectedPhoto(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
      )}
    </div>
  )
}
