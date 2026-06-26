import Header from './Header.jsx'
import '../styles/Welcome.css'

export default function Welcome({ outletName, onStart }) {
  return (
    <div className="app-shell">
      <Header subtitle="by PT Multi Bintang Indonesia" />
      <div className="body">
        <div className="outlet-chip">
          📍 {outletName}
        </div>
        <h1 className="welcome-title">Ada hadiah spesial buat kamu hari ini!</h1>
        <p className="welcome-sub">Jawab 3 pertanyaan tentang Kawan Senja dan menangkan hadiah menarik. Cepat, gratis, dan seru!</p>

        <div className="product-card">
          <div className="bottle-visual">
            <div className="bottle-label">
              <div className="bl-ks">KAWAN</div>
              <div className="bl-ks">SENJA</div>
              <div className="bl-500">500ml</div>
            </div>
          </div>
          <div className="prod-info">
            <div className="prod-name">Kawan Senja</div>
            <div className="prod-sub">Bir Botol — 500ml</div>
            <div className="prod-tag">by PT Multi Bintang Indonesia</div>
          </div>
        </div>

        <div className="tier-row">
          <div className="tier-card t1">
            <div className="tier-icon">💳</div>
            <div className="tier-name">Voucher E-Money</div>
            <div className="tier-score">Skor 8–10</div>
          </div>
          <div className="tier-card t2">
            <div className="tier-icon">🎁</div>
            <div className="tier-name">Hadiah Dikirim</div>
            <div className="tier-score">Skor 5–7</div>
          </div>
          <div className="tier-card t3">
            <div className="tier-icon">📦</div>
            <div className="tier-name">Paket Spesial</div>
            <div className="tier-score">Skor 1–4</div>
          </div>
        </div>

        <button className="btn-primary" onClick={onStart}>Mulai Quiz Sekarang</button>
        <p className="privacy-note">Data kamu aman &amp; hanya untuk keperluan hadiah. <a className="plink">Kebijakan Privasi</a></p>
      </div>
    </div>
  )
}
