import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import Header from './Header'
import AnnouncementMarquee from './AnnouncementMarquee'
import SplashScreen from './SplashScreen'
import texturaUrl from '../assets/textura.svg'
import footerCrest from '../assets/footer/crest-bw.png'
import iconYoutube from '../assets/footer/icon-youtube.svg'
import iconX from '../assets/footer/icon-x.svg'
import iconInstagram from '../assets/footer/icon-instagram.svg'
import iconTiktok from '../assets/footer/icon-tiktok.svg'

const FOOTER_SOCIALS = [
  { label: 'YouTube', href: 'https://youtube.com', icon: iconYoutube },
  { label: 'X', href: 'https://x.com', icon: iconX },
  { label: 'Instagram', href: 'https://instagram.com', icon: iconInstagram },
  { label: 'TikTok', href: 'https://tiktok.com', icon: iconTiktok },
]

export default function Layout() {
  const location = useLocation()
  const lenisRef = useRef(null)

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true, duration: 2 })
    lenisRef.current = lenis
    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash)
      if (el) {
        if (lenisRef.current) lenisRef.current.scrollTo(el)
        else el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true })
    else window.scrollTo({ top: 0 })
  }, [location.pathname, location.hash])

  return (
    <div id="top" className="page">
      <SplashScreen />
      <Header />
      <AnnouncementMarquee />

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div
          className="site-footer-texture"
          style={{ WebkitMaskImage: `url(${texturaUrl})`, maskImage: `url(${texturaUrl})` }}
          aria-hidden="true"
        />
        <img className="site-footer-crest" src={footerCrest} alt="Escudo Podpah Funkbol Clube" />
        <ul className="site-footer-socials">
          {FOOTER_SOCIALS.map(({ label, href, icon }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noreferrer" aria-label={label}>
                <img src={icon} alt="" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        <p>Podpah Funkbol Clube © {new Date().getFullYear()} Todos os direitos reservados</p>
      </footer>
    </div>
  )
}
