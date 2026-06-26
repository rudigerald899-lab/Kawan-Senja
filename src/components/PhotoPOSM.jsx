import { useState, useRef } from 'react'
import Header from './Header.jsx'
import { supabase } from '../supabase.js'

const MAX_WIDTH = 1024
const MAX_SIZE_KB = 300

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width)
        width = MAX_WIDTH
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      let quality = 0.85
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (blob.size / 1024 > MAX_SIZE_KB && quality > 0.3) {
              quality -= 0.1
              tryCompress()
            } else {
              URL.revokeObjectURL(url)
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
            }
          },
          'image/jpeg',
          quality
        )
      }
      tryCompress()
    }
    img.src = url
  })
}

export default function PhotoPOSM({ onNext }) {
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [fotoUrl, setFotoUrl] = useState(null)
  const [sizeInfo, setSizeInfo] = useState(null)
  const inputRef = useRef()

  async function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setUploaded(false)
    setFotoUrl(null)
    setSizeInfo(null)
    setCompressing(true)

    const originalKB = Math.round(f.size / 1024)
    const compressed = await compressImage(f)
    const compressedKB = Math.round(compressed.size / 1024)

    setFile(compressed)
    setPreview(URL.createObjectURL(compressed))
    setSizeInfo({ original: originalKB, compressed: compressedKB })
    setCompressing(false)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    try {
      const fileName = `posm_${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('posm-photos')
        .upload(fileName, file, { contentType: 'image/jpeg', upsert: false })

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
          onClick={() => !preview && !compressing && inputRef.current.click()}
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
            marginBottom: 12,
            position: 'relative',
          }}
        >
          {compressing ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ width: 32, height: 32, border: '3px solid #e8d5c9', borderTopColor: '#FF585D', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 10px' }} />
              <div style={{ fontSize: 13, color: '#8B6555' }}>Mengompresi foto...</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : preview ? (
            <>
              <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
              {uploaded && (
                <div style={{ position: 'absolute', top: 10, right: 10, background: '#48A111', color: '#fff', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 500 }}>
                  ✓ Terupload
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#8F573A', marginBottom: 4 }}>Ketuk untuk pilih foto</div>
              <div style={{ fontSize: 12, color: '#8B6555' }}>Foto akan dikompres otomatis</div>
            </>
          )}
        </div>

        {/* SIZE INFO */}
        {sizeInfo && !compressing && (
          <div style={{ background: '#eaf3de', borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#3B6D11' }}>✓ Foto dikompres</span>
            <span style={{ fontSize: 12, color: '#3B6D11', fontWeight: 500 }}>
              {sizeInfo.original} KB → {sizeInfo.compressed} KB
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {preview && !uploaded && !compressing && (
          <button
            onClick={() => inputRef.current.click()}
            style={{ width: '100%', padding: 10, background: 'transparent', border: '0.5px solid #e8d5c9', borderRadius: 8, fontSize: 13, color: '#8B6555', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}
          >
            Ganti Foto
          </button>
        )}

        {preview && !uploaded && !compressing && (
          <button className="btn-primary" onClick={handleUpload} disabled={uploading} style={{ marginBottom: 10 }}>
            {uploading ? 'Mengupload...' : 'Upload Foto Ini'}
          </button>
        )}

        {uploaded && (
          <button className="btn-primary" onClick={() => onNext(fotoUrl)}>
            Lanjut ke Klaim Hadiah
          </button>
        )}

        <button
          onClick={() => onNext(null)}
          style={{ width: '100%', padding: 12, background: 'transparent', color: '#8B6555', border: '0.5px solid #d4b8ab', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginTop: uploaded ? 10 : 0 }}
        >
          Lewati — Lanjut Tanpa Foto
        </button>

        <p style={{ fontSize: 11, color: '#8B6555', textAlign: 'center', lineHeight: 1.5, marginTop: 12 }}>
          Foto hanya untuk verifikasi penempatan display Kawan Senja. Tidak dibagikan ke pihak lain.
        </p>
      </div>
    </div>
  )
}
