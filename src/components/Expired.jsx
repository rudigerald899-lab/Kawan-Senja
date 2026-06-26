import { useState } from 'react'
import Header from './Header.jsx'
import { supabase } from '../supabase.js'

export default function Expired({ reason }) {
  const [nama, setNama] = useState('')
  const [wa, setWa] = useState('')
  const [wantsNotif, setWantsNotif] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const isStockHabis = reason === 'stock'
  const isPeriodeHabis = reason === 'periode'

  async function handleSubmit() {
    if (!nama.trim() || !wa.trim()) { alert('Isi nama dan nomor WA kamu dulu ya!'); return }
    setLoading(true)
    try {
      await supabase.from('ks_visits_expired').insert({
        nama: nama.trim(),
        whatsapp: wa.trim(),
        wants_notif: wantsNotif,
        reason,
      })
      setSubmitted(true)
    } catch (e) {
      alert('Gagal menyimpan. Coba lagi ya!')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="app-shell">
        <Header subtitle="by PT Multi Bintang Indonesia" />
        <div className="body" style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 500, color: 'var(--ks-text)', marginBottom: 8 }}>
            Terima kasih, {nama}!
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ks-text-muted)', lineHeight: 1.6 }}>
            {wantsNotif
              ? 'Kami akan menghubungi kamu via WhatsApp saat program Kawan Senja berikutnya dimulai. Sampai jumpa!'
              : 'Terima kasih sudah mengunjungi program Kawan Senja. Sampai jumpa di program berikutnya!'}
          </p>
          <div style={{ marginTop: 32, padding: 20, background: 'var(--ks-brown-light)', borderRadius: 12, border: '0.5px solid var(--ks-border)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🍺</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ks-brown-dark)', marginBottom: 4 }}>Kawan Senja</div>
            <div style={{ fontSize: 12, color: 'var(--ks-text-muted)' }}>by PT Multi Bintang Indonesia</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Header subtitle="by PT Multi Bintang Indonesia" />
      <div className="body">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {isStockHabis ? '🎁' : '⏰'}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 500, color: 'var(--ks-text)', marginBottom: 8 }}>
            {isStockHabis ? 'Hadiah sudah habis!' : 'Program sudah berakhir'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ks-text-muted)', lineHeight: 1.6 }}>
            {isStockHabis
              ? 'Semua hadiah program Kawan Senja sudah diklaim. Terima kasih antusiasmenya!'
              : 'Program hadiah Kawan Senja untuk periode ini sudah berakhir. Nantikan program berikutnya!'}
          </p>
        </div>

        <div style={{ background: 'var(--ks-brown-light)', border: '0.5px solid var(--ks-border)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ks-brown-dark)', marginBottom: 4 }}>
            🔔 Mau tahu duluan program berikutnya?
          </div>
          <div style={{ fontSize: 12, color: 'var(--ks-text-muted)', lineHeight: 1.5 }}>
            Daftarkan dirimu dan kami akan hubungi via WhatsApp saat program Kawan Senja berikutnya mulai.
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nama kamu</label>
          <input className="form-input" type="text" placeholder="Contoh: Wayan Agus" value={nama} onChange={e => setNama(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Nomor WhatsApp</label>
          <input className="form-input" type="tel" placeholder="08xxxxxxxxxx" value={wa} onChange={e => setWa(e.target.value)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 14px', background: '#fff', border: '0.5px solid var(--ks-border)', borderRadius: 'var(--radius)', cursor: 'pointer' }} onClick={() => setWantsNotif(!wantsNotif)}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: wantsNotif ? 'var(--ks-coral)' : '#fff', border: wantsNotif ? 'none' : '1.5px solid var(--ks-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {wantsNotif && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
          </div>
          <span style={{ fontSize: 13, color: 'var(--ks-text)' }}>
            Ya, kabari saya saat program berikutnya dimulai
          </span>
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Menyimpan...' : 'Daftar Waiting List'}
        </button>
        <p className="privacy-note">
          Data kamu aman &amp; hanya dipakai untuk notifikasi program Kawan Senja.
        </p>
      </div>
    </div>
  )
}
