import { useEffect, useRef, useState } from 'react'
import { searchContents } from '../api'

export default function SearchOverlay({ onClose, onOpen }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const query = q.trim()
    if (!query) { setResults(null); return }
    const t = setTimeout(() => {
      searchContents(query).then((d) => { setResults(d.results); setError('') }).catch((e) => setError(e.message))
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="search-overlay">
      <div className="search-bar">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목, 인물명으로 검색해보세요."
        />
        <button className="icon-btn" aria-label="닫기" onClick={onClose}>✕</button>
      </div>
      <div className="search-results">
        {error && <p className="empty">{error}</p>}
        {results && results.length === 0 && <p className="empty">'{q}'에 대한 검색 결과가 없습니다.</p>}
        {results && results.length > 0 && (
          <div className="similar-grid">
            {results.filter((r) => r.poster).map((r) => (
              <button key={`${r.media_type}-${r.id}`} className="card" onClick={() => onOpen(r)}>
                <div className="card-thumb"><img src={r.poster} alt={r.title} loading="lazy" /></div>
                <p className="card-title">{r.title}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
