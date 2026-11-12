import { useEffect, useMemo, useState } from 'react'
import { fetchHome } from './api'
import Header from './components/Header'
import HeroBanner from './components/HeroBanner'
import Row from './components/Row'
import DetailModal from './components/DetailModal'
import SearchOverlay from './components/SearchOverlay'
import Footer from './components/Footer'

export default function App() {
  const [home, setHome] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    fetchHome().then(setHome).catch((e) => setError(e.message))
  }, [])

  const { hero, sections } = useMemo(() => {
    if (!home) return { hero: [], sections: [] }
    if (tab === 'all') return home
    return {
      hero: home.hero.filter((h) => h.media_type === tab),
      sections: home.sections
        .map((s) => (s.media_type === 'all' ? { ...s, items: s.items.filter((i) => i.media_type === tab) } : s))
        .filter((s) => s.media_type === 'all' || s.media_type === tab),
    }
  }, [home, tab])

  const open = (item) => setSelected({ type: item.media_type, id: item.id })

  return (
    <>
      <Header tab={tab} onTab={setTab} onSearch={() => setSearchOpen(true)} />
      <main>
        {error && (
          <div className="error-box">
            <h2>데이터를 불러오지 못했습니다</h2>
            <p>{error}</p>
            <p className="hint">백엔드(FastAPI)가 실행 중인지, backend/.env 의 TMDB 키가 올바른지 확인하세요.</p>
          </div>
        )}
        {!home && !error && <div className="loading"><span className="spinner" /></div>}
        {home && (
          <>
            <HeroBanner items={hero.length ? hero : home.hero} onOpen={open} />
            <div className="rows">
              {sections.map((s) => s.items.length > 0 && <Row key={s.id} section={s} onOpen={open} />)}
            </div>
          </>
        )}
      </main>
      <Footer />
      {selected && <DetailModal {...selected} onClose={() => setSelected(null)} onOpen={open} />}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onOpen={open} />}
    </>
  )
}
