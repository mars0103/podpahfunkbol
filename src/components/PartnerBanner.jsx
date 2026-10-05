import { useEffect, useState } from 'react'
import banner99 from '../assets/parceiros/banner-99.png'
import bannerPhilips from '../assets/parceiros/banner-philips.png'
import bannerAlpha from '../assets/parceiros/banner-alpha.png'

const BANNERS = [
  { id: '99', image: banner99, alt: 'Parceria oficial 99 — Quem corre junto soma' },
  { id: 'philips', image: bannerPhilips, alt: 'Parceria oficial Philips — Tecnologia que joga junto com o Funkbol' },
  { id: 'alpha', image: bannerAlpha, alt: 'Parceria oficial Alpha Consórcio — Parceira oficial de quem constrói o futuro com estratégia' },
]

const SLIDE_ROTATE_MS = 5000

export default function PartnerBanner() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((v) => (v + 1) % BANNERS.length)
    }, SLIDE_ROTATE_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="partner-banner" id="parcerias" aria-label="Parceria oficial">
      <div className="partner-banner-frame">
        {BANNERS.map((banner, i) => (
          <img
            key={banner.id}
            src={banner.image}
            alt={banner.alt}
            className={`partner-banner-slide${i === active ? ' is-active' : ''}`}
          />
        ))}
      </div>
      <div className="partner-banner-dots">
        {BANNERS.map((banner, i) => (
          <button
            key={banner.id}
            type="button"
            className={i === active ? 'is-active' : ''}
            aria-label={`Ver parceria ${banner.id}`}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </section>
  )
}
