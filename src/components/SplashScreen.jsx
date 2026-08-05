import { useEffect, useState } from 'react'
import crest from '../assets/vetorescudo.png'

export default function SplashScreen() {
  const [phase, setPhase] = useState('show')

  useEffect(() => {
    const scrollY = window.scrollY
    const { overflow, position, top, width } = document.body.style

    // Lock the page in place while the splash is up so an impatient scroll
    // (or scroll restoration) doesn't leave the site landed mid-page once it fades.
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    function unlock() {
      document.body.style.overflow = overflow
      document.body.style.position = position
      document.body.style.top = top
      document.body.style.width = width
      window.scrollTo(0, 0)
    }

    const hideTimer = setTimeout(() => {
      setPhase('hide')
      unlock()
    }, 1400)
    const removeTimer = setTimeout(() => setPhase('done'), 2000)

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
      unlock()
    }
  }, [])

  if (phase === 'done') return null

  return (
    <div className={`splash-screen${phase === 'hide' ? ' is-hiding' : ''}`}>
      <img src={crest} alt="Podpah Funkbol Clube" className="splash-logo" />
    </div>
  )
}
