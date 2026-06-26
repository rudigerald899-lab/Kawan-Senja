import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import Welcome from './components/Welcome.jsx'
import Quiz from './components/Quiz.jsx'
import ScoreReveal from './components/ScoreReveal.jsx'
import ClaimForm from './components/ClaimForm.jsx'
import ClaimCode from './components/ClaimCode.jsx'
import Expired from './components/Expired.jsx'

const OUTLET_NAME = 'Tiara Dewata Supermarket'

function genCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let r = 'KS-'
  for (let i = 0; i < 4; i++) r += c[Math.floor(Math.random() * c.length)]
  return r
}

async function getIPLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/')
    const data = await res.json()
    return {
      ip_address: data.ip || null,
      kota: data.city || null,
      provinsi: data.region || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      isp: data.org || null,
      negara: data.country_name || null,
    }
  } catch {
    return { ip_address: null, kota: null, provinsi: null, latitude: null, longitude: null, isp: null, negara: null }
  }
}

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [expiredReason, setExpiredReason] = useState(null)
  const [stock, setStock] = useState({ t1: 0, t2: 0, t3: 0 })
  const [quizScore, setQuizScore] = useState(0)
  const [tierKey, setTierKey] = useState('t1')
  const [claimData, setClaimData] = useState(null)
  const [kode, setKode] = useState('')
  const [saving, setSaving] = useState(false)
  const [ipData, setIpData] = useState(null)

  useEffect(() => { initApp() }, [])

  async function initApp() {
    const ipResult = await getIPLocation()
    setIpData(ipResult)
    await checkCampaignAndStock()
    try {
      await supabase.from('ks_visits').insert({
        ip_address: ipResult.ip_address,
        kota: ipResult.kota,
        provinsi: ipResult.provinsi,
        latitude: ipResult.latitude,
        longitude: ipResult.longitude,
        isp: ipResult.isp,
        negara: ipResult.negara,
        halaman: 'welcome',
      })
    } catch { }
  }

  async function checkCampaignAndStock() {
    try {
      const { data: campaign } = await supabase
        .from('ks_campaign').select('*').eq('is_active', true).single()

      if (!campaign) { setExpiredReason('periode'); setScreen('expired'); return }

      const today = new Date().toISOString().split('T')[0]
      if (today > campaign.end_date || today < campaign.start_date) {
        setExpiredReason('periode'); setScreen('expired'); return
      }

      const { data: stockData } = await supabase.from('ks_stock').select('*')
      if (!stockData) { setScreen('welcome'); return }

      const stockMap = {}
      stockData.forEach(s => { stockMap[s.tier] = s.jumlah })
      setStock(stockMap)

      const allEmpty = stockData.every(s => s.jumlah <= 0)
      if (allEmpty) { setExpiredReason('stock'); setScreen('expired'); return }

      setScreen('welcome')
    } catch { setScreen('welcome') }
  }

  async function handleFormSubmit(formData) {
    setSaving(true)
    try {
      const code = genCode()
      const currentStock = stock[tierKey]
      if (currentStock <= 0) { setExpiredReason('stock'); setScreen('expired'); setSaving(false); return }

      const { error } = await supabase.from('ks_claims').insert({
        kode: code,
        nama: formData.nama,
        whatsapp: formData.wa,
        tier: tierKey,
        hadiah: tierKey === 't1' ? 'Voucher E-Money Rp 50.000' : tierKey === 't2' ? 'Merchandise Kawan Senja' : 'Paket Kawan Senja',
        emoney_platform: formData.emPlatform || null,
        emoney_hp: formData.emHp || null,
        delivery_type: formData.deliveryType || null,
        alamat: formData.alamat || null,
        kota: formData.kota || null,
        quiz_score: quizScore,
        ip_address: ipData?.ip_address || null,
        kota_ip: ipData?.kota || null,
        provinsi_ip: ipData?.provinsi || null,
        latitude_ip: ipData?.latitude || null,
        longitude_ip: ipData?.longitude || null,
        isp_ip: ipData?.isp || null,
        status: 'pending',
      })

      if (error) throw error

      await supabase.from('ks_stock')
        .update({ jumlah: currentStock - 1, updated_at: new Date().toISOString() })
        .eq('tier', tierKey)

      setKode(code)
      setClaimData(formData)
      setScreen('code')
    } catch { alert('Terjadi kesalahan. Coba lagi ya!') }
    setSaving(false)
  }

  if (screen === 'loading') return (
    <div className="app-shell">
      <div className="spinner-wrap">
        <div className="spinner" />
        <div className="spinner-text">Memuat program Kawan Senja...</div>
      </div>
    </div>
  )

  if (screen === 'expired') return <Expired reason={expiredReason} ipData={ipData} />
  if (screen === 'welcome') return <Welcome outletName={OUTLET_NAME} onStart={() => setScreen('quiz')} />
  if (screen === 'quiz') return <Quiz onFinish={(s) => { setQuizScore(s); setScreen('score') }} />
  if (screen === 'score') return <ScoreReveal score={quizScore} stock={stock} onClaim={(tk) => { setTierKey(tk); setScreen('form') }} />
  if (screen === 'form') return <ClaimForm tierKey={tierKey} score={quizScore} onSubmit={handleFormSubmit} loading={saving} />
  if (screen === 'code') return <ClaimCode tierKey={tierKey} kode={kode} nama={claimData?.nama} wa={claimData?.wa} formData={claimData} />
  return null
}
