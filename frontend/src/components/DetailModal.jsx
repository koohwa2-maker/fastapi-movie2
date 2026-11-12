import { useEffect, useState } from 'react'
import { fetchDetail } from '../api'

export default function DetailModal({ type, id, onClose, onOpen }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setData(null); setError(''); setPlaying(false)
    fetchDetail(type, id).then(setData).catch((e) => setError(e.message))
  }, [type, id])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="닫기" onClick={onClose}>✕</button>
        {error && <p className="modal-error">{error}</p>}
        {!data && !error && <div className="loading small"><span className="spinner" /></div>}
        {data && (
          <>
            <div className="modal-visual">
              {playing && data.trailer_key ? (
                <iframe
                  src={`https://www.youtube.com/embed/${data.trailer_key}?autoplay=1`}
                  title="trailer"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  {data.backdrop && <img src={data.backdrop} alt="" />}
                  <div className="modal-shade" />
                  <div className="modal-head">
                    <h2>{data.title}</h2>
                    {data.tagline && <p className="tagline">{data.tagline}</p>}
                    <div className="hero-actions">
                      {data.trailer_key
                        ? <button className="btn-primary" onClick={() => setPlaying(true)}>▶ 예고편 보기</button>
                        : <button className="btn-primary" disabled>예고편 없음</button>}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-body">
              <div className="modal-meta">
                {data.rating > 0 && <span className="rating">★ {data.rating}</span>}
                {data.date && <span>{data.date.slice(0, 4)}</span>}
                {data.runtime && <span>{data.runtime}분</span>}
                {data.seasons && <span>시즌 {data.seasons}개 · {data.episodes}화</span>}
                {data.genres.map((g) => <span key={g} className="chip">{g}</span>)}
              </div>
              <p className="modal-overview">{data.overview || '줄거리 정보가 없습니다.'}</p>
              {data.directors.length > 0 && (
                <p className="modal-credit"><b>{type === 'tv' ? '크리에이터' : '감독'}</b> {data.directors.join(', ')}</p>
              )}

              {data.cast.length > 0 && (
                <>
                  <h4 className="modal-sub">출연</h4>
                  <div className="cast-list">
                    {data.cast.map((c) => (
                      <div key={c.name + c.character} className="cast">
                        <div className="cast-img">{c.profile ? <img src={c.profile} alt={c.name} loading="lazy" /> : c.name[0]}</div>
                        <p className="cast-name">{c.name}</p>
                        <p className="cast-role">{c.character}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {data.similar.length > 0 && (
                <>
                  <h4 className="modal-sub">비슷한 콘텐츠</h4>
                  <div className="similar-grid">
                    {data.similar.map((s) => (
                      <button key={s.id} className="card" onClick={() => onOpen(s)}>
                        <div className="card-thumb"><img src={s.poster} alt={s.title} loading="lazy" /></div>
                        <p className="card-title">{s.title}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
