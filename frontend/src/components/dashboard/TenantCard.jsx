import styles from './TenantCard.module.css'

/**
 * @param {'top' | 'strong' | null} props.badgeVariant
 */
export default function TenantCard({ name, summary, strengths, concerns, badgeVariant }) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.name}>{name}</h3>
        {badgeVariant === 'top' ? (
          <span className={`${styles.badge} ${styles.badgeTop}`}>Top match</span>
        ) : null}
        {badgeVariant === 'strong' ? (
          <span className={`${styles.badge} ${styles.badgeStrong}`}>Strong candidate</span>
        ) : null}
      </header>
      <p className={styles.summary}>{summary}</p>
      {strengths?.length ? (
        <section className={styles.section} aria-label="Strengths">
          <h4 className={styles.sectionTitle}>Strengths</h4>
          <ul className={styles.listStrengths}>
            {strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {concerns?.length ? (
        <section className={styles.section} aria-label="Things to consider">
          <h4 className={styles.sectionTitleMuted}>Things to consider</h4>
          <ul className={styles.listConcerns}>
            {concerns.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
