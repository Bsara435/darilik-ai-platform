import { NavLink, Outlet } from 'react-router-dom'
import styles from './Dashboard.module.css'

export default function DashboardLayout({ onLogout }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>DariLik</span>
          <span className={styles.brandSub}>Landlord</span>
        </div>
        <nav className={styles.nav} aria-label="Dashboard">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navActive}` : styles.navLink
            }
          >
            Overview
          </NavLink>
          <NavLink
            to="/properties"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navActive}` : styles.navLink
            }
          >
            Properties
          </NavLink>
          <NavLink
            to="/profile-matching"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navActive}` : styles.navLink
            }
          >
            Profile matching
          </NavLink>
          <NavLink
            to="/legal-advisor"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navActive}` : styles.navLink
            }
          >
            Legal Advisor
          </NavLink>
          <a className={styles.navLink} href="#settings">
            Settings
          </a>
        </nav>
        <div className={styles.profile}>
          <div className={styles.avatar} aria-hidden>
            AD
          </div>
          <div className={styles.profileText}>
            <span className={styles.profileName}>Admin</span>
            <span className={styles.profileEmail}>admin@darilik.ma</span>
          </div>
          <button type="button" className={styles.logout} onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.zellige} aria-hidden />
        <Outlet />
      </div>
    </div>
  )
}
