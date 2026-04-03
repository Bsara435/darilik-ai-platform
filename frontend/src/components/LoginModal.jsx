import { useEffect, useId, useState } from 'react'
import styles from './LoginModal.module.css'

/** Admin email for sign-in (no backend yet) */
const DEMO_ADMIN_EMAIL = 'admin@darilik.ma'

export default function LoginModal({ open, onClose, onSuccess }) {
  const titleId = useId()
  const [email, setEmail] = useState(DEMO_ADMIN_EMAIL)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setMessage(null)
      setPassword('')
      setEmail(DEMO_ADMIN_EMAIL)
    }
  }, [open])

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (trimmed === DEMO_ADMIN_EMAIL) {
      onSuccess?.()
      onClose()
      return
    }
    setMessage(`Sign in with ${DEMO_ADMIN_EMAIL}`)
  }

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.cardHeader}>
          <h2 id={titleId} className={styles.title}>
            Login
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className={styles.hint}>Use the admin email below and your password.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className={styles.input}
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={DEMO_ADMIN_EMAIL}
          />
          <label className={styles.label} htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className={styles.input}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          {message && <p className={styles.feedback}>{message}</p>}
          <button type="submit" className={styles.submit}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
