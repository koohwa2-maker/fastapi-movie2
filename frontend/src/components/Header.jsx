import { useEffect, useState } from 'react'

const TABS = [
  { id: 'all', label: '홈' },
  { id: 'tv', label: 'TV 프로그램' },
  { id: 'movie', label: '영화' },
]

export default function Header({ tab, onTab, onSearch }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-left">
        <a className="logo" href="/" onClick={(e) => { e.preventDefault(); onTab('all'); window.scrollTo({ top: 0 }) }}>
          MOVIE<span>ON</span>
        </a>
        <nav className="nav">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => { onTab(t.id); window.scrollTo({ top: 0 }) }}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="header-right">
        <button className="icon-btn" aria-label="검색" onClick={onSearch}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
        </button>
        <div className="profile" aria-label="프로필" />
      </div>
    </header>
  )
}
