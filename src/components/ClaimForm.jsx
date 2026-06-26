import { useState } from 'react'
import Header from './Header.jsx'
import { TIERS } from './ScoreReveal.jsx'

export default function ClaimForm({ tierKey, score, onSubmit, loading }) {
  const tier = TIERS[tierKey]
  const [nama, setNama] = useState('')
  const [wa, setWa] = useState('')
  const [emPlatform, setEmPlatform] = useState('GoPay')
  const [emHp, setEmHp] = useState('')
  const [deliveryType, setDeliveryType] = useState('delivery')
  const [alamat, setAlamat] = useState('')
  const [kota, setKota] = useState('')

  function handleSubmit() {
    if (!nama.trim()) { alert('Masukkan nama kamu dulu ya!'); return }
    if (!wa.trim()) { alert('Masukkan nomor WhatsApp kamu dulu ya!'); return }
    if (tierKey === 't1' && !emHp.trim()) { alert('Masukkan nomor HP e-money kamu!'); return }
    if ((tierKey === 't2' || (tierKey === 't3' && deliveryType === 'delivery')) && !alamat.trim()) {
      alert('Masukkan alamat pengiriman kamu!'); return
    }

    onSubmit({ nama, wa, emPlatform, emHp, deliveryType, alamat, kota })
  }

  const EMONEY = ['GoPay', 'OVO', 'Dana']

  return (
    <div className="app-shell">
      <Header subtitle="Isi Data untuk Klaim" />
      <div className="body">
        <div className={`tier-badge ${tier.badgeClass}`}>
          {tier.icon} {tier.label}
        </div>

        {/* T1: E-MONEY */}
        {tierKey === 't1' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--ks-text-muted)', marginBottom: 10 }}>Pilih platform e-money kamu:</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {EMONEY.map(p => (
                <button
                  key={p}
                  onClick={() => setEmPlatform(p)}
                  style={{
                    flex: 1, padding: '10px 6px',
                    background: emPlatform === p ? 'var(--ks-coral-light)' : '#fff',
                    border: emPlatform === p ? '0.5px solid var(--ks-coral)' : '0.5px solid var(--ks-border)',
                    borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 2 }}>
                    {p === 'GoPay' ? '💚' : p === 'OVO' ? '💜' : '💙'}
                  </div>
                  <div style={{ fontSize: 11, color: emPlatform === p ? 'var(--ks-coral-dark)' : 'var(--ks-text-muted)', fontWeight: 500 }}>{p}</div>
                </button>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Nomor HP terdaftar di {emPlatform}</label>
              <input className="form-input" type="tel" placeholder="08xxxxxxxxxx" value={emHp} onChange={e => setEmHp(e.target.value)} />
            </div>
          </div>
        )}

        {/* T2: DIKIRIM */}
        {tierKey === 't2' && (
          <div>
            <div style={{ background: 'var(--ks-brown-light)', border: '0.5px solid var(--ks-border)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ fontSize: 20 }}>📦</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ks-text)' }}>Dikirim ke alamat kamu</div>
                <div style={{ fontSize: 11, color: 'var(--ks-text-muted)', marginTop: 2 }}>Gratis ongkir, estimasi 3–5 hari kerja</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Alamat lengkap pengiriman</label>
              <input className="form-input" type="text" placeholder="Jl. nama jalan, no rumah, kelurahan..." value={alamat} onChange={e => setAlamat(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Kota / Kabupaten</label>
              <input className="form-input" type="text" placeholder="Contoh: Denpasar" value={kota} onChange={e => setKota(e.target.value)} />
            </div>
          </div>
        )}

        {/* T3: PILIH DELIVERY / KANTOR */}
        {tierKey === 't3' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--ks-text-muted)', marginBottom: 10 }}>Pilih cara terima hadiah:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {[
                { key: 'delivery', icon: '📦', title: 'Dikirim ke alamat kamu', sub: 'Gratis ongkir, estimasi 3–5 hari kerja' },
                { key: 'office', icon: '🏢', title: 'Ambil di Kantor MBI Bali', sub: 'Jl. By Pass Ngurah Rai No. 100, Denpasar' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setDeliveryType(opt.key)}
                  style={{
                    padding: '12px 14px', background: deliveryType === opt.key ? 'var(--ks-coral-light)' : '#fff',
                    border: deliveryType === opt.key ? '0.5px solid var(--ks-coral)' : '0.5px solid var(--ks-border)',
                    borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 20 }}>{opt.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: deliveryType === opt.key ? 'var(--ks-coral-dark)' : 'var(--ks-text)' }}>{opt.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ks-text-muted)', marginTop: 2 }}>{opt.sub}</div>
                  </div>
                </button>
              ))}
            </div>
            {deliveryType === 'delivery' && (
              <>
                <div className="form-group">
                  <label className="form-label">Alamat lengkap pengiriman</label>
                  <input className="form-input" type="text" placeholder="Jl. nama jalan, no rumah, kelurahan..." value={alamat} onChange={e => setAlamat(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kota / Kabupaten</label>
                  <input className="form-input" type="text" placeholder="Contoh: Denpasar" value={kota} onChange={e => setKota(e.target.value)} />
                </div>
              </>
            )}
          </div>
        )}

        <div className="divider" />

        <div className="form-group">
          <label className="form-label">Nama lengkap</label>
          <input className="form-input" type="text" placeholder="Contoh: Wayan Agus" value={nama} onChange={e => setNama(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Nomor WhatsApp aktif</label>
          <input className="form-input" type="tel" placeholder="08xxxxxxxxxx" value={wa} onChange={e => setWa(e.target.value)} />
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Menyimpan...' : 'Konfirmasi & Dapatkan Kode'}
        </button>
        <p className="privacy-note">
          Dengan melanjutkan kamu menyetujui <a className="plink">Syarat &amp; Ketentuan</a> dan memberikan consent penyimpanan data.
        </p>
      </div>
    </div>
  )
}
