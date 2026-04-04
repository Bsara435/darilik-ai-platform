import styles from './PropertyList.module.css'

/**
 * Scrollable vertical list of properties (mock or real).
 * @param {{ id: string, name: string, location: string, rent: number, imageUrl?: string }[]} properties
 */
export default function PropertyList({ properties, selectedId, onSelect, className = '' }) {
  return (
    <aside className={`${styles.wrap} ${className}`.trim()} aria-label="Properties">
      <h2 className={styles.title}>Properties</h2>
      <ul className={styles.list}>
        {properties.map((p) => {
          const active = selectedId === p.id
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`${styles.card} ${active ? styles.cardActive : ''}`}
                onClick={() => onSelect(p.id)}
                aria-pressed={active}
              >
                {p.imageUrl ? (
                  <span className={styles.thumbWrap}>
                    <img src={p.imageUrl} alt="" className={styles.thumb} />
                  </span>
                ) : null}
                <span className={styles.meta}>
                  <span className={styles.name}>{p.name}</span>
                  <span className={styles.location}>{p.location}</span>
                  <span className={styles.rent}>
                    {p.rent.toLocaleString('en-US')} MAD / month
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
