import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

export default function TestingPanel() {
  const [fingerprints, setFingerprints] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [waInput, setWaInput] = useState('')
  const [msg, setMsg] = useState(null)
  const [resetting, setResetting] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [fpRes, clRes] = await Promise.all([
      supabase.from('ks_device_fingerprints').select('*').order('created_at', { ascending: false }),
      supabase.from('ks_claims').select('kode,nama,whatsapp,created_at,channel,posm_type,tier').order('created_at', { ascending: false }),
    ])
    if (fpRes.data) setFingerprints(fpRes.data)
    if (clRes.data) setClaims(clRes.data)
    setLoading(false)
  }

  function showMsg(text, type = 'success') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  async function unblockByWA() {
    if (!waInput.trim()) { showMsg('Masukkan nomor WA dulu', 'error'); return }
    const wa = waInput.trim()
    await supabase.from('ks_device_fingerprints').delete().eq('whatsapp', wa)
    await supabase.from('ks_claims').delete().eq('whatsapp', wa)
    setWaInput('')
    showMsg(`✅ Nomor ${wa} berhasil di-unblock`)
    fetchData()
  }

  async function unblockFingerprint(id, wa) {
    await supabase.from('ks_device_fingerprints').delete().eq('id', id)
    showMsg(`✅ Device ${wa || 'unknown'} berhasil di-unblock`)
    fetchData()
  }

  async function resetAllTestData() {
    if (!window.confirm('Reset SEMUA data test? Ini akan hapus semua klaim, visitor, dan fingerprint.')) return
    setResetting(true)
    await Promise.all([
      supabase.from('ks_device_fingerprints').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('ks_claims').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('ks_visits').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ])
    await Promise.all([
      supabase.from('ks_stock').update({ jumlah: 50 }).eq('tier', 't1'),
      supabase.from('ks_stock').update({ jumlah: 30 }).eq('tier', 't2'),
      supabase.from('ks_stock').update({ jumlah: 100 }).eq('tier', 't3'),
    ])
    setResetting(false)
    showMsg('✅ Semua data test berhasil direset')
    fetchData()
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#8B6555' }}>Memuat data...</div>
  )

  return (
    <div>
      {/* NOTIF */}
      {msg && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: msg.type === 'error' ? '#fff0f0' : '#eaf3de', border: `0.5px solid ${msg.type === 'error' ? '#FF585D' : '#48A111'}`, borderRadius: 10, padding: '12px 20px', fontSize: 14, color: msg.type === 'error' ? '#d93f44' : '#3B6D11', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,.1)', whiteSpace: 'nowrap' }}>
          {msg.text}
        </div>
      )}

      <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 4 }}>🔧 Testing Panel</div>
      <div style={{ fontSize: 12, color: '#8B6555', marginBottom: 20 }}>Khusus untuk pilot testing — unblock HP atau reset data.</div>

      {/* UNBLOCK BY WA */}
      <div style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 12 }}>🔓 Unblock Nomor WA Tertentu</div>
        <p style={{ fontSize: 13, color: '#8B6555', marginBottom: 14, lineHeight: 1.5 }}>
          Hapus record klaim dan fingerprint berdasarkan nomor WA — HP tersebut bisa ikut program lagi.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="tel"
            placeholder="08xxxxxxxxxx"
            value={waInput}
            onChange={e => setWaInput(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', background: '#f9f5f2', border: '0.5px solid #e8d5c9', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
          />
          <button
            onClick={unblockByWA}
            style={{ padding: '10px 18px', background: '#FF585D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >
            Unblock
          </button>
        </div>
      </div>

      {/* DAFTAR DEVICE TERBLOKIR */}
      <div style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810' }}>📱 Device Terblokir ({fingerprints.length})</div>
          <button onClick={fetchData} style={{ padding: '6px 12px', background: '#f5ede7', border: 'none', borderRadius: 6, fontSize: 12, color: '#8F573A', cursor: 'pointer', fontFamily: 'inherit' }}>
            🔄 Refresh
          </button>
        </div>

        {fingerprints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#8B6555', fontSize: 13 }}>Belum ada device yang terblokir</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fingerprints.map(fp => (
              <div key={fp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f9f5f2', borderRadius: 8, gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#2C1810' }}>{fp.whatsapp || 'WA tidak diketahui'}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                    {fp.kode_klaim && <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#FF585D' }}>{fp.kode_klaim}</span>}
                    {fp.channel && <span style={{ fontSize: 11, color: '#8B6555' }}>{fp.channel}</span>}
                    {fp.kota_ip && <span style={{ fontSize: 11, color: '#8B6555' }}>📍 {fp.kota_ip}</span>}
                    <span style={{ fontSize: 11, color: '#c4845e' }}>
                      {new Date(fp.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => unblockFingerprint(fp.id, fp.whatsapp)}
                  style={{ padding: '6px 12px', background: '#fff0f0', border: '0.5px solid #FF585D', borderRadius: 6, fontSize: 12, color: '#d93f44', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  🔓 Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT CLAIMS */}
      <div style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 14 }}>📋 Klaim Terbaru ({claims.length})</div>
        {claims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#8B6555', fontSize: 13 }}>Belum ada klaim</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {claims.slice(0, 10).map(c => (
              <div key={c.kode} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f9f5f2', borderRadius: 8, gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 500, color: '#FF585D' }}>{c.kode}</span>
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 99, background: '#fff0f0', color: '#d93f44' }}>{c.tier?.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#2C1810' }}>{c.nama} · {c.whatsapp}</div>
                  <div style={{ fontSize: 11, color: '#8B6555', marginTop: 2 }}>
                    {new Date(c.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {c.channel && ` · ${c.channel}`}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!window.confirm(`Hapus klaim ${c.kode} (${c.whatsapp})?`)) return
                    await supabase.from('ks_claims').delete().eq('kode', c.kode)
                    await supabase.from('ks_device_fingerprints').delete().eq('whatsapp', c.whatsapp)
                    showMsg(`✅ Klaim ${c.kode} dihapus`)
                    fetchData()
                  }}
                  style={{ padding: '6px 12px', background: '#fff0f0', border: '0.5px solid #FF585D', borderRadius: 6, fontSize: 12, color: '#d93f44', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  🗑️ Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESET TOTAL */}
      <div style={{ background: '#fff0f0', border: '0.5px solid #FF585D', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#d93f44', marginBottom: 8 }}>⚠️ Reset Total Data Test</div>
        <p style={{ fontSize: 13, color: '#8B6555', lineHeight: 1.5, marginBottom: 14 }}>
          Hapus <strong>semua</strong> klaim, visitor, fingerprint, dan reset stok ke angka awal. Gunakan hanya saat pilot testing.
        </p>
        <button
          onClick={resetAllTestData}
          disabled={resetting}
          style={{ width: '100%', padding: 13, background: resetting ? '#ccc' : '#d93f44', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: resetting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          {resetting ? 'Mereset...' : '🗑️ Reset Semua Data Test'}
        </button>
      </div>
    </div>
  )
}
