import { useState } from 'react'
import Header from './Header.jsx'

const QUESTIONS = [
  {
    text: 'Kawan Senja paling pas dinikmati kapan?',
    opts: [
      { label: 'Saat matahari terbenam, santai di tepi pantai', pts: 4 },
      { label: 'Setelah seharian kerja keras', pts: 3 },
      { label: 'Kumpul bareng teman-teman', pts: 2 },
      { label: 'Kapan saja, sesuka hati!', pts: 1 },
    ],
  },
  {
    text: 'Menurut kamu, apa yang bikin Kawan Senja beda?',
    opts: [
      { label: 'Ukuran 500ml — pas buat nemenin senja', pts: 4 },
      { label: 'Rasanya smooth dan segar', pts: 3 },
      { label: 'Cocok di berbagai momen santai', pts: 2 },
      { label: 'Botolnya keren dan gampang dibawa', pts: 1 },
    ],
  },
  {
    text: 'Kalau menikmati Kawan Senja, kamu paling suka bareng siapa?',
    opts: [
      { label: 'Sahabat karib — makin rame makin seru', pts: 4 },
      { label: 'Pasangan — romantis saat senja', pts: 3 },
      { label: 'Teman kerja — after office hours', pts: 2 },
      { label: 'Sendirian — me time yang tenang', pts: 1 },
    ],
  },
]

export default function Quiz({ onFinish }) {
  const [curQ, setCurQ] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState(null)

  const progress = ((curQ + 1) / QUESTIONS.length) * 100
  const q = QUESTIONS[curQ]

  function handleSelect(pts) {
    if (selected !== null) return
    setSelected(pts)
  }

  function handleNext() {
    if (selected === null) return
    const newScore = score + selected
    if (curQ + 1 < QUESTIONS.length) {
      setScore(newScore)
      setCurQ(curQ + 1)
      setSelected(null)
    } else {
      onFinish(newScore)
    }
  }

  return (
    <div className="app-shell">
      <Header subtitle={`Pertanyaan ${curQ + 1} dari ${QUESTIONS.length}`} />
      <div className="body">
        <div className="prog-wrap">
          <div className="prog-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--ks-text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
          Pertanyaan {curQ + 1}
        </div>
        <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--ks-text)', lineHeight: 1.4, marginBottom: 18 }}>
          {q.text}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
          {q.opts.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(opt.pts)}
              style={{
                padding: '13px 15px',
                background: selected === opt.pts ? 'var(--ks-coral-light)' : '#fff',
                border: selected === opt.pts ? '0.5px solid var(--ks-coral)' : '0.5px solid var(--ks-border)',
                borderRadius: 'var(--radius)',
                fontSize: 14,
                color: selected === opt.pts ? 'var(--ks-coral-dark)' : 'var(--ks-text)',
                fontWeight: selected === opt.pts ? 500 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'inherit',
                transition: 'all .15s',
              }}
            >
              {opt.label}
              {selected === opt.pts && (
                <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,88,93,.12)', color: 'var(--ks-coral-dark)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                  +{opt.pts}
                </span>
              )}
            </button>
          ))}
        </div>
        {selected !== null && (
          <button className="btn-primary" onClick={handleNext}>
            {curQ + 1 < QUESTIONS.length ? 'Lanjut' : 'Lihat Hasil'}
          </button>
        )}
      </div>
    </div>
  )
}
