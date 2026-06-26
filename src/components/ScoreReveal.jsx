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

export function getTierKey(score) {
  if (score >= 8) return 't1'
  if (score >= 5) return 't2'
  return 't3'
}

export { TIERS }

export default function ScoreReveal({ score, stock, onClaim }) {
  const tierKey = getTierKey(score)
  const tier = TIERS[tierKey]
  const stockCount = stock[tierKey] || 0

  const titles = {
    t1: 'Sempurna! Skor tertinggi!',
    t2: 'Bagus! Kamu dapat hadiah fisik.',
    t3: 'Selamat! Kamu menang hadiah MBI!',
  }
  const subs = {
    t1: 'Kamu masuk Tier 1 dan berhak dapat voucher e-money langsung!',
    t2: 'Kamu masuk Tier 2. Merchandise Kawan Senja dikirim ke alamatmu.',
    t3: 'Kamu masuk Tier 3. Hadiah spesial dikirim atau ambil di kantor MBI Bali.',
  }

  return (
    <div className="app-shell">
      <Header subtitle="Hasil Quiz" />
      <div className="body">
        <div style={{ textAlign: 'center', padding: '8px 0 18px' }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', border: '3px solid',
            ...tier.circleStyle,
          }}>
            <div style={{ fontSize: 28, fontWeight: 500, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 11, opacity: .75 }}>dari 10</div>
          </div>
          <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--ks-text)', marginBottom: 4 }}>{titles[tierKey]}</div>
          <div style={{ fontSize: 13, color: 'var(--ks-text-muted)', marginBottom: 18, lineHeight: 1.5 }}>{subs[tierKey]}</div>
        </div>

        <div style={{ background: tier.bannerBg, borderRadius: 12, padding: 18, color: '#fff', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', opacity: .8, marginBottom: 3 }}>Hadiah kamu</div>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, opacity: .9 }}>{tier.label}</div>
          <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{tier.reward}</div>
          <div style={{ fontSize: 12, opacity: .8, lineHeight: 1.4 }}>{tier.desc}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.18)', borderRadius: 6, padding: '4px 10px', fontSize: 11, marginTop: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', opacity: .8, display: 'inline-block' }} />
            Stok: {stockCount} hadiah tersedia
          </div>
        </div>

        <button className="btn-primary" onClick={() => onClaim(tierKey)}>
          Lanjut Isi Data Klaim
        </button>
      </div>
    </div>
  )
}
