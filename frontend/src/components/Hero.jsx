import styles from './Hero.module.css'

const heroImg = `${import.meta.env.BASE_URL}properties/prop-1.png`

export default function Hero({ onGetStarted }) {
  return (
    <section id="home" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.content}>
        <p className={styles.eyebrow}>Property management · Casablanca</p>
        <h1 id="hero-title" className={styles.title}>
          Welcome to <span className={styles.highlight}>DariLik</span>
        </h1>
        <p className={styles.subtitle}>
          &ldquo;My home is for you&rdquo; — a platform for owners, tenants, and managers across Greater
          Casablanca. Clear operations, transparent communication, one place to run your portfolio.
        </p>
        <div className={styles.ctaRow}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => onGetStarted?.()}
          >
            Get started with us
          </button>
          <a className={styles.secondaryBtn} href="#about">
            Our story
          </a>
        </div>
      </div>
      <div className={styles.heroVisual}>
        <div className={styles.heroImageFrame}>
          <img
            src={heroImg}
            alt=""
            className={styles.heroImage}
            width={800}
            height={600}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </section>
  )
}
