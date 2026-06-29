import Header from './Header.jsx'

const TIERS = {
  t1: {
    label: 'Tier 1 — Voucher Digital',
    reward: 'Voucher E-Money Rp 50.000',
    desc: 'Pilih platform dan isi nomor HP-mu',
    icon: '💳',
    badgeClass: 'tb-t1',
    bannerBg: 'linear-gradient(135deg,#8F573A,#c4845e)',
    circleStyle: { background: '#fff0f0', borderColor: '#FF585D', color: '#d93f44' },
  },
  t2: {
    label: 'Tier 2 — Hadiah Dikirim',
    reward: 'Merchandise Kawan Senja',
    desc: 'Hadiah dikirim ke alamat kamu',
    icon: '🎁',
    badgeClass: 'tb-t2',
    bannerBg: 'linear-gradient(135deg,#7a5010,#E8A045)',
    circleStyle: { background: '#fff8ee', borderColor: '#E8A045', color: '#7a5010' },
  },
  t3: {
    label: 'Tier 3 — Paket Spesial MBI',
    reward: 'Paket Kawan Senja',
    desc: 'Dikirim atau ambil di kantor MBI Bali',
    icon: '📦',
    badgeClass: 'tb-t3',
    bannerBg: 'linear-gradient(135deg,#8F573A,#FF585D)',
    circleStyle: { background: '#f5ede7', borderColor: '#8F573A', color: '#6B3E27' },
  },
}

// Weighted probability berdasarkan skor
// Skor tinggi = peluang T1 lebih besar tapi tidak dijamin
// User tidak pernah tahu probabilitasnya
function assignTier(score, stock) {
  // Tentukan probability pool berdasarkan skor
  let weights
  if (score >= 8) {
    // Skor tinggi: peluang T1 besar tapi tidak 100%
    weights = { t1: 60, t2: 30, t3: 10 }
  } else if (score >= 5) {
    // Skor sedang: peluang T2 dominan
    weights = { t1: 15, t2: 60, t3: 25 }
  } else {
    // Skor rendah: peluang T3 dominan
    weights = { t1: 5, t2: 20, t3: 75 }
  }

  // Kalau stock tier habis → hapus dari pool
  if (stock.t1 <= 0) weights.t1 = 0
  if (stock.t2 <= 0) weights.t2 = 0
  if (stock.t3 <= 0) weights.t3 = 0

  const total = weights.t1 + weights.t2 + weights.t3
  if (total === 0) return null // semua habis

  // Random pick berdasarkan weight
  let rand = Math.random() * total
  if (rand < weights.t1) return 't1'
  rand -= weights.t1
  if (rand < weights.t2) return 't2'
  return 't3'
}

export { TIERS, assignTier }

export default function ScoreReveal({ score, stock, onClaim }) {
  const tierKey = assignTier(score, stock)

  if (!tierKey) {
    return (
      <div className="app-shell">
        <Header subtitle="Hasil Quiz" />
        <div className="body" style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
          <h2 style={{ fontSize: 20, fontWeight: 500, color: '#2C1810', marginBottom: 8 }}>Waduh, hadiah sudah habis!</h2>
          <p style={{ fontSize: 14, color: '#8B6555', lineHeight: 1.6 }}>Semua hadiah sudah diklaim. Terima kasih sudah ikut program Kawan Senja!</p>
        </div>
      </div>
    )
  }

  const tier = TIERS[tierKey]
  const stockCount = stock[tierKey] || 0

  const messages = {
    t1: 'Selamat! Kamu beruntung mendapat hadiah spesial!',
    t2: 'Kamu beruntung! Hadiah menanti kamu.',
    t3: 'Selamat! Kamu mendapat hadiah dari Kawan Senja!',
  }

  return (
    <div className="app-shell">
      <Header subtitle="Hasil Quiz" />
      <div className="body">
        <div style={{ textAlign: 'center', padding: '8px 0 18px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 19, fontWeight: 500, color: '#2C1810', marginBottom: 4 }}>
            {messages[tierKey]}
          </div>
          <div style={{ fontSize: 13, color: '#8B6555', marginBottom: 18, lineHeight: 1.5 }}>
            Isi data di bawah untuk klaim hadiahmu.
          </div>
        </div>

        <div style={{ background: tier.bannerBg, borderRadius: 12, padding: 18, color: '#fff', marginBottom: 18 }}>
          <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', opacity: .8, marginBottom: 3 }}>Hadiah kamu</div>
          <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{tier.reward}</div>
          <div style={{ fontSize: 12, opacity: .8, lineHeight: 1.4 }}>{tier.desc}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.18)', borderRadius: 6, padding: '4px 10px', fontSize: 11, marginTop: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', opacity: .8, display: 'inline-block' }} />
            Stok tersedia: {stockCount} hadiah
          </div>
        </div>

        <button className="btn-primary" onClick={() => onClaim(tierKey)}>
          Lanjut Isi Data Klaim
        </button>
      </div>
    </div>
  )
}
