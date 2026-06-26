import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase.js'

const REFRESH_INTERVAL = 30000

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#fff', border: '0.5px solid #e8d5c9',
      borderRadius: 12, padding: '16px',
      borderLeft: `3px solid ${color || '#FF585D'}`,
    }}>
      <div style={{ fontSize: 11, color: '#8B6555', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 500, color: '#2C1810', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#8B6555', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function TierBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: '#2C1810' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#2C1810' }}>{count} <span style={{ color: '#8B6555', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ background: '#f5ede7', borderRadius: 99, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .6s ease' }} />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [claims, setClaims] = useState([])
  const [visits, setVisits] = useState([])
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [claimsRes, visitsRes, stockRes] = await Promise.all([
        supabase.from('ks_claims').select('*').order('created_at', { ascending: false }),
        supabase.from('ks_visits').select('*').order('visited_at', { ascending: false }),
        supabase.from('ks_stock').select('*'),
      ])
      if (claimsRes.data) setClaims(claimsRes.data)
      if (visitsRes.data) setVisits(visitsRes.data)
      if (stockRes.data) setStock(stockRes.data)
      setLastUpdate(new Date())
    } catch (e) {
      console.error(e)
    }
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

  // Trend harian
  const trendMap = {}
  claims.forEach(c => {
    const d = new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    trendMap[d] = (trendMap[d] || 0) + 1
  })
  const trendDays = Object.entries(trendMap).slice(-7).reverse()
  const maxTrend = Math.max(...trendDays.map(([, v]) => v), 1)

  // Lokasi
  const lokasiMap = {}
  claims.forEach(c => {
    if (c.kota_ip) {
      const key = `${c.kota_ip}, ${c.provinsi_ip || ''}`
      lokasiMap[key] = (lokasiMap[key] || 0) + 1
    }
  })
  const topLokasi = Object.entries(lokasiMap).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Visitor lokasi
  const visitorLokasiMap = {}
  visits.forEach(v => {
    if (v.kota) {
      const key = `${v.kota}, ${v.provinsi || ''}`
      visitorLokasiMap[key] = (visitorLokasiMap[key] || 0) + 1
    }
  })
  const topVisitorLokasi = Object.entries(visitorLokasiMap).sort((a, b) => b[1] - a[1]).slice(0, 8)

  function exportCSV(data, filename) {
    if (!data.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
  }

  const TABS = ['overview', 'klaim', 'visitor', 'foto', 'stock']
  const TAB_LABELS = { overview: 'Overview', klaim: 'Data Klaim', visitor: 'Visitor', foto: 'Foto POSM', stock: 'Stok' }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16, background: '#FDF6F0' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e8d5c9', borderTopColor: '#FF585D', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <div style={{ fontSize: 14, color: '#8B6555' }}>Memuat dashboard...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0e8e0', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#8F573A,#FF585D)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>Kawan Senja — Admin</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>
              Update terakhir: {lastUpdate ? lastUpdate.toLocaleTimeString('id-ID') : '-'} · Auto-refresh 30 detik
            </div>
          </div>
          <button
            onClick={fetchData}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.4)', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === t ? 500 : 400, whiteSpace: 'nowrap',
                background: activeTab === t ? '#FF585D' : '#fff',
                color: activeTab === t ? '#fff' : '#8B6555',
                fontFamily: 'inherit',
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            {/* STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 20 }}>
              <StatCard label="Total Klaim" value={totalClaims} sub={`${pending} pending`} color="#FF585D" />
              <StatCard label="Total Visitor" value={totalVisits} sub="yang buka app" color="#8F573A" />
              <StatCard label="Conversion Rate" value={`${convRate}%`} sub="visitor → klaim" color="#E8A045" />
              <StatCard label="Dengan Foto" value={withPhoto} sub={`dari ${totalClaims} klaim`} color="#48A111" />
            </div>

            {/* TIER BREAKDOWN */}
            <div style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 16 }}>Breakdown Tier Hadiah</div>
              <TierBar label="💳 Tier 1 — Voucher E-Money" count={t1} total={totalClaims} color="#FF585D" />
              <TierBar label="🎁 Tier 2 — Merchandise" count={t2} total={totalClaims} color="#E8A045" />
              <TierBar label="📦 Tier 3 — Paket Spesial" count={t3} total={totalClaims} color="#8F573A" />
            </div>

            {/* TREND HARIAN */}
            <div style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 16 }}>Trend Klaim 7 Hari Terakhir</div>
              {trendDays.length === 0 ? (
                <div style={{ fontSize: 13, color: '#8B6555', textAlign: 'center', padding: '20px 0' }}>Belum ada data</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                  {trendDays.map(([day, count]) => (
                    <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#2C1810' }}>{count}</div>
                      <div style={{
                        width: '100%', background: '#FF585D', borderRadius: '4px 4px 0 0',
                        height: `${(count / maxTrend) * 90}px`, minHeight: 4,
                        transition: 'height .4s ease',
                      }} />
                      <div style={{ fontSize: 10, color: '#8B6555', whiteSpace: 'nowrap' }}>{day}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TOP LOKASI KLAIM */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
              <div style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 14 }}>📍 Top Lokasi Klaim</div>
                {topLokasi.length === 0
                  ? <div style={{ fontSize: 13, color: '#8B6555' }}>Belum ada data</div>
                  : topLokasi.map(([loc, cnt], i) => (
                    <div key={loc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < topLokasi.length - 1 ? '0.5px solid #f5ede7' : 'none' }}>
                      <span style={{ fontSize: 13, color: '#2C1810' }}>{loc || 'Tidak diketahui'}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#FF585D' }}>{cnt}</span>
                    </div>
                  ))
                }
              </div>
              <div style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 14 }}>🌐 Top Lokasi Visitor</div>
                {topVisitorLokasi.length === 0
                  ? <div style={{ fontSize: 13, color: '#8B6555' }}>Belum ada data</div>
                  : topVisitorLokasi.map(([loc, cnt], i) => (
                    <div key={loc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < topVisitorLokasi.length - 1 ? '0.5px solid #f5ede7' : 'none' }}>
                      <span style={{ fontSize: 13, color: '#2C1810' }}>{loc || 'Tidak diketahui'}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#8F573A' }}>{cnt}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* KLAIM TAB */}
        {activeTab === 'klaim' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810' }}>{totalClaims} total klaim</div>
              <button onClick={() => exportCSV(claims, 'ks_claims.csv')} style={{ padding: '8px 14px', background: '#FF585D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                ⬇️ Export CSV
              </button>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e8d5c9', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f5ede7' }}>
                      {['Tanggal', 'Kode', 'Nama', 'WA', 'Tier', 'Hadiah', 'Skor', 'Lokasi IP', 'Status', 'Foto'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6B3E27', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {claims.length === 0 ? (
                      <tr><td colSpan={10} style={{ padding: 24, textAlign: 'center', color: '#8B6555' }}>Belum ada klaim</td></tr>
                    ) : claims.map((c, i) => (
                      <tr key={c.id} style={{ borderTop: '0.5px solid #f5ede7', background: i % 2 === 0 ? '#fff' : '#fdf9f7' }}>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#8B6555' }}>
                          {new Date(c.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 500, color: '#FF585D' }}>{c.kode}</td>
                        <td style={{ padding: '10px 12px', color: '#2C1810' }}>{c.nama}</td>
                        <td style={{ padding: '10px 12px', color: '#2C1810' }}>{c.whatsapp}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                            background: c.tier === 't1' ? '#fff0f0' : c.tier === 't2' ? '#fff8ee' : '#f5ede7',
                            color: c.tier === 't1' ? '#d93f44' : c.tier === 't2' ? '#7a5010' : '#6B3E27',
                          }}>
                            {c.tier === 't1' ? 'T1' : c.tier === 't2' ? 'T2' : 'T3'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#2C1810', whiteSpace: 'nowrap' }}>{c.hadiah}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500, color: '#2C1810' }}>{c.quiz_score}</td>
                        <td style={{ padding: '10px 12px', color: '#8B6555', whiteSpace: 'nowrap' }}>{c.kota_ip ? `${c.kota_ip}, ${c.provinsi_ip || ''}` : '-'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: 11,
                            background: c.status === 'pending' ? '#fff8ee' : '#eaf3de',
                            color: c.status === 'pending' ? '#7a5010' : '#3B6D11',
                          }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {c.foto_posm_url
                            ? <button onClick={() => setSelectedPhoto(c.foto_posm_url)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>🖼️</button>
                            : <span style={{ color: '#e8d5c9' }}>—</span>
                          }
                        </td>
                      </tr>
                    ))}
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
              <button onClick={() => exportCSV(visits, 'ks_visits.csv')} style={{ padding: '8px 14px', background: '#8F573A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                ⬇️ Export CSV
              </button>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e8d5c9', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f5ede7' }}>
                      {['Waktu', 'Kota', 'Provinsi', 'Negara', 'ISP', 'IP Address'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6B3E27', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visits.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#8B6555' }}>Belum ada visitor</td></tr>
                    ) : visits.map((v, i) => (
                      <tr key={v.id} style={{ borderTop: '0.5px solid #f5ede7', background: i % 2 === 0 ? '#fff' : '#fdf9f7' }}>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#8B6555' }}>
                          {new Date(v.visited_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#2C1810' }}>{v.kota || '-'}</td>
                        <td style={{ padding: '10px 12px', color: '#2C1810' }}>{v.provinsi || '-'}</td>
                        <td style={{ padding: '10px 12px', color: '#2C1810' }}>{v.negara || '-'}</td>
                        <td style={{ padding: '10px 12px', color: '#8B6555', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.isp || '-'}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#8B6555' }}>{v.ip_address || '-'}</td>
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
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 14 }}>
              {withPhoto} foto POSM terupload
            </div>
            {withPhoto === 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e8d5c9', padding: 40, textAlign: 'center', color: '#8B6555' }}>
                Belum ada foto yang diupload
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                {claims.filter(c => c.foto_posm_url).map(c => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedPhoto(c.foto_posm_url)}
                    style={{ borderRadius: 10, overflow: 'hidden', border: '0.5px solid #e8d5c9', cursor: 'pointer', background: '#fff' }}
                  >
                    <img src={c.foto_posm_url} alt="POSM" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#FF585D', fontFamily: 'monospace' }}>{c.kode}</div>
                      <div style={{ fontSize: 11, color: '#8B6555' }}>{c.kota_ip || 'Lokasi -'}</div>
                      <div style={{ fontSize: 10, color: '#c4845e' }}>
                        {new Date(c.created_at).toLocaleDateString('id-ID')}
                      </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stock.map(s => {
                const claimed = s.tier === 't1' ? t1 : s.tier === 't2' ? t2 : t3
                const original = s.jumlah + claimed
                const pct = original > 0 ? Math.round((claimed / original) * 100) : 0
                const isLow = s.jumlah <= 5
                return (
                  <div key={s.tier} style={{ background: '#fff', border: `0.5px solid ${isLow ? '#FF585D' : '#e8d5c9'}`, borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: '#2C1810' }}>{s.nama_hadiah}</div>
                        <div style={{ fontSize: 12, color: '#8B6555', marginTop: 2 }}>
                          {s.tier === 't1' ? 'Tier 1 — Skor 8–10' : s.tier === 't2' ? 'Tier 2 — Skor 5–7' : 'Tier 3 — Skor 1–4'}
                        </div>
                      </div>
                      {isLow && (
                        <span style={{ padding: '3px 10px', background: '#fff0f0', color: '#d93f44', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>
                          ⚠️ Hampir habis
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div style={{ textAlign: 'center', padding: '10px', background: '#f5ede7', borderRadius: 8 }}>
                        <div style={{ fontSize: 22, fontWeight: 500, color: '#2C1810' }}>{original}</div>
                        <div style={{ fontSize: 11, color: '#8B6555' }}>Stok awal</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '10px', background: '#fff0f0', borderRadius: 8 }}>
                        <div style={{ fontSize: 22, fontWeight: 500, color: '#FF585D' }}>{claimed}</div>
                        <div style={{ fontSize: 11, color: '#8B6555' }}>Terklaim</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '10px', background: s.jumlah <= 5 ? '#fff0f0' : '#eaf3de', borderRadius: 8 }}>
                        <div style={{ fontSize: 22, fontWeight: 500, color: s.jumlah <= 5 ? '#d93f44' : '#3B6D11' }}>{s.jumlah}</div>
                        <div style={{ fontSize: 11, color: '#8B6555' }}>Sisa</div>
                      </div>
                    </div>
                    <div style={{ background: '#f5ede7', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#d93f44' : '#FF585D', borderRadius: 99, transition: 'width .6s ease' }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#8B6555', marginTop: 5, textAlign: 'right' }}>{pct}% terklaim</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* PHOTO LIGHTBOX */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <img src={selectedPhoto} alt="POSM" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
          <button
            onClick={() => setSelectedPhoto(null)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', fontSize: 18, cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

    </div>
  )
}
