import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const MESSAGE = 'PODPAH FUNKBOL CLUBE'

export default function TapeMarquee() {
  const trackRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const tween = gsap.to(track, {
      xPercent: -50,
      duration: 16,
      ease: 'none',
      repeat: -1,
    })

    return () => tween.kill()
  }, [])

  const items = Array.from({ length: 10 })

  return (
    <div className="tape-marquee" aria-hidden="true">
      <div className="tape-track" ref={trackRef}>
        {items.map((_, i) => (
          <span key={i}>{MESSAGE}</span>
        ))}
      </div>
    </div>
  )
}
