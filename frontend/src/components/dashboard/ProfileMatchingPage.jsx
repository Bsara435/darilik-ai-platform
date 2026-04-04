import { useCallback, useMemo, useState } from 'react'
import { PROPERTY_LISTINGS } from '../../data/propertyListings'
import {
  fetchRankedTenants,
  fetchTenantExplanations,
  rankedRowToExplanationPayload,
} from '../../services/api'
import PropertyList from './PropertyList'
import SchedulerPanel from './SchedulerPanel'
import TenantCard from './TenantCard'
import styles from './ProfileMatchingPage.module.css'
import shellStyles from './Dashboard.module.css'

const TOP_N = 4

/** Mock applicant count per property (stable per id). */
function mockApplicantCount(propertyId) {
  let h = 0
  for (let i = 0; i < propertyId.length; i += 1) h = (h + propertyId.charCodeAt(i) * (i + 1)) % 97
  return 8 + (h % 9)
}

function badgeForIndex(i) {
  if (i === 0) return 'top'
  if (i >= 1 && i <= 3) return 'strong'
  return null
}

export default function ProfileMatchingPage() {
  const [selectedId, setSelectedId] = useState(null)
  const [phase, setPhase] = useState('idle')
  const [candidates, setCandidates] = useState([])
  const [compareSessionId, setCompareSessionId] = useState(0)
  const [error, setError] = useState(null)

  const properties = useMemo(
    () =>
      PROPERTY_LISTINGS.map((p) => ({
        id: p.id,
        name: p.shortName,
        location: p.locationLabel,
        rent: p.monthlyPrice,
        imageUrl: p.imageUrl,
      })),
    [],
  )

  const selected = useMemo(
    () => PROPERTY_LISTINGS.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  )

  const applicantCount = selected ? mockApplicantCount(selected.id) : 0

  const handleSelectProperty = useCallback((id) => {
    setSelectedId(id)
    setPhase('selected')
    setCandidates([])
    setError(null)
  }, [])

  const handleCompare = useCallback(async () => {
    if (!selectedId) return
    setError(null)
    setCandidates([])
    try {
      setPhase('loading_ranked')
      const ranked = await fetchRankedTenants()
      const topSlice = ranked.slice(0, TOP_N)
      if (!topSlice.length) {
        throw new Error(
          'No tenants in the database. Run: cd backend && python -m app.db.seed',
        )
      }
      const payload = topSlice.map(rankedRowToExplanationPayload)

      setPhase('loading_explanations')
      const explained = await fetchTenantExplanations(payload)
      if (!Array.isArray(explained) || explained.length === 0) {
        throw new Error('No explanations returned.')
      }
      setCandidates(explained)
      setCompareSessionId((k) => k + 1)
      setPhase('results')
    } catch (e) {
      setPhase('error')
      setCandidates([])
      const detail = e instanceof Error ? e.message : String(e)
      const friendly = 'Something went wrong. Please try again.'
      setError({ friendly, detail })
      if (import.meta.env.DEV) {
        console.error('[Compare candidates]', e)
      }
    }
  }, [selectedId])

  return (
    <>
      <header className={shellStyles.pageHead}>
        <div>
          <p className={shellStyles.kicker}>Casablanca · Portfolio</p>
          <h1 className={shellStyles.pageTitle}>Profile matching</h1>
        </div>
        <p className={shellStyles.pageMeta}>
          Pick a property, run the decision assistant for a shortlist, then use the scheduler to propose viewing times
          and track who has accepted or is still pending.
        </p>
      </header>

      <div className={styles.layout}>
        <PropertyList
          properties={properties}
          selectedId={selectedId}
          onSelect={handleSelectProperty}
        />

        <div className={styles.mainPanel}>
          {phase === 'idle' && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Select a property</p>
              <p className={styles.emptyText}>
                Choose a listing on the left to see how many candidates applied, run the decision assistant, then
                schedule viewings beside it.
              </p>
            </div>
          )}

          {phase !== 'idle' && (
            <div className={styles.dualWork}>
              <div className={styles.decisionColumn}>
                {phase === 'selected' && selected && (
                  <div className={styles.promptWrap}>
                    <p className={styles.promptKicker}>Decision assistant</p>
                    <p className={styles.promptLead}>
                      <strong>{applicantCount} candidates</strong> have applied for{' '}
                      <strong>{selected.shortName}</strong>. Compare them to build your shortlist before scheduling.
                    </p>
                    <div className={styles.compareActions}>
                      <button type="button" className={styles.primaryBtn} onClick={handleCompare}>
                        Compare candidates
                      </button>
                    </div>
                  </div>
                )}

                {phase === 'loading_ranked' && (
                  <div className={styles.loadingWrap} role="status" aria-live="polite">
                    <p className={styles.promptKicker}>Decision assistant</p>
                    <div className={styles.spinner} aria-hidden />
                    <p className={styles.loadingLabel}>Analyzing candidates…</p>
                  </div>
                )}

                {phase === 'loading_explanations' && (
                  <div className={styles.loadingWrap} role="status" aria-live="polite">
                    <p className={styles.promptKicker}>Decision assistant</p>
                    <div className={styles.spinner} aria-hidden />
                    <p className={styles.loadingLabel}>Generating insights…</p>
                  </div>
                )}

                {phase === 'error' && error && (
                  <>
                    <p className={styles.promptKicker}>Decision assistant</p>
                    <div className={styles.errorWrap} role="alert">
                      <p className={styles.errorFriendly}>{error.friendly}</p>
                      {error.detail ? (
                        <p className={styles.errorDetail} title={error.detail}>
                          {error.detail.length > 280 ? `${error.detail.slice(0, 280)}…` : error.detail}
                        </p>
                      ) : null}
                    </div>
                    {selected ? (
                      <div className={styles.compareActions} style={{ marginTop: '1rem' }}>
                        <button type="button" className={styles.primaryBtn} onClick={handleCompare}>
                          Try again
                        </button>
                      </div>
                    ) : null}
                  </>
                )}

                {phase === 'results' && selected && candidates.length > 0 && (
                  <>
                    <div className={styles.resultsHead}>
                      <p className={styles.resultsKicker}>Decision assistant</p>
                      <h2 className={styles.resultsTitle}>{selected.shortName}</h2>
                      <p className={styles.resultsHint}>
                        Top {TOP_N} matches based on your portfolio data. Summaries are for clarity — review and follow
                        your own policies before finalizing.
                      </p>
                    </div>
                    <ul className={styles.cardGridFlow}>
                      {candidates.map((t, index) => (
                        <li key={`${t.name}-${index}`}>
                          <TenantCard
                            name={t.name}
                            summary={t.summary}
                            strengths={t.strengths}
                            concerns={t.concerns}
                            badgeVariant={badgeForIndex(index)}
                          />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className={styles.schedulerColumn}>
                <SchedulerPanel
                  key={compareSessionId}
                  locked={phase !== 'results' || candidates.length === 0}
                  candidates={candidates}
                  propertyLabel={selected?.shortName ?? 'Listing'}
                  sessionKey={compareSessionId}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
