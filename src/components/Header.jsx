import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import crest from '../assets/vetorescudo.png'
import { InstagramIcon, FacebookIcon, YoutubeIcon, SearchIcon, MenuIcon, CloseIcon } from './icons'

const NAV_LINKS = [
  { label: 'Notícias', to: '/#noticias' },
  { label: 'Elenco', to: '/elenco' },
  { label: 'Kings League', to: '/kings-league' },
]

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com', Icon: InstagramIcon },
  { label: 'Facebook', href: 'https://facebook.com', Icon: FacebookIcon },
  { label: 'YouTube', href: 'https://youtube.com', Icon: YoutubeIcon },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!panelRef.current) return
    if (menuOpen) {
      gsap.fromTo(
        panelRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' },
      )
    }
  }, [menuOpen])

  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="menu-toggle"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <CloseIcon className="icon" /> : <MenuIcon className="icon" />}
        </button>

        <nav className="nav-left" aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-right">
          <Link className="parcerias-link" to="/parcerias">
            Parcerias
          </Link>
          <form className="search-form" role="search" onSubmit={(e) => e.preventDefault()}>
            <input type="search" placeholder="Buscar" aria-label="Buscar no site" />
            <button type="submit" aria-label="Buscar">
              <SearchIcon className="icon" />
            </button>
          </form>
          <ul className="socials">
            {SOCIALS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noreferrer" aria-label={label}>
                  <Icon className="icon" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Link to="/" className="brand-badge" aria-label="Podpah Funkbol Clube — início">
        <img src={crest} alt="Escudo Podpah Funkbol Clube" />
      </Link>

      {menuOpen && (
        <div className="mobile-panel" ref={panelRef}>
          <nav aria-label="Navegação mobile">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} to={link.to} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link to="/parcerias" onClick={() => setMenuOpen(false)}>
              Parcerias
            </Link>
          </nav>
          <ul className="socials mobile-socials">
            {SOCIALS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noreferrer" aria-label={label}>
                  <Icon className="icon" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
