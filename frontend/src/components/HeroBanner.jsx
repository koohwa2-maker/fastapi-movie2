import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination, Keyboard, A11y } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default function HeroBanner({ items, onOpen }) {
  if (!items.length) return null

  return (
    <section className="hero">
      <Swiper
        key={items.map((i) => i.id).join(',')}
        modules={[Autoplay, Navigation, Pagination, Keyboard, A11y]}
        slidesPerView={1}
        spaceBetween={16}
        loop={items.length > 1}
        speed={700}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        navigation
        keyboard={{ enabled: true }}
        grabCursor
        className="hero-swiper"
      >
        {items.map((item) => (
          <SwiperSlide key={`${item.media_type}-${item.id}`}>
            <button className="hero-slide" onClick={() => onOpen(item)} aria-label={`${item.title} 상세 보기`}>
              <img src={item.backdrop_original || item.backdrop} alt="" />
              <div className="hero-shade" />
              <div className="hero-content">
                <span className="hero-badge">
                  <i>M</i>{item.media_type === 'tv' ? 'SERIES' : 'MOVIE'}
                </span>
                <h2 className="hero-title">{item.title}</h2>
                <p className="hero-overview">{item.overview}</p>
              </div>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
