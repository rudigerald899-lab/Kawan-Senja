import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase.js'

const REFRESH_INTERVAL = 30000
const CHANNEL_COLORS = { WHS: '#8F573A', PND: '#FF585D', TLS: '#E8A045' }
const CHANNEL_BG = { WHS: '#f5ede7', PND: '#fff0f0', TLS: '#fff8ee' }
const POSM_ICONS = {
  'Fridge Sticker': '❄️', 'Poster A3': '📋', 'Tent Card': '🪧',
  'Dumpbin': '🗑️', 'Sunblind': '☀️', 'Bottle Cut Out': '🍺'
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 16, borderLeft: `3px solid ${color || '#FF585D'}` }}>
      <div style={{ fontSize: 11, color: '#8B6555', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 500, color: '#2C1810', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#8B6555', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function Bar({ label, count, total, color, icon }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: '#2C1810' }}>{icon} {label}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#2C1810' }}>{count} <span style={{ color: '#8B6555', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ background: '#f5ede7', borderRadius: 99, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .6s ease' }} />
      </div>
    </div>
  )
}

const TABS = ['overview', 'channel', 'posm', 'klaim', 'visitor', 'foto', 'stock', 'qr']
const TAB_LABELS = { overview: 'Overview', channel: 'Channel', posm: 'POSM', klaim: 'Data Klaim', visitor: 'Visitor', foto: 'Foto POSM', stock: 'Stok', qr: 'QR Manager' }

export default function AdminDashboard() {
  const [claims, setClaims] = useState([])
  const [visits, setVisits] = useState([])
  const [stock, setStock] = useState([])
  const [qrCodes, setQrCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPhoto, setSelectedPhoto] = useState(null)

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

  // COMPUTED
  const totalClaims = claims.length
  const totalVisits = visits.length
  const convRate = totalVisits > 0 ? ((totalClaims / totalVisits) * 100).toFixed(1) : 0
  const t1 = claims.filter(c => c.tier === 't1').length
  const t2 = claims.filter(c => c.tier === 't2').length
  const t3 = claims.filter(c => c.tier === 't3').length
  const withPhoto = claims.filter(c => c.foto_posm_url).length
  const pending = claims.filter(c => c.status === 'pending').length

  // Channel stats
  const channelStats = ['WHS', 'PND', 'TLS'].map(ch => ({
    channel: ch,
    scans: visits.filter(v => v.channel === ch).length,
    claims: claims.filter(c => c.channel === ch).length,
    conv: visits.filter(v => v.channel === ch).length > 0
      ? ((claims.filter(c => c.channel === ch).length / visits.filter(v => v.channel === ch).length) * 100).toFixed(1)
      : 0,
    noQR: ch,
  }))

  // POSM stats
  const posmTypes = ['Fridge Sticker', 'Poster A3', 'Tent Card', 'Dumpbin', 'Sunblind', 'Bottle Cut Out']
  const posmStats = posmTypes.map(posm => ({
    posm,
    scans: visits.filter(v => v.posm_type === posm).length,
    claims: claims.filter(c => c.posm_type === posm).length,
  }))
  const maxPosmScans = Math.max(...posmStats.map(p => p.scans), 1)

  // Trend harian
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16, background: '#FDF6F0' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e8d5c9', borderTopColor: '#FF585D', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 14, color: '#8B6555' }}>Memuat dashboard...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0e8e0', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#8F573A,#FF585D)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>Kawan Senja — Admin Dashboard</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>
              Update: {lastUpdate ? lastUpdate.toLocaleTimeString('id-ID') : '-'} · Auto-refresh 30 detik
            </div>
          </div>
          <button onClick={fetchData} style={{ padding: '8px 16px', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.4)', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t ? 500 : 400, whiteSpace: 'nowrap', background: activeTab === t ? '#FF585D' : '#fff', color: activeTab === t ? '#fff' : '#8B6555', fontFamily: 'inherit' }}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
              <StatCard label="Total Klaim" value={totalClaims} sub={`${pending} pending`} color="#FF585D" />
              <StatCard label="Total Visitor" value={totalVisits} sub="buka app" color="#8F573A" />
              <StatCard label="Conversion" value={`${convRate}%`} sub="visitor → klaim" color="#E8A045" />
              <StatCard label="Dengan Foto" value={withPhoto} sub={`dari ${totalClaims}`} color="#48A111" />
            </div>

            {/* Channel summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 20 }}>
              {channelStats.map(ch => (
                <div key={ch.channel} style={{ background: '#fff', border: `0.5px solid ${CHANNEL_COLORS[ch.channel]}40`, borderRadius: 12, padding: 16, borderTop: `3px solid ${CHANNEL_COLORS[ch.channel]}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#2C1810' }}>{ch.channel}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: CHANNEL_BG[ch.channel], color: CHANNEL_COLORS[ch.channel] }}>
                      {ch.conv}% conv.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 500, color: '#2C1810' }}>{ch.scans}</div>
                      <div style={{ fontSize: 11, color: '#8B6555' }}>Scan</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 500, color: CHANNEL_COLORS[ch.channel] }}>{ch.claims}</div>
                      <div style={{ fontSize: 11, color: '#8B6555' }}>Klaim</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tier breakdown */}
            <div style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 16 }}>Breakdown Tier Hadiah</div>
              <Bar label="Tier 1 — Voucher E-Money" count={t1} total={totalClaims} color="#FF585D" icon="💳" />
              <Bar label="Tier 2 — Merchandise" count={t2} total={totalClaims} color="#E8A045" icon="🎁" />
              <Bar label="Tier 3 — Paket Spesial" count={t3} total={totalClaims} color="#8F573A" icon="📦" />
            </div>

            {/* Trend */}
            <div style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 16 }}>Trend Klaim 7 Hari Terakhir</div>
              {trendDays.length === 0
                ? <div style={{ fontSize: 13, color: '#8B6555', textAlign: 'center', padding: '20px 0' }}>Belum ada data</div>
                : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                    {trendDays.map(([day, count]) => (
                      <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#2C1810' }}>{count}</div>
                        <div style={{ width: '100%', background: '#FF585D', borderRadius: '4px 4px 0 0', height: `${(count / maxTrend) * 90}px`, minHeight: 4 }} />
                        <div style={{ fontSize: 10, color: '#8B6555', whiteSpace: 'nowrap' }}>{day}</div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* CHANNEL TAB */}
        {activeTab === 'channel' && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 16 }}>Performa per Channel</div>
            {channelStats.map(ch => (
              <div key={ch.channel} style={{ background: '#fff', border: `0.5px solid ${CHANNEL_COLORS[ch.channel]}40`, borderRadius: 12, padding: 20, marginBottom: 14, borderLeft: `4px solid ${CHANNEL_COLORS[ch.channel]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 500, color: '#2C1810' }}>{ch.channel}</div>
                    <div style={{ fontSize: 12, color: '#8B6555' }}>{ch.channel === 'WHS' ? 'Wholesale' : 'Off Trade'}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 500, padding: '6px 14px', borderRadius: 99, background: CHANNEL_BG[ch.channel], color: CHANNEL_COLORS[ch.channel] }}>
                    {ch.conv}% conv.
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {[
                    { label: 'Total Scan', value: ch.scans, color: '#2C1810' },
                    { label: 'Total Klaim', value: ch.claims, color: CHANNEL_COLORS[ch.channel] },
                    { label: 'Drop Off', value: ch.scans - ch.claims, color: '#8B6555' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: 12, background: '#f9f5f2', borderRadius: 8 }}>
                      <div style={{ fontSize: 22, fontWeight: 500, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: '#8B6555' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* POSM breakdown per channel */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: '#8B6555', marginBottom: 10 }}>POSM Performance dalam channel ini:</div>
                  {posmTypes.map(posm => {
                    const cnt = claims.filter(c => c.channel === ch.channel && c.posm_type === posm).length
                    const scanCnt = visits.filter(v => v.channel === ch.channel && v.posm_type === posm).length
                    return (
                      <div key={posm} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid #f5ede7' }}>
                        <span style={{ fontSize: 13, color: '#2C1810' }}>{POSM_ICONS[posm] || '📌'} {posm}</span>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ fontSize: 12, color: '#8B6555' }}>{scanCnt} scan</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: CHANNEL_COLORS[ch.channel] }}>{cnt} klaim</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* POSM TAB */}
        {activeTab === 'posm' && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 16 }}>Efektivitas per Jenis POSM</div>
            <div style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#8B6555', marginBottom: 16 }}>Ranking POSM berdasarkan scan count</div>
              {[...posmStats].sort((a, b) => b.scans - a.scans).map((p, i) => (
                <div key={p.posm} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, width: 18, height: 18, borderRadius: '50%', background: i === 0 ? '#E8A045' : '#f5ede7', color: i === 0 ? '#fff' : '#8B6555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: '#2C1810' }}>{POSM_ICONS[p.posm] || '📌'} {p.posm}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 12, color: '#8B6555' }}>{p.scans} scan</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#FF585D' }}>{p.claims} klaim</span>
                    </div>
                  </div>
                  <div style={{ background: '#f5ede7', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${(p.scans / maxPosmScans) * 100}%`, height: '100%', background: '#FF585D', borderRadius: 99, transition: 'width .6s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Grid per POSM type */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
              {posmStats.map(p => (
                <div key={p.posm} style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{POSM_ICONS[p.posm] || '📌'}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 10 }}>{p.posm}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#f5ede7', borderRadius: 6 }}>
                      <div style={{ fontSize: 18, fontWeight: 500, color: '#2C1810' }}>{p.scans}</div>
                      <div style={{ fontSize: 10, color: '#8B6555' }}>Scan</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#fff0f0', borderRadius: 6 }}>
                      <div style={{ fontSize: 18, fontWeight: 500, color: '#FF585D' }}>{p.claims}</div>
                      <div style={{ fontSize: 10, color: '#8B6555' }}>Klaim</div>
                    </div>
                  </div>
                  {/* Per channel breakdown */}
                  <div style={{ marginTop: 10 }}>
                    {['WHS', 'PND', 'TLS'].map(ch => {
                      const cnt = claims.filter(c => c.posm_type === p.posm && c.channel === ch).length
                      return cnt > 0 ? (
                        <div key={ch} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                          <span style={{ fontSize: 11, color: CHANNEL_COLORS[ch] }}>{ch}</span>
                          <span style={{ fontSize: 11, fontWeight: 500, color: '#2C1810' }}>{cnt}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KLAIM TAB */}
        {activeTab === 'klaim' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810' }}>{totalClaims} total klaim</div>
              <button onClick={() => exportCSV(claims, 'ks_claims.csv')} style={{ padding: '8px 14px', background: '#FF585D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>⬇️ Export CSV</button>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e8d5c9', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f5ede7' }}>
                      {['Tanggal', 'Kode', 'Nama', 'WA', 'Channel', 'POSM', 'Tier', 'Skor', 'Lokasi', 'Status', 'Foto'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6B3E27', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {claims.length === 0
                      ? <tr><td colSpan={11} style={{ padding: 24, textAlign: 'center', color: '#8B6555' }}>Belum ada klaim</td></tr>
                      : claims.map((c, i) => (
                        <tr key={c.id} style={{ borderTop: '0.5px solid #f5ede7', background: i % 2 === 0 ? '#fff' : '#fdf9f7' }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#8B6555' }}>{new Date(c.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 500, color: '#FF585D' }}>{c.kode}</td>
                          <td style={{ padding: '10px 12px', color: '#2C1810' }}>{c.nama}</td>
                          <td style={{ padding: '10px 12px', color: '#2C1810' }}>{c.whatsapp}</td>
                          <td style={{ padding: '10px 12px' }}>
                            {c.channel ? <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: CHANNEL_BG[c.channel] || '#f5f5f5', color: CHANNEL_COLORS[c.channel] || '#666' }}>{c.channel}</span> : <span style={{ color: '#e8d5c9' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#2C1810', whiteSpace: 'nowrap' }}>{c.posm_type ? `${POSM_ICONS[c.posm_type] || ''} ${c.posm_type}` : '—'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: c.tier === 't1' ? '#fff0f0' : c.tier === 't2' ? '#fff8ee' : '#f5ede7', color: c.tier === 't1' ? '#d93f44' : c.tier === 't2' ? '#7a5010' : '#6B3E27' }}>
                              {c.tier === 't1' ? 'T1' : c.tier === 't2' ? 'T2' : 'T3'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500 }}>{c.quiz_score}</td>
                          <td style={{ padding: '10px 12px', color: '#8B6555', whiteSpace: 'nowrap' }}>{c.kota_ip ? `${c.kota_ip}` : '—'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, background: c.status === 'pending' ? '#fff8ee' : '#eaf3de', color: c.status === 'pending' ? '#7a5010' : '#3B6D11' }}>{c.status}</span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {c.foto_posm_url ? <button onClick={() => setSelectedPhoto(c.foto_posm_url)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>🖼️</button> : <span style={{ color: '#e8d5c9' }}>—</span>}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VISITOR TAB */}
        {activeTab === 'visitor' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810' }}>{totalVisits} total visitor</div>
              <button onClick={() => exportCSV(visits, 'ks_visits.csv')} style={{ padding: '8px 14px', background: '#8F573A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>⬇️ Export CSV</button>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e8d5c9', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f5ede7' }}>
                      {['Waktu', 'Channel', 'POSM', 'Kota', 'Provinsi', 'Negara', 'IP'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6B3E27', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((v, i) => (
                      <tr key={v.id} style={{ borderTop: '0.5px solid #f5ede7', background: i % 2 === 0 ? '#fff' : '#fdf9f7' }}>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#8B6555' }}>{new Date(v.visited_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {v.channel ? <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: CHANNEL_BG[v.channel] || '#f5f5f5', color: CHANNEL_COLORS[v.channel] || '#666' }}>{v.channel}</span> : <span style={{ color: '#e8d5c9' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#2C1810' }}>{v.posm_type ? `${POSM_ICONS[v.posm_type] || ''} ${v.posm_type}` : '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#2C1810' }}>{v.kota || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#2C1810' }}>{v.provinsi || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#2C1810' }}>{v.negara || '—'}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#8B6555', fontSize: 11 }}>{v.ip_address || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FOTO TAB */}
        {activeTab === 'foto' && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 14 }}>{withPhoto} foto POSM terupload</div>
            {withPhoto === 0
              ? <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e8d5c9', padding: 40, textAlign: 'center', color: '#8B6555' }}>Belum ada foto</div>
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                  {claims.filter(c => c.foto_posm_url).map(c => (
                    <div key={c.id} onClick={() => setSelectedPhoto(c.foto_posm_url)} style={{ borderRadius: 10, overflow: 'hidden', border: '0.5px solid #e8d5c9', cursor: 'pointer', background: '#fff' }}>
                      <img src={c.foto_posm_url} alt="POSM" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                          {c.channel && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: CHANNEL_BG[c.channel], color: CHANNEL_COLORS[c.channel], fontWeight: 500 }}>{c.channel}</span>}
                          {c.posm_type && <span style={{ fontSize: 10, color: '#8B6555' }}>{c.posm_type}</span>}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#FF585D', fontFamily: 'monospace' }}>{c.kode}</div>
                        <div style={{ fontSize: 10, color: '#c4845e' }}>{new Date(c.created_at).toLocaleDateString('id-ID')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* STOCK TAB */}
        {activeTab === 'stock' && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 14 }}>Status Stok Hadiah</div>
            {stock.map(s => {
              const claimed = s.tier === 't1' ? t1 : s.tier === 't2' ? t2 : t3
              const original = s.jumlah + claimed
              const pct = original > 0 ? Math.round((claimed / original) * 100) : 0
              const isLow = s.jumlah <= 5
              return (
                <div key={s.tier} style={{ background: '#fff', border: `0.5px solid ${isLow ? '#FF585D' : '#e8d5c9'}`, borderRadius: 12, padding: 20, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: '#2C1810' }}>{s.nama_hadiah}</div>
                      <div style={{ fontSize: 12, color: '#8B6555' }}>{s.tier === 't1' ? 'Tier 1 — Skor 8–10' : s.tier === 't2' ? 'Tier 2 — Skor 5–7' : 'Tier 3 — Skor 1–4'}</div>
                    </div>
                    {isLow && <span style={{ padding: '3px 10px', background: '#fff0f0', color: '#d93f44', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>⚠️ Hampir habis</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                    {[{ l: 'Awal', v: original, bg: '#f5ede7', c: '#2C1810' }, { l: 'Terklaim', v: claimed, bg: '#fff0f0', c: '#FF585D' }, { l: 'Sisa', v: s.jumlah, bg: isLow ? '#fff0f0' : '#eaf3de', c: isLow ? '#d93f44' : '#3B6D11' }].map(x => (
                      <div key={x.l} style={{ textAlign: 'center', padding: 10, background: x.bg, borderRadius: 8 }}>
                        <div style={{ fontSize: 22, fontWeight: 500, color: x.c }}>{x.v}</div>
                        <div style={{ fontSize: 11, color: '#8B6555' }}>{x.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#f5ede7', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#d93f44' : '#FF585D', borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#8B6555', marginTop: 5, textAlign: 'right' }}>{pct}% terklaim</div>
                </div>
              )
            })}
          </div>
        )}

        {/* QR MANAGER TAB */}
        {activeTab === 'qr' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810' }}>18 QR Codes — 3 Channel × 6 POSM</div>
              <a href="/admin/qr" style={{ padding: '8px 14px', background: '#FF585D', color: '#fff', borderRadius: 8, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                🖨️ Buka QR Generator
              </a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
              {qrCodes.map(qr => (
                <div key={qr.qr_id} style={{ background: '#fff', border: `0.5px solid ${CHANNEL_COLORS[qr.channel]}30`, borderRadius: 12, padding: 16, borderTop: `3px solid ${CHANNEL_COLORS[qr.channel]}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: CHANNEL_BG[qr.channel], color: CHANNEL_COLORS[qr.channel] }}>{qr.channel}</span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#8B6555' }}>{qr.qr_id}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#2C1810', marginBottom: 4 }}>{POSM_ICONS[qr.posm_type] || '📌'} {qr.posm_type}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '0.5px solid #f5ede7' }}>
                    <div>
                      <span style={{ fontSize: 20, fontWeight: 500, color: CHANNEL_COLORS[qr.channel] }}>{qr.scan_count}</span>
                      <span style={{ fontSize: 11, color: '#8B6555', marginLeft: 4 }}>scan</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 20, fontWeight: 500, color: '#FF585D' }}>{claims.filter(c => c.qr_id === qr.qr_id).length}</span>
                      <span style={{ fontSize: 11, color: '#8B6555', marginLeft: 4 }}>klaim</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* LIGHTBOX */}
      {selectedPhoto && (
        <div onClick={() => setSelectedPhoto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={selectedPhoto} alt="POSM" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12 }} />
          <button onClick={() => setSelectedPhoto(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>
      )}
    </div>
  )
}
