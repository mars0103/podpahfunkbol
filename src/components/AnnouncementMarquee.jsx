import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const MESSAGE = 'BEM-VINDO(A) AO SITE OFICIAL DO PODPAH FUNKBOL CLUBE'

export default function AnnouncementMarquee() {
  const trackRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const tween = gsap.to(track, {
      xPercent: -50,
      duration: 22,
      ease: 'none',
      repeat: -1,
    })

    return () => tween.kill()
  }, [])

  const items = Array.from({ length: 8 })

  return (
    <div className="announcement-marquee" aria-label={MESSAGE}>
      <div className="marquee-track" ref={trackRef} aria-hidden="true">
        {items.map((_, i) => (
          <span className="marquee-item" key={i}>
            {MESSAGE}
          </span>
        ))}
      </div>
    </div>
  )
}
