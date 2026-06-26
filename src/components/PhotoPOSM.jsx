import { useState, useRef } from 'react'
import Header from './Header.jsx'
import { supabase } from '../supabase.js'

export default function PhotoPOSM({ onNext }) {
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [fotoUrl, setFotoUrl] = useState(null)
  const inputRef = useRef()

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setUploaded(false)
    setFotoUrl(null)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `posm_${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('posm-photos')
        .upload(fileName, file, { contentType: file.type, upsert: false })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('posm-photos')
        .getPublicUrl(fileName)

      setFotoUrl(urlData.publicUrl)
      setUploaded(true)
    } catch {
      alert('Upload gagal. Coba lagi ya!')
    }
    setUploading(false)
  }

  function handleSkip() {
    onNext(null)
  }

  function handleLanjut() {
    onNext(fotoUrl)
  }

  return (
    <div className="app-shell">
      <Header subtitle="Foto POSM" />
      <div className="body">

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
          <h2 style={{ fontSize: 19, fontWeight: 500, color: '#2C1810', marginBottom: 6 }}>
            Foto bareng display Kawan Senja
          </h2>
          <p style={{ fontSize: 13, color: '#8B6555', lineHeight: 1.6 }}>
            Foto display atau POSM tempat kamu scan QR code ini. Opsional, tapi sangat membantu kami!
          </p>
        </div>

        {/* UPLOAD AREA */}
        <div
          onClick={() => !preview && inputRef.current.click()}
          style={{
            border: preview ? '0.5px solid #e8d5c9' : '1.5px dashed #c4845e',
            borderRadius: 12,
            background: preview ? 'transparent' : '#f5ede7',
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: preview ? 'default' : 'pointer',
            overflow: 'hidden',
            marginBottom: 16,
            position: 'relative',
          }}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Preview POSM"
                style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
              />
              {uploaded && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  background: '#48A111', color: '#fff',
                  borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 500,
                }}>
                  ✓ Terupload
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#8F573A', marginBottom: 4 }}>
                Ketuk untuk pilih foto
              </div>
              <div style={{ fontSize: 12, color: '#8B6555' }}>
                JPG, PNG — maks 5MB
              </div>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* TOMBOL GANTI FOTO */}
        {preview && !uploaded && (
          <button
            onClick={() => inputRef.current.click()}
            style={{
              width: '100%', padding: '10px', background: 'transparent',
              border: '0.5px solid #e8d5c9', borderRadius: 8,
              fontSize: 13, color: '#8B6555', cursor: 'pointer',
              fontFamily: 'inherit', marginBottom: 12,
            }}
          >
            Ganti Foto
          </button>
        )}

        {/* UPLOAD BUTTON */}
        {preview && !uploaded && (
          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={uploading}
            style={{ marginBottom: 10 }}
          >
            {uploading ? 'Mengupload...' : 'Upload Foto Ini'}
          </button>
        )}

        {/* LANJUT SETELAH UPLOAD */}
        {uploaded && (
          <button className="btn-primary" onClick={handleLanjut}>
            Lanjut ke Klaim Hadiah
          </button>
        )}

        {/* SKIP */}
        <button
          onClick={handleSkip}
          style={{
            width: '100%', padding: 12, background: 'transparent',
            color: '#8B6555', border: '0.5px solid #d4b8ab',
            borderRadius: 8, fontSize: 14, cursor: 'pointer',
            fontFamily: 'inherit', marginTop: uploaded ? 10 : 0,
          }}
        >
          Lewati — Lanjut Tanpa Foto
        </button>

        <p style={{ fontSize: 11, color: '#8B6555', textAlign: 'center', lineHeight: 1.5, marginTop: 12 }}>
          Foto hanya digunakan untuk verifikasi penempatan display Kawan Senja.
          Tidak dibagikan ke pihak lain.
        </p>
      </div>
    </div>
  )
}
