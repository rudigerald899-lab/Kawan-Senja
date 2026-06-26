import { useState, useEffect } from 'react'
import Header from './Header.jsx'
import '../styles/Welcome.css'

export default function Welcome({ ipData, onStart, onLocationUpdate }) {
  const [showConsent, setShowConsent] = useState(false)
  const [lokasiLabel, setLokasiLabel] = useState('Mendeteksi lokasi...')
  const [gpsGranted, setGpsGranted] = useState(false)

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          getGPS()
        } else if (result.state === 'denied') {
          setLokasiFromIP()
        } else {
          setShowConsent(true)
          setLokasiFromIP()
        }
      })
    } else {
      setShowConsent(true)
      setLokasiFromIP()
    }
  }, [ipData])

  function setLokasiFromIP() {
    if (ipData?.kota && ipData?.provinsi) {
      setLokasiLabel(`${ipData.kota}, ${ipData.provinsi}`)
    } else if (ipData?.kota) {
      setLokasiLabel(ipData.kota)
    } else {
      setLokasiLabel('Lokasi tidak terdeteksi')
    }
  }

  function getGPS() {
    if (!navigator.geolocation) { setLokasiFromIP(); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setGpsGranted(true)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`)
          const data = await res.json()
          const kota = data.address?.city || data.address?.town || data.address?.county || ''
          const provinsi = data.address?.state || ''
          setLokasiLabel(kota ? `${kota}${provinsi ? ', ' + provinsi : ''}` : 'Lokasi terdeteksi')
          if (onLocationUpdate) onLocationUpdate({ latitude, longitude, kota, provinsi, source: 'gps' })
        } catch { setLokasiFromIP() }
      },
      () => setLokasiFromIP(),
      { timeout: 8000 }
    )
  }

  function handleAllowGPS() {
    setShowConsent(false)
    getGPS()
  }

  function handleDenyGPS() {
    setShowConsent(false)
    setLokasiFromIP()
  }

  return (
    <div className="app-shell">
      {showConsent && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(44,24,16,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 430, background: '#FDF6F0', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px' }}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>📍</div>
            <h3 style={{ fontSize: 17, fontWeight: 500, color: '#2C1810', marginBottom: 8, textAlign: 'center' }}>Boleh kami tahu lokasi kamu?</h3>
            <p style={{ fontSize: 13, color: '#8B6555', lineHeight: 1.6, marginBottom: 16, textAlign: 'center' }}>
              Kami meminta akses lokasi <strong>hanya untuk keperluan data program</strong> — mengetahui dari area mana program ini diakses. Data lokasi tidak akan dibagikan ke pihak ketiga.
            </p>
            <div style={{ background: '#f5ede7', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6B3E27', marginBottom: 8 }}>Berdasarkan UU PDP No. 27 Tahun 2022:</div>
              {[
                'Lokasi digunakan hanya untuk analisis sebaran akses program',
                'Data tidak disimpan melebihi periode program',
                'Kamu berhak menolak tanpa kehilangan akses ke program ini',
                'Data tidak akan dijual atau dibagikan ke pihak lain',
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: '#FF585D', fontSize: 12, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 12, color: '#8B6555', lineHeight: 1.4 }}>{t}</span>
                </div>
              ))}
            </div>
            <button onClick={handleAllowGPS} style={{ width: '100%', padding: 14, background: '#FF585D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit' }}>
              Izinkan Akses Lokasi
            </button>
            <button onClick={handleDenyGPS} style={{ width: '100%', padding: 12, background: 'transparent', color: '#8B6555', border: '0.5px solid #d4b8ab', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              Tidak, Lanjutkan Tanpa Lokasi
            </button>
            <p style={{ fontSize: 10, color: '#c4845e', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
              Dengan mengizinkan, kamu menyetujui penggunaan data lokasi sesuai <span style={{ textDecoration: 'underline' }}>Kebijakan Privasi</span> kami.
            </p>
          </div>
        </div>
      )}

      <Header subtitle="by PT Multi Bintang Indonesia" />
      <div className="body">
        <div className="outlet-chip">
          {gpsGranted ? '📍' : '🌐'} {lokasiLabel}
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
