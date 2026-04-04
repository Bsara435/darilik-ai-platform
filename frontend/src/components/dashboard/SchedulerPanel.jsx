import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import styles from './SchedulerPanel.module.css'

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

/** Hours shown in the grid (landlord local time, demo). */
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17]

/** Blocked cells for a slightly realistic calendar (busy). */
const BUSY_KEYS = new Set(['sat-12', 'sun-9', 'sun-10', 'sun-11', 'sun-12', 'sun-13', 'sun-14', 'sun-15'])

function slotKey(dayKey, hour) {
  return `${dayKey}-${hour}`
}

function labelForCalendarSlot(dayKey, hour) {
  const d = DAYS.find((x) => x.key === dayKey)?.label ?? dayKey
  const end = hour + 1
  return `${d} ${String(hour).padStart(2, '0')}:00–${String(end).padStart(2, '0')}:00`
}

function sortSlotKeys(keys) {
  const dayOrder = Object.fromEntries(DAYS.map((d, i) => [d.key, i]))
  return [...keys].sort((a, b) => {
    const [da, ha] = a.split('-')
    const [db, hb] = b.split('-')
    const oa = dayOrder[da] ?? 99
    const ob = dayOrder[db] ?? 99
    if (oa !== ob) return oa - ob
    return Number(ha) - Number(hb)
  })
}

const RESOLVE_MS = 3600

/**
 * @param {object} props
 * @param {boolean} props.locked
 * @param {Array<{ name: string }>} props.candidates
 * @param {string} props.propertyLabel
 * @param {number} props.sessionKey — bump to reset scheduler state after a new compare
 */
export default function SchedulerPanel({ locked, candidates, propertyLabel, sessionKey }) {
  const [selectedCells, setSelectedCells] = useState(() => new Set())
  const [customSlots, setCustomSlots] = useState([])
  const [customInput, setCustomInput] = useState('')
  const [requests, setRequests] = useState([])
  const [batchPending, setBatchPending] = useState(false)
  const timeoutRef = useRef(null)

  const clearTimer = useCallback(() => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => () => clearTimer(), [clearTimer])

  useEffect(() => {
    setSelectedCells(new Set())
    setCustomSlots([])
    setCustomInput('')
    setRequests([])
    setBatchPending(false)
    clearTimer()
  }, [sessionKey, clearTimer])

  const toggleCell = useCallback(
    (key) => {
      if (locked || batchPending || BUSY_KEYS.has(key)) return
      setSelectedCells((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    },
    [locked, batchPending],
  )

  const addCustomSlot = useCallback(() => {
    if (!customInput.trim()) return
    const d = new Date(customInput)
    if (Number.isNaN(d.getTime())) return
    const label = d.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setCustomSlots((prev) => [...prev, { id, label }])
    setCustomInput('')
  }, [customInput])

  const removeCustom = useCallback((id) => {
    setCustomSlots((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const buildProposalLabels = useCallback(() => {
    const keys = sortSlotKeys([...selectedCells])
    const fromCal = keys.map((k) => {
      const [day, h] = k.split('-')
      return labelForCalendarSlot(day, Number(h))
    })
    const fromCustom = customSlots.map((c) => c.label)
    return [...fromCal, ...fromCustom]
  }, [selectedCells, customSlots])

  const sendToShortlist = useCallback(() => {
    const labels = buildProposalLabels()
    if (labels.length === 0 || candidates.length === 0 || batchPending) return

    const proposedSummary = labels.join(' · ')
    const initial = candidates.map((c) => ({
      id: `${c.name}-${sessionKey}-${Date.now()}`,
      name: c.name,
      proposed: proposedSummary,
      status: 'pending',
      acceptedSlot: null,
      detail: null,
    }))

    setRequests(initial)
    setBatchPending(true)
    clearTimer()

    const firstSlotLabel = labels[0]

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null
      setBatchPending(false)
      setRequests((prev) =>
        prev.map((r, i) => {
          if (i === 0) {
            return { ...r, status: 'accepted', acceptedSlot: firstSlotLabel, detail: 'Confirmed viewing' }
          }
          if (i === 1 || i === 2) {
            return {
              ...r,
              status: 'pending',
              detail: 'No response yet',
            }
          }
          return {
            ...r,
            status: 'declined',
            detail: 'Not available for these windows',
          }
        }),
      )
    }, RESOLVE_MS)
  }, [buildProposalLabels, candidates, sessionKey, batchPending, clearTimer])

  const clearProposal = useCallback(() => {
    if (batchPending) return
    setSelectedCells(new Set())
    setCustomSlots([])
    setRequests([])
  }, [batchPending])

  const hasProposal = selectedCells.size > 0 || customSlots.length > 0
  const sendDisabled = !hasProposal || candidates.length === 0 || batchPending

  return (
    <div className={styles.panel}>
      <header className={styles.panelHead}>
        <p className={styles.kicker}>Meetings</p>
        <h2 className={styles.title}>Scheduler</h2>
      </header>

      {locked ? (
        <div className={styles.locked}>
          <div className={styles.lockedIcon} aria-hidden>
            📅
          </div>
          <p className={styles.lockedTitle}>Use the decision assistant first</p>
          <p className={styles.lockedText}>
            Run <strong>Compare candidates</strong> in the panel beside this one. After you have a shortlist and
            insights, you can pick time slots, add specific times, and send proposals here.
          </p>
        </div>
      ) : (
        <div className={styles.body}>
          <div>
            <p className={styles.sectionLabel}>Your week · {propertyLabel}</p>
            <p className={styles.sectionHint}>
              Click free cells to offer a viewing window. Shaded blocks are already blocked on your calendar.
            </p>
            <div className={styles.calendarWrap}>
              <div className={styles.calGrid} role="grid" aria-label="Weekly availability">
                <div className={styles.calCorner} />
                {DAYS.map((d) => (
                  <div key={d.key} className={styles.calDay}>
                    {d.label}
                  </div>
                ))}
                {HOURS.map((hour) => (
                  <Fragment key={hour}>
                    <div className={styles.timeCell}>{hour}:00</div>
                    {DAYS.map((d) => {
                      const key = slotKey(d.key, hour)
                      const busy = BUSY_KEYS.has(key)
                      const on = selectedCells.has(key)
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`${styles.slotCell} ${busy ? styles.slotCellBusy : ''} ${on ? styles.slotCellOn : ''}`}
                          onClick={() => toggleCell(key)}
                          disabled={busy || batchPending}
                          aria-label={
                            busy
                              ? `${d.label} ${hour}:00 unavailable`
                              : `${d.label} ${hour}:00, ${on ? 'selected' : 'not selected'}`
                          }
                          aria-pressed={on}
                        />
                      )
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.customBlock}>
            <p className={styles.sectionLabel}>Specific times</p>
            <p className={styles.sectionHint}>Add one-off slots (e.g. after a phone call) — they are included in the same proposal.</p>
            <div className={styles.customRow}>
              <input
                type="datetime-local"
                className={styles.datetimeInput}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                disabled={batchPending}
              />
              <button type="button" className={styles.addBtn} onClick={addCustomSlot} disabled={!customInput || batchPending}>
                Add time
              </button>
            </div>
            {customSlots.length > 0 ? (
              <ul className={styles.chipList}>
                {customSlots.map((c) => (
                  <li key={c.id} className={styles.chip}>
                    {c.label}
                    <button
                      type="button"
                      className={styles.chipRemove}
                      onClick={() => removeCustom(c.id)}
                      disabled={batchPending}
                      aria-label={`Remove ${c.label}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className={styles.sendRow}>
            <button type="button" className={styles.primaryBtn} onClick={sendToShortlist} disabled={sendDisabled}>
              Send times to shortlist
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={clearProposal} disabled={batchPending}>
              Clear selection
            </button>
          </div>

          {batchPending ? (
            <div className={styles.pendingBanner} role="status" aria-live="polite">
              <span className={styles.pulse} aria-hidden />
              <div>
                <p className={styles.pendingTitle}>Requests pending</p>
                <p className={styles.pendingText}>
                  Proposed slots were sent to everyone on your shortlist. Waiting for responses…
                </p>
              </div>
            </div>
          ) : null}

          <div>
            <p className={styles.sectionLabel}>Responses</p>
            {requests.length === 0 ? (
              <p className={styles.emptyRequests}>No proposals sent yet. Choose slots above, then send to candidates.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Proposed</th>
                      <th>Status</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>
                          <span className={styles.slotSummary} title={r.proposed}>
                            {r.proposed.length > 48 ? `${r.proposed.slice(0, 48)}…` : r.proposed}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              r.status === 'accepted'
                                ? styles.badgeAccepted
                                : r.status === 'declined'
                                  ? styles.badgeDeclined
                                  : styles.badgePending
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td>
                          {r.status === 'accepted' && r.acceptedSlot ? (
                            <span className={styles.slotSummary}>Booked: {r.acceptedSlot}</span>
                          ) : (
                            <span className={styles.slotSummary}>{r.detail ?? '—'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
