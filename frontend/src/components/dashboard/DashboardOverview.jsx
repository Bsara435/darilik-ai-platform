import { useCallback, useMemo, useRef, useState } from 'react'
import styles from './Dashboard.module.css'

const STATS = [
  { label: 'Monthly revenue', value: '50 200', unit: 'MAD', delta: '+5.1%', up: true },
  { label: 'Portfolio occupancy', value: '50', unit: '%', delta: '3 of 6 units', up: true },
  { label: 'Active leases', value: '3', unit: '', delta: '1 renewal due soon' },
  { label: 'Outstanding rent', value: '6 800', unit: 'MAD', delta: '1 tenant', up: false },
]

const REVENUE_BARS = [
  { month: 'Jan', h: 58, value: '44 100 MAD' },
  { month: 'Feb', h: 63, value: '47 800 MAD' },
  { month: 'Mar', h: 60, value: '46 200 MAD' },
  { month: 'Apr', h: 68, value: '49 500 MAD' },
  { month: 'May', h: 65, value: '48 900 MAD' },
  { month: 'Jun', h: 72, value: '50 200 MAD' },
]

const PIE_SLICES = [
  { pct: 67, color: '#0f766e', label: 'Apartments' },
  { pct: 33, color: '#2563eb', label: 'Houses & townhouses' },
]

const TENANT_ROWS = [
  { id: '1', tenant: 'El Amrani — Maarif Boho', unit: 'A', amount: '7 200 MAD', due: '5 Apr 2026', status: 'paid' },
  { id: '2', tenant: 'Benali — Hay Riad TH', unit: 'B', amount: '19 500 MAD', due: '8 Apr 2026', status: 'paid' },
  { id: '3', tenant: 'Société Nord — Dar Bouazza', unit: 'Villa', amount: '23 500 MAD', due: '1 Apr 2026', status: 'late' },
  { id: '4', tenant: 'Vacant — Ain Sebaa', unit: 'C', amount: '—', due: '—', status: 'pending' },
  { id: '5', tenant: 'Vacant — Anfa Med.', unit: 'D', amount: '—', due: '—', status: 'pending' },
  { id: '6', tenant: 'Vacant — B Living', unit: 'E', amount: '—', due: '—', status: 'pending' },
]

const INITIAL_ALERTS = [
  { id: 'a1', level: 'critical', title: 'Lease renewal — Dar Bouazza villa', text: 'Lease ends in 45 days. Tenant asked for renewal terms.' },
  { id: 'a2', level: 'warning', title: 'Insurance — Hay Riad', text: 'Contents policy renewal due in 18 days.' },
  {
    id: 'a3',
    level: 'warning',
    title: 'Rent overdue',
    text: 'Société Nord — Dar Bouazza: 23 500 MAD was due 1 Apr 2026. Follow up required.',
  },
]

const PROPERTIES = [
  { name: 'Maarif — Boho 2BR', occ: 100, units: '1 / 1' },
  { name: 'Ain Sebaa — Designer 2BR', occ: 0, units: '0 / 1' },
  { name: 'Hay Riad — Townhouse', occ: 100, units: '1 / 1' },
  { name: 'Anfa — Mediterranean', occ: 0, units: '0 / 1' },
  { name: 'Dar Bouazza — Pool villa', occ: 100, units: '1 / 1' },
  { name: 'Hay Hassani — B Living', occ: 0, units: '0 / 1' },
]

const TIMELINE = [
  { date: '28 Mar 2026', title: 'Deposit received', detail: 'Ain Sebaa — viewing scheduled' },
  { date: '15 Mar 2026', title: 'Lease signed', detail: 'Hay Riad — 24 months' },
  { date: '2 Mar 2026', title: 'Inspection', detail: 'Maarif — no major issues' },
  { date: '20 Feb 2026', title: 'Rent indexation notice', detail: 'Sent to Dar Bouazza tenant' },
]

function StatCard({ children, delay = 0 }) {
  const ref = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const onMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ x: px * 10, y: -py * 10 })
  }, [])
  const onLeave = useCallback(() => setTilt({ x: 0, y: 0 }), [])

  return (
    <div className={styles.statCard} style={{ animationDelay: `${delay}ms` }}>
      <div
        ref={ref}
        className={styles.statCardInner}
        style={{
          transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateZ(0)`,
        }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {children}
      </div>
    </div>
  )
}

function PieChart() {
  return (
    <div className={styles.pieSection}>
      <h3 className={styles.cardTitle}>Income by property type</h3>
      <div
        className={styles.pie}
        style={{
          background: 'conic-gradient(#0f766e 0% 67%, #2563eb 67% 100%)',
        }}
        role="img"
        aria-label="Pie chart: apartments 67 percent, houses 33"
      />
      <ul className={styles.pieLegend}>
        {PIE_SLICES.map((s) => (
          <li key={s.label}>
            <span className={styles.pieSwatch} style={{ background: s.color }} />
            {s.label} <strong>{s.pct}%</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DashboardOverview() {
  const [payFilter, setPayFilter] = useState('all')
  const [alerts, setAlerts] = useState(INITIAL_ALERTS)

  const filteredTenants = useMemo(() => {
    if (payFilter === 'all') return TENANT_ROWS
    return TENANT_ROWS.filter((row) => row.status === payFilter)
  }, [payFilter])

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.kicker}>Casablanca · Portfolio</p>
          <h1 className={styles.pageTitle}>Landlord overview</h1>
        </div>
        <p className={styles.pageMeta}>Six units across the city — revenue and occupancy at a glance.</p>
      </header>

      <section className={styles.statsRow}>
        {STATS.map((s, i) => (
          <StatCard key={s.label} delay={i * 80}>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue}>
              {s.value}
              {s.unit && <span className={styles.statUnit}> {s.unit}</span>}
            </p>
            <p
              className={
                s.up === true
                  ? styles.statDeltaUp
                  : s.up === false
                    ? styles.statDeltaDown
                    : styles.statDelta
              }
            >
              {s.delta}
            </p>
          </StatCard>
        ))}
      </section>

      <section className={styles.grid2}>
        <div className={styles.glassCard}>
          <h3 className={styles.cardTitle}>Monthly revenue (MAD)</h3>
          <div className={styles.barChart} role="img" aria-label="Bar chart of monthly revenue">
            {REVENUE_BARS.map((b) => (
              <div key={b.month} className={styles.barCol}>
                <span className={styles.barTooltip} role="tooltip">
                  {b.value}
                </span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ height: `${b.h}%` }} />
                </div>
                <span className={styles.barLabel}>{b.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.glassCard}>
          <PieChart />
        </div>
      </section>

      <section className={`${styles.glassCard} ${styles.sectionStack}`}>
        <div className={styles.alertHead}>
          <h3 className={styles.cardTitle}>Active alerts</h3>
        </div>
        <ul className={styles.alertList}>
          {alerts.map((a) => (
            <li key={a.id} className={`${styles.alertItem} ${styles[`alert_${a.level}`]}`}>
              <div>
                <p className={styles.alertTitle}>{a.title}</p>
                <p className={styles.alertText}>{a.text}</p>
              </div>
              <button type="button" className={styles.dismiss} onClick={() => dismissAlert(a.id)}>
                Dismiss
              </button>
            </li>
          ))}
        </ul>
        {alerts.length === 0 && <p className={styles.empty}>No active alerts.</p>}
      </section>

      <section className={`${styles.glassCard} ${styles.sectionStack}`}>
        <div className={styles.tableHead}>
          <h3 className={styles.cardTitle}>Tenant payments</h3>
          <div className={styles.filters} role="tablist" aria-label="Filter by status">
            {(['all', 'paid', 'pending', 'late']).map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={payFilter === f}
                className={payFilter === f ? styles.filterOn : styles.filterOff}
                onClick={() => setPayFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tenant / property</th>
                <th>Unit</th>
                <th>Amount</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((row) => (
                <tr key={row.id}>
                  <td>{row.tenant}</td>
                  <td>{row.unit}</td>
                  <td>{row.amount}</td>
                  <td>{row.due}</td>
                  <td>
                    <span className={`${styles.pill} ${styles[`pill_${row.status}`]}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${styles.grid2} ${styles.sectionStack}`}>
        <div className={styles.glassCard}>
          <h3 className={styles.cardTitle}>Property health</h3>
          <ul className={styles.healthList}>
            {PROPERTIES.map((p) => (
              <li key={p.name} className={styles.healthRow}>
                <div className={styles.healthTop}>
                  <span>{p.name}</span>
                  <span className={styles.healthPct}>{p.occ}%</span>
                </div>
                <div className={styles.healthTrack}>
                  <div className={styles.healthFill} style={{ width: `${p.occ}%` }} />
                </div>
                <span className={styles.healthUnits}>{p.units} occupied</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.glassCard}>
          <h3 className={styles.cardTitle}>Contract & compliance timeline</h3>
          <ul className={styles.timeline}>
            {TIMELINE.map((ev, i) => (
              <li key={ev.title + i} className={styles.timelineItem}>
                <span className={styles.timelineDot} />
                <div>
                  <time className={styles.timelineDate}>{ev.date}</time>
                  <p className={styles.timelineTitle}>{ev.title}</p>
                  <p className={styles.timelineDetail}>{ev.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
