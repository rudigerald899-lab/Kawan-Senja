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
    setClaims(prev => prev.filter(c => c.whatsapp !== wa))
    setFingerprints(prev => prev.filter(f => f.whatsapp !== wa))
    setWaInput('')
    showMsg(`✅ Nomor ${wa} berhasil di-unblock`)
  }

  async function unblockFingerprint(id, wa) {
    await supabase.from('ks_device_fingerprints').delete().eq('id', id)
    setFingerprints(prev => prev.filter(f => f.id !== id))
    showMsg(`✅ Device ${wa || 'unknown'} berhasil di-unblock`)
  }

  async function deleteClaim(kode, whatsapp) {
    if (!window.confirm(`Hapus klaim ${kode} (${whatsapp})?`)) return
    await supabase.from('ks_claims').delete().eq('kode', kode)
    await supabase.from('ks_device_fingerprints').delete().eq('whatsapp', whatsapp)
    setClaims(prev => prev.filter(c => c.kode !== kode))
    setFingerprints(prev => prev.filter(f => f.whatsapp !== whatsapp))
    showMsg(`✅ Klaim ${kode} dihapus`)
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
    setClaims([])
    setFingerprints([])
    setResetting(false)
    showMsg('✅ Semua data test berhasil direset')
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#8B6555' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #f0e4dc', borderTopColor: '#FF585D', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Memuat data...
    </div>
  )

  return (
    <div style={{ maxWidth: 800 }}>

      {/* NOTIF */}
      {msg && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: msg.type === 'error' ? '#fff0f0' : '#eaf3de', border: `1px solid ${msg.type === 'error' ? '#FF585D' : '#48A111'}`, borderRadius: 10, padding: '12px 24px', fontSize: 14, color: msg.type === 'error' ? '#d93f44' : '#3B6D11', fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,.12)', whiteSpace: 'nowrap' }}>
          {msg.text}
        </div>
      )}

      <div style={{ fontSize: 13, color: '#8B6555', marginBottom: 24, background: '#fff8ee', border: '1px solid #E8A045', borderRadius: 10, padding: '12px 16px' }}>
        ⚠️ Halaman ini khusus untuk <strong>pilot testing</strong>. Gunakan dengan hati-hati karena aksi di sini tidak bisa di-undo.
      </div>

      {/* UNBLOCK BY WA */}
      <div style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#2C1810', marginBottom: 6 }}>🔓 Unblock Nomor WA Tertentu</div>
        <p style={{ fontSize: 13, color: '#8B6555', marginBottom: 16, lineHeight: 1.6 }}>
          Hapus record klaim dan fingerprint berdasarkan nomor WA. HP tersebut bisa ikut program lagi setelah browser di-clear.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="tel"
            placeholder="08xxxxxxxxxx"
            value={waInput}
            onChange={e => setWaInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && unblockByWA()}
            style={{ flex: 1, padding: '10px 16px', background: '#faf7f5', border: '1px solid #f0e4dc', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
          />
          <button
            onClick={unblockByWA}
            style={{ padding: '10px 20px', background: '#FF585D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Unblock
          </button>
        </div>
      </div>

      {/* DEVICE TERBLOKIR */}
      <div style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#2C1810' }}>📱 Device Terblokir ({fingerprints.length})</div>
          <button
            onClick={fetchData}
            style={{ padding: '6px 14px', background: '#faf7f5', border: '1px solid #f0e4dc', borderRadius: 8, fontSize: 12, color: '#8B6555', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
          >
            🔄 Refresh
          </button>
        </div>
        {fingerprints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#8B6555', fontSize: 13 }}>Belum ada device yang terblokir</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fingerprints.map(fp => (
              <div key={fp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#faf7f5', borderRadius: 10, gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1810' }}>{fp.whatsapp || 'WA tidak diketahui'}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                    {fp.kode_klaim && <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#FF585D', fontWeight: 600 }}>{fp.kode_klaim}</span>}
                    {fp.channel && <span style={{ fontSize: 12, color: '#8B6555' }}>· {fp.channel}</span>}
                    {fp.kota_ip && <span style={{ fontSize: 12, color: '#8B6555' }}>· 📍 {fp.kota_ip}</span>}
                    <span style={{ fontSize: 12, color: '#c4845e' }}>
                      · {new Date(fp.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => unblockFingerprint(fp.id, fp.whatsapp)}
                  style={{ padding: '7px 14px', background: '#fff0f0', border: '1px solid #FF585D', borderRadius: 8, fontSize: 12, color: '#d93f44', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  🔓 Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KLAIM TERBARU */}
      <div style={{ background: '#fff', border: '1px solid #f0e4dc', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#2C1810' }}>📋 Klaim Terbaru ({claims.length})</div>
          <button
            onClick={fetchData}
            style={{ padding: '6px 14px', background: '#faf7f5', border: '1px solid #f0e4dc', borderRadius: 8, fontSize: 12, color: '#8B6555', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
          >
            🔄 Refresh
          </button>
        </div>
        {claims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#8B6555', fontSize: 13 }}>Belum ada klaim</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {claims.map(c => (
              <div key={c.kode} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#faf7f5', borderRadius: 10, gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#FF585D' }}>{c.kode}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: c.tier === 't1' ? '#fff0f0' : c.tier === 't2' ? '#fff8ee' : '#f5ede7', color: c.tier === 't1' ? '#d93f44' : c.tier === 't2' ? '#7a5010' : '#6B3E27', fontWeight: 600 }}>
                      {c.tier?.toUpperCase()}
                    </span>
                    {c.channel && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#f5ede7', color: '#8F573A', fontWeight: 600 }}>{c.channel}</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810' }}>{c.nama}</div>
                  <div style={{ fontSize: 12, color: '#8B6555', marginTop: 2 }}>
                    {c.whatsapp} · {new Date(c.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  onClick={() => deleteClaim(c.kode, c.whatsapp)}
                  style={{ padding: '7px 14px', background: '#fff0f0', border: '1px solid #FF585D', borderRadius: 8, fontSize: 12, color: '#d93f44', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  🗑️ Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESET TOTAL */}
      <div style={{ background: '#fff0f0', border: '1px solid #FF585D', borderRadius: 12, padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#d93f44', marginBottom: 8 }}>⚠️ Reset Total Data Test</div>
        <p style={{ fontSize: 13, color: '#8B6555', lineHeight: 1.6, marginBottom: 16 }}>
          Hapus <strong>semua</strong> klaim, visitor, fingerprint, dan reset stok ke angka awal.<br />
          Gunakan hanya saat pilot testing. Aksi ini <strong>tidak bisa di-undo</strong>.
        </p>
        <button
          onClick={resetAllTestData}
          disabled={resetting}
          style={{ width: '100%', padding: 14, background: resetting ? '#ccc' : '#d93f44', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: resetting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          {resetting ? 'Mereset...' : '🗑️ Reset Semua Data Test'}
        </button>
      </div>

    </div>
  )
}
