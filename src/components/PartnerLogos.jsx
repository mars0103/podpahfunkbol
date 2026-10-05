import { useEffect, useState } from 'react'
import DriftWall from './DriftWall'
import logo99 from '../assets/logosparceiros/99.svg'
import logoPhilips from '../assets/logosparceiros/philips.webp'
import logoAlpha from '../assets/logosparceiros/alphaconsorcio.png'

const ITEMS = [
  { image: logo99, title: '99', color: '#ffcc00' },
  { image: logoPhilips, title: 'Philips', color: '#0b5ed7' },
  { image: logoAlpha, title: 'Alpha Consórcio', color: '#0a1a3f' },
  { image: logoPhilips, title: 'Philips', color: '#0b5ed7' },
  { image: logo99, title: '99', color: '#ffcc00' },
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 640
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

export default function PartnerLogos() {
  const isMobile = useIsMobile()

  return (
    <section className="partner-logos" aria-label="Parceiros oficiais">
      <h2 className="partner-logos-title">NOSSOS PARCEIROS</h2>
      <div className="partner-logos-wall">
        <DriftWall
          items={ITEMS}
          columns={isMobile ? 3 : 5}
          tileWidth={isMobile ? 108 : 180}
          tileHeight={isMobile ? 68 : 110}
          gap={isMobile ? 10 : 18}
          tilt={16}
          turn={-14}
          perspective={1200}
          depth={120}
          speed={30}
          direction="up"
          variance={0.45}
          parallax={0.5}
          lift={54}
          fade={0.6}
          dim={0.92}
          overlayColor="#3c1361"
          radius={14}
          roll={0}
          pauseOnHover
          grayscale={false}
        />
      </div>
    </section>
  )
}
