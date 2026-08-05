import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import AnnouncementMarquee from './AnnouncementMarquee'
import SplashScreen from './SplashScreen'
import crest from '../assets/vetorescudo.png'

export default function Layout() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo({ top: 0 })
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
        <img src={crest} alt="Escudo Podpah Funkbol Clube" />
        <p>© {new Date().getFullYear()} Podpah Funkbol Clube. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
