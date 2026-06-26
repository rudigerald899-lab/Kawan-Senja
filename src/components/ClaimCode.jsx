import Header from './Header.jsx'
import { TIERS } from './ScoreReveal.jsx'

export default function ClaimCode({ tierKey, kode, nama, wa, formData }) {
  const tier = TIERS[tierKey]

  const steps = {
    t1: [
      'Simpan kode ini di layar HP kamu',
      `Tim MBI menghubungi WA ${wa} dalam 1×24 jam`,
      `Voucher ${formData.emPlatform} dikirim ke nomor HP yang kamu isi`,
    ],
    t2: [
      'Simpan kode ini',
      `Tim MBI menghubungi WA ${wa} untuk konfirmasi alamat`,
      'Merchandise Kawan Senja dikirim ke alamatmu (3–5 hari kerja)',
    ],
    t3: formData.deliveryType === 'delivery'
      ? [
          'Simpan kode ini',
          `Tim MBI menghubungi WA ${wa} untuk konfirmasi`,
          'Paket Kawan Senja dikirim ke alamatmu (3–5 hari kerja)',
        ]
      : [
          'Simpan kode ini',
          `Tim MBI menghubungi WA ${wa} untuk konfirmasi`,
          'Ambil hadiah di Kantor MBI Bali, Jl. By Pass Ngurah Rai No. 100 — Senin–Jumat 09.00–17.00',
        ],
  }

  function shareWA() {
    const msg = `Halo! Saya ${nama} baru dapat hadiah dari Kawan Senja 🍺\n\n${tier.label}\nHadiah: ${tier.reward}\nKode: *${kode}*\n\nBerlaku hari ini saja!`
    window.open('https://wa.me/?text=' + encodeURIComponent(msg))
  }

  return (
    <div className="app-shell">
      <Header subtitle="Kode Berhasil Dibuat" />
      <div className="body" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
        <div className={`tier-badge ${tier.badgeClass}`} style={{ display: 'inline-flex', marginBottom: 10 }}>
          {tier.icon} {tier.label}
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 500, color: 'var(--ks-text)', marginBottom: 5 }}>
          Halo {nama}! Kode kamu siap.
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ks-text-muted)', marginBottom: 4 }}>{tier.reward}</p>

        <div style={{ background: '#fff', border: '1.5px dashed var(--ks-coral)', borderRadius: 12, padding: 22, margin: '14px 0' }}>
          <div style={{ fontSize: 11, color: 'var(--ks-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Kode klaim</div>
          <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: 6, color: 'var(--ks-brown-dark)', fontFamily: 'monospace' }}>{kode}</div>
          <div style={{ fontSize: 11, color: 'var(--ks-text-muted)', marginTop: 6 }}>Berlaku hingga: <strong>Hari ini, 23:59 WITA</strong></div>
        </div>

        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
          {steps[tierKey].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--ks-brown)', color: '#fff', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ks-text-muted)', lineHeight: 1.5 }}>{s}</div>
            </div>
          ))}
        </div>

        <button className="btn-primary" onClick={shareWA}>Bagikan via WhatsApp</button>
      </div>
    </div>
  )
}
