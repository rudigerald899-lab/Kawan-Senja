import Header from './Header.jsx'

export default function AlreadyClaimed({ kode }) {
  return (
    <div className="app-shell">
      <Header subtitle="by PT Multi Bintang Indonesia" />
      <div className="body" style={{ textAlign: 'center', paddingTop: 32 }}>

        <div style={{ fontSize: 52, marginBottom: 16 }}>🎟️</div>

        <h2 style={{ fontSize: 20, fontWeight: 500, color: '#2C1810', marginBottom: 8 }}>
          Kamu sudah ikut program ini!
        </h2>
        <p style={{ fontSize: 14, color: '#8B6555', lineHeight: 1.7, marginBottom: 24 }}>
          Perangkat ini sudah pernah mengikuti program hadiah Kawan Senja. Setiap perangkat hanya bisa ikut <strong>1 kali</strong> selama periode campaign berlangsung.
        </p>

        {kode && (
          <div style={{ background: '#f5ede7', border: '0.5px solid #c4845e', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#8B6555', marginBottom: 4 }}>Kode klaim kamu sebelumnya</div>
            <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: 4, color: '#8F573A', fontFamily: 'monospace' }}>{kode}</div>
            <div style={{ fontSize: 12, color: '#8B6555', marginTop: 6 }}>
              Hubungi tim MBI jika kamu belum menerima hadiah.
            </div>
          </div>
        )}

        <div style={{ background: '#fff', border: '0.5px solid #e8d5c9', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#2C1810', marginBottom: 10 }}>Ada pertanyaan?</div>
          <div style={{ fontSize: 13, color: '#8B6555', lineHeight: 1.6 }}>
            Hubungi tim MBI Bali via WhatsApp atau kunjungi kantor kami di:<br />
            <strong style={{ color: '#8F573A' }}>Jl. By Pass Ngurah Rai No. 100, Denpasar</strong>
          </div>
        </div>

        <div style={{ padding: 20, background: 'linear-gradient(135deg,#8F573A,#FF585D)', borderRadius: 12 }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', marginBottom: 4 }}>Kawan Senja</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>by PT Multi Bintang Indonesia</div>
        </div>

      </div>
    </div>
  )
}
