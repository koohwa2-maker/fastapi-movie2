import { useCallback, useEffect, useRef, useState } from 'react'

export default function Row({ section, onOpen }) {
  const { title, style, items } = section
  const trackRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const update = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update, items])

  const slide = (dir) => {
    const el = trackRef.current
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return (
    <section className={`row row-${style}`}>
      <h3 className="row-title">{title}</h3>
      <div className="row-wrap">
        {canPrev && <button className="row-arrow left" aria-label="이전" onClick={() => slide(-1)}>‹</button>}
        <div className="row-track" ref={trackRef} onScroll={update}>
          {items.map((item, i) => (
            <Card key={`${item.media_type}-${item.id}`} item={item} rank={i + 1} style={style} onOpen={onOpen} />
          ))}
        </div>
        {canNext && <button className="row-arrow right" aria-label="다음" onClick={() => slide(1)}>›</button>}
      </div>
    </section>
  )
}

function Card({ item, rank, style, onOpen }) {
  const landscape = style === 'landscape'
  const src = landscape ? item.backdrop || item.poster : item.poster

  return (
    <button className="card" onClick={() => onOpen(item)} title={item.title}>
      {style === 'rank' && <span className="rank-num">{rank}</span>}
      <div className="card-thumb">
        <img src={src} alt={item.title} loading="lazy" />
        {item.rating >= 8 && <span className="tag-hot">HOT</span>}
        {landscape && <span className="card-caption">{item.title}</span>}
      </div>
      {!landscape && <p className="card-title">{item.title}</p>}
    </button>
  )
}
