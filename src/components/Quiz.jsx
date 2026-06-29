import { useState, useMemo } from 'react'
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

// Shuffle array — urutan acak setiap kali quiz dibuka
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function Quiz({ onFinish }) {
  const [curQ, setCurQ] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState(null)

  // Shuffle jawaban sekali saat komponen mount — tidak berubah saat re-render
  const shuffledQuestions = useMemo(() =>
    QUESTIONS.map(q => ({ ...q, opts: shuffle(q.opts) }))
  , [])

  const q = shuffledQuestions[curQ]
  const progress = ((curQ + 1) / shuffledQuestions.length) * 100

  function handleSelect(idx) {
    if (selectedIdx !== null) return
    setSelectedIdx(idx)
  }

  function handleNext() {
    if (selectedIdx === null) return
    const pts = q.opts[selectedIdx].pts
    const newTotal = totalScore + pts
    if (curQ + 1 < shuffledQuestions.length) {
      setTotalScore(newTotal)
      setCurQ(curQ + 1)
      setSelectedIdx(null)
    } else {
      onFinish(newTotal)
    }
  }

  return (
    <div className="app-shell">
      <Header subtitle={`Pertanyaan ${curQ + 1} dari ${shuffledQuestions.length}`} />
      <div className="body">
        <div className="prog-wrap">
          <div className="prog-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ fontSize: 11, color: '#8B6555', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
          Pertanyaan {curQ + 1}
        </div>
        <div style={{ fontSize: 17, fontWeight: 500, color: '#2C1810', lineHeight: 1.4, marginBottom: 18 }}>
          {q.text}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
          {q.opts.map((opt, i) => {
            const isSelected = selectedIdx === i
            const isLocked = selectedIdx !== null && !isSelected
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={isLocked}
                style={{
                  padding: '13px 15px',
                  background: isSelected ? '#fff0f0' : '#fff',
                  border: isSelected ? '0.5px solid #FF585D' : '0.5px solid #e8d5c9',
                  borderRadius: 8,
                  fontSize: 14,
                  color: isSelected ? '#d93f44' : isLocked ? '#c4b0a8' : '#2C1810',
                  fontWeight: isSelected ? 500 : 400,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  opacity: isLocked ? 0.5 : 1,
                  transition: 'all .15s',
                  width: '100%',
                }}
              >
                {opt.label}
                {/* POIN DISEMBUNYIKAN — tidak ada +4, +3, dll */}
              </button>
            )
          })}
        </div>
        {selectedIdx !== null && (
          <button className="btn-primary" onClick={handleNext}>
            {curQ + 1 < shuffledQuestions.length ? 'Lanjut' : 'Lihat Hasil'}
          </button>
        )}
      </div>
    </div>
  )
}
