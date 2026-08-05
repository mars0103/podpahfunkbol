import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import HeroFluid from './HeroFluid'
import HeroPlacar from './HeroPlacar'
import MagicRings from './MagicRings'
import Sticker from './Sticker'
import textura from '../assets/textura.svg'
import crest from '../assets/vetorescudo.png'
import portraitTop from '../assets/portrait_top.png'
import portraitBottom from '../assets/portrait_bottom.png'
import escudoAdesivo from '../assets/adesivos/escudo adesivo.png'

export default function Hero() {
  const heroRef = useRef(null)
  const dinoTiltRef = useRef(null)

  useEffect(() => {
    const section = heroRef.current
    const dinoTilt = dinoTiltRef.current
    if (!section || !dinoTilt) return

    const dinoRotateX = gsap.quickTo(dinoTilt, 'rotationX', { duration: 0.7, ease: 'power3.out' })
    const dinoRotateY = gsap.quickTo(dinoTilt, 'rotationY', { duration: 0.7, ease: 'power3.out' })
    const dinoY = gsap.quickTo(dinoTilt, 'y', { duration: 0.7, ease: 'power3.out' })

    function handleMove(e) {
      const rect = section.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      dinoRotateX(py * -12)
      dinoRotateY(px * 14)
      dinoY(py * -10)
    }

    function handleLeave() {
      dinoRotateX(0)
      dinoRotateY(0)
      dinoY(0)
    }

    section.addEventListener('mousemove', handleMove)
    section.addEventListener('mouseleave', handleLeave)
    return () => {
      section.removeEventListener('mousemove', handleMove)
      section.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <section className="hero" aria-label="Podpah Funkbol Clube" ref={heroRef}>
      <img className="hero-texture" src={textura} alt="" aria-hidden="true" />

      <div className="hero-backdrop" aria-hidden="true">
        <div className="hero-rings">
          <MagicRings
            color="#f5ba00"
            colorTwo="#fff3c4"
            ringCount={6}
            speed={1}
            attenuation={10}
            lineThickness={2}
            baseRadius={0.35}
            radiusStep={0.1}
            scaleRate={0.1}
            opacity={0.9}
            noiseAmount={0.08}
            ringGap={1.5}
            fadeIn={0.7}
            fadeOut={0.5}
            followMouse={false}
            parallax={0.05}
          />
        </div>
        <img className="hero-logo-spin" src={crest} alt="" />
      </div>

      <div className="hero-dino">
        <div className="hero-dino-tilt" ref={dinoTiltRef}>
          <HeroFluid topSrc={portraitTop} bottomSrc={portraitBottom} className="hero-dino-canvas" />
        </div>
      </div>

      <HeroPlacar />

      <span className="hero-hint">Mova o mouse para revelar</span>

      <Sticker image={escudoAdesivo} corner="bottom-right" size={110} rotate={-10} />
    </section>
  )
}
