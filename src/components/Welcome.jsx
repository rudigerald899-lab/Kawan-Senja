import { useState, useEffect } from 'react'
import Header from './Header.jsx'
import '../styles/Welcome.css'

export default function Welcome({ ipData, onStart, onLocationUpdate }) {
  const [showConsent, setShowConsent] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [lokasiLabel, setLokasiLabel] = useState('Mendeteksi lokasi...')
  const [gpsGranted, setGpsGranted] = useState(false)

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') { getGPS() }
        else if (result.state === 'denied') { setLokasiFromIP() }
        else { setShowConsent(true); setLokasiFromIP() }
      }).catch(() => { setShowConsent(true); setLokasiFromIP() })
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
      fetchLocationFallback()
    }
  }

  async function fetchLocationFallback() {
    try {
      const res = await fetch('https://ipwho.is/')
      const data = await res.json()
      if (data.city) {
        setLokasiLabel(`${data.city}, ${data.region || ''}`)
      } else {
        setLokasiLabel('Indonesia')
      }
    } catch {
      setLokasiLabel('Indonesia')
    }
  }

  function getGPS() {
    if (!navigator.geolocation) { setLokasiFromIP(); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setGpsGranted(true)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`
          )
          const data = await res.json()
          const kota = data.address?.city || data.address?.town || data.address?.county || ''
          const provinsi = data.address?.state || ''
          setLokasiLabel(kota ? `${kota}${provinsi ? ', ' + provinsi : ''}` : 'Lokasi terdeteksi')
          if (onLocationUpdate) onLocationUpdate({ latitude, longitude, kota, provinsi, source: 'gps' })
        } catch { setLokasiFromIP() }
      },
      () => setLokasiFromIP(),
      { timeout: 8000, enableHighAccuracy: false }
    )
  }

  function handleAllowGPS() { setShowConsent(false); getGPS() }
  function handleDenyGPS() { setShowConsent(false); setLokasiFromIP() }

  // PRIVACY POLICY PAGE
  if (showPrivacy) {
    return (
      <div className="app-shell">
        <Header subtitle="Kebijakan Privasi" />
        <div className="body">
          <button
            onClick={() => setShowPrivacy(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#8F573A', fontSize: 14, fontFamily: 'inherit', marginBottom: 20, padding: 0 }}
          >
            ← Kembali
          </button>

          <h2 style={{ fontSize: 18, fontWeight: 500, color: '#2C1810', marginBottom: 6 }}>Kebijakan Privasi</h2>
          <p style={{ fontSize: 12, color: '#8B6555', marginBottom: 20 }}>Berlaku sejak: 1 Juli 2026 · PT Multi Bintang Indonesia</p>

          {[
            {
              title: '1. Data yang Kami Kumpulkan',
              content: 'Kami mengumpulkan nama, nomor WhatsApp, alamat pengiriman (jika dipilih), lokasi perangkat (jika diizinkan), foto display POSM (jika diunggah), skor quiz, dan informasi teknis perangkat seperti alamat IP dan jenis browser.'
            },
            {
              title: '2. Tujuan Penggunaan Data',
              content: 'Data digunakan untuk: (a) memproses dan mengirimkan hadiah program, (b) menganalisis efektivitas penempatan display POSM, (c) mencegah kecurangan dalam program hadiah, dan (d) menghubungi pemenang melalui WhatsApp.'
            },
            {
              title: '3. Dasar Hukum',
              content: 'Pengumpulan dan pemrosesan data ini dilakukan berdasarkan UU Perlindungan Data Pribadi No. 27 Tahun 2022 (UU PDP) dengan dasar persetujuan (consent) yang diberikan secara sukarela oleh pengguna.'
            },
            {
              title: '4. Penyimpanan Data',
              content: 'Data disimpan secara aman di server Supabase (region Asia Tenggara) dan hanya dapat diakses oleh tim resmi PT Multi Bintang Indonesia. Data tidak akan dijual, disewakan, atau dibagikan kepada pihak ketiga untuk keperluan komersial.'
            },
            {
              title: '5. Data Lokasi',
              content: 'Akses lokasi bersifat opsional. Jika Anda memberikan izin, data lokasi digunakan hanya untuk keperluan analisis sebaran program dan tidak disimpan secara permanen setelah periode campaign berakhir.'
            },
            {
              title: '6. Hak Pengguna',
              content: 'Sesuai UU PDP, Anda berhak untuk: mengakses data pribadi Anda, meminta koreksi data yang tidak akurat, meminta penghapusan data, dan mencabut persetujuan kapan saja. Untuk menggunakan hak ini, hubungi kami melalui kontak di bawah.'
            },
            {
              title: '7. Retensi Data',
              content: 'Data klaim hadiah disimpan selama maksimal 1 (satu) tahun setelah program berakhir untuk keperluan audit dan pelaporan internal, setelah itu akan dihapus secara permanen.'
            },
            {
              title: '8. Kontak',
              content: 'Untuk pertanyaan terkait privasi data, hubungi tim PT Multi Bintang Indonesia di: Jl. By Pass Ngurah Rai No. 100, Denpasar, Bali.'
            },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2C1810', marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: '#8B6555', lineHeight: 1.7 }}>{item.content}</div>
            </div>
          ))}

          <div style={{ background: '#f5ede7', borderRadius: 10, padding: 14, marginTop: 8 }}>
            <div style={{ fontSize: 12, color: '#6B3E27', lineHeight: 1.6 }}>
              Dengan menggunakan aplikasi ini dan mengikuti program hadiah Kawan Senja, Anda menyatakan telah membaca dan menyetujui Kebijakan Privasi ini.
            </div>
          </div>

          <button className="btn-primary" onClick={() => setShowPrivacy(false)} style={{ marginTop: 24 }}>
            Saya Mengerti
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {/* CONSENT MODAL */}
      {showConsent && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(44,24,16,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 430, background: '#FDF6F0', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px' }}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>📍</div>
            <h3 style={{ fontSize: 17, fontWeight: 500, color: '#2C1810', marginBottom: 8, textAlign: 'center' }}>
              Boleh kami tahu lokasi kamu?
            </h3>
            <p style={{ fontSize: 13, color: '#8B6555', lineHeight: 1.6, marginBottom: 16, textAlign: 'center' }}>
              Kami meminta akses lokasi <strong>hanya untuk keperluan data program</strong>. Data lokasi tidak akan dibagikan ke pihak ketiga.
            </p>
            <div style={{ background: '#f5ede7', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6B3E27', marginBottom: 8 }}>
                Berdasarkan UU PDP No. 27 Tahun 2022:
              </div>
              {[
                'Lokasi digunakan hanya untuk analisis sebaran akses program',
                'Data tidak disimpan melebihi periode campaign',
                'Kamu berhak menolak tanpa kehilangan akses ke program ini',
                'Data tidak akan dijual atau dibagikan ke pihak lain',
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: '#FF585D', fontSize: 12, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 12, color: '#8B6555', lineHeight: 1.4 }}>{t}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleAllowGPS}
              style={{ width: '100%', padding: 14, background: '#FF585D', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit' }}
            >
              Izinkan Akses Lokasi
            </button>
            <button
              onClick={handleDenyGPS}
              style={{ width: '100%', padding: 12, background: 'transparent', color: '#8B6555', border: '0.5px solid #d4b8ab', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Tidak, Lanjutkan Tanpa Lokasi
            </button>
            <p style={{ fontSize: 10, color: '#c4845e', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
              Dengan mengizinkan, kamu menyetujui{' '}
              <span
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() => { setShowConsent(false); setShowPrivacy(true) }}
              >
                Kebijakan Privasi
              </span>{' '}kami.
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
        <p className="welcome-sub">
          Jawab 3 pertanyaan tentang Kawan Senja dan menangkan hadiah menarik. Cepat, gratis, dan seru!
        </p>

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

        {/* TIER — tanpa info skor, hanya tampil jenis hadiah */}
        <div className="tier-row">
          <div className="tier-card t1">
            <div className="tier-icon">💳</div>
            <div className="tier-name">Voucher E-Money</div>
          </div>
          <div className="tier-card t2">
            <div className="tier-icon">🎁</div>
            <div className="tier-name">Hadiah Dikirim</div>
          </div>
          <div className="tier-card t3">
            <div className="tier-icon">📦</div>
            <div className="tier-name">Paket Spesial</div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#8B6555', textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>
          🎲 Setiap peserta berpeluang mendapat salah satu hadiah di atas
        </p>

        <button className="btn-primary" onClick={onStart}>Mulai Quiz Sekarang</button>
        <p className="privacy-note">
          Data kamu aman &amp; hanya untuk keperluan hadiah.{' '}
          <a
            className="plink"
            onClick={() => setShowPrivacy(true)}
            style={{ cursor: 'pointer' }}
          >
            Kebijakan Privasi
          </a>
        </p>
      </div>
    </div>
  )
}
