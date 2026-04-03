import { useEffect, useState } from 'react'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#services', label: 'Services' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#about', label: 'About' },
]

export default function Navbar({ onOpenLogin }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <header className={styles.nav} role="banner">
      <nav className={styles.inner} aria-label="Main">
        <a className={styles.brand} href="#home">
          Dari<span>Lik</span>
        </a>

        <button
          type="button"
          className={styles.menuBtn}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="sr-only">Toggle menu</span>
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {menuOpen && (
          <div
            className={`${styles.backdrop} ${styles.visible}`}
            aria-hidden
            onClick={() => setMenuOpen(false)}
          />
        )}

        <div
          id="mobile-nav"
          className={`${styles.linksWrap} ${menuOpen ? styles.open : ''}`}
        >
          <ul className={styles.links}>
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                className={styles.login}
                onClick={() => {
                  setMenuOpen(false)
                  onOpenLogin?.()
                }}
              >
                Login
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
