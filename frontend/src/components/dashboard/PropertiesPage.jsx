import { useMemo, useState } from 'react'
import { PROPERTY_LISTINGS } from '../../data/propertyListings'
import PropertiesMapView from './PropertiesMapView'
import styles from './PropertiesPage.module.css'
import shellStyles from './Dashboard.module.css'

export default function PropertiesPage() {
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PROPERTY_LISTINGS
    return PROPERTY_LISTINGS.filter(
      (p) =>
        p.shortName.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.locationLabel.toLowerCase().includes(q),
    )
  }, [query])

  const selected = useMemo(
    () => PROPERTY_LISTINGS.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  )

  return (
    <>
      <header className={shellStyles.pageHead}>
        <div>
          <p className={shellStyles.kicker}>Casablanca · Portfolio</p>
          <h1 className={shellStyles.pageTitle}>Properties</h1>
        </div>
        <p className={shellStyles.pageMeta}>
          Six units in different areas. Open the map view, then pick a property for details.
        </p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.listPanel} aria-label="Property list">
          <button
            type="button"
            className={`${styles.allBtn} ${selectedId === null ? styles.allBtnActive : ''}`}
            onClick={() => setSelectedId(null)}
          >
            All properties — map view
          </button>

          <label className={styles.searchLabel} htmlFor="prop-search">
            Search by name or address
          </label>
          <input
            id="prop-search"
            type="search"
            className={styles.searchInput}
            placeholder="e.g. Maarif, Dar Bouazza…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />

          <ul className={styles.nameList}>
            {filtered.length === 0 && <li className={styles.listEmpty}>No matches.</li>}
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`${styles.nameBtn} ${selectedId === p.id ? styles.nameBtnActive : ''}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <span className={styles.nameBtnTitle}>{p.shortName}</span>
                  <span
                    className={
                      p.taken ? `${styles.dot} ${styles.dotTaken}` : `${styles.dot} ${styles.dotFree}`
                    }
                    title={p.taken ? 'Occupied' : 'Available'}
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className={styles.detailCard}>
          {!selected ? (
            <div className={styles.mapStage}>
              <div className={styles.mapStageHead}>
                <h2 className={styles.stageTitle}>Overview map</h2>
                <p className={styles.stageHint}>
                  Green markers = available, red = occupied. Click a marker to open details.
                </p>
              </div>
              <div className={styles.mapStageBody}>
                <PropertiesMapView
                  properties={PROPERTY_LISTINGS}
                  selectedId={null}
                  onSelectProperty={setSelectedId}
                />
              </div>
            </div>
          ) : (
            <div className={styles.detailBody}>
              <div className={styles.detailTop}>
                <div className={styles.imageWrap}>
                  <img src={selected.imageUrl} alt="" className={styles.image} />
                  <span
                    className={
                      selected.taken
                        ? `${styles.badge} ${styles.badgeTaken}`
                        : `${styles.badge} ${styles.badgeFree}`
                    }
                  >
                    {selected.taken ? 'Occupied' : 'Available'}
                  </span>
                </div>
                <div className={styles.detailText}>
                  <h2 className={styles.title}>{selected.title}</h2>
                  <p className={styles.desc}>{selected.description}</p>
                  <p className={styles.price}>
                    <span className={styles.priceLabel}>Monthly rent</span>{' '}
                    <strong>{selected.monthlyPrice.toLocaleString('en-US')} MAD</strong>
                  </p>
                  <p className={styles.location}>{selected.locationLabel}</p>
                </div>
              </div>
              <div className={styles.detailMapBlock}>
                <h3 className={styles.mapBlockTitle}>Location</h3>
                <div className={styles.mapStageBody}>
                  <PropertiesMapView
                    properties={PROPERTY_LISTINGS}
                    selectedId={selected.id}
                    onSelectProperty={setSelectedId}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
