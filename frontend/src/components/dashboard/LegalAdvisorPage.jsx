import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchRankedTenants,
  fetchTenantsList,
  legalContractDocxUrl,
  patchLegalResolveConflict,
  postLegalDetectConflicts,
  postLegalGenerateContract,
  postLegalPostVisit,
  postLegalUploadSigned,
} from '../../services/api'
import shellStyles from './Dashboard.module.css'
import styles from './LegalAdvisorPage.module.css'

/** Demo: single “past visit” + property tied to Amal Serhani / Aïn Sebaa matching profile. */
const DEMO_AMAL_FULL_NAME = 'Amal Serhani'
const DEMO_PROPERTY_ADDRESS =
  'Aïn Sebaa, Casablanca — appartement type designer 2 chambres, résidence proche du tramway (bien lié au dossier de matching DariLik).'
const DEMO_PAST_VISITS = [
  {
    id: 'amal-2026-03-28',
    label: 'Visite du 28 mars 2026 — Amal Serhani · Aïn Sebaa (profil matching)',
  },
]
const DEMO_SPECIAL_RENT_DAY =
  'Le loyer est payable le 5 de chaque mois (jour de paiement convenu entre les parties). Rent due on the 5th of each calendar month. يُؤدى الكراء في اليوم الخامس من كل شهر تقويمي.'

export default function LegalAdvisorPage() {
  const [step, setStep] = useState(1)
  const [ranked, setRanked] = useState([])
  const [pastVisitId, setPastVisitId] = useState(DEMO_PAST_VISITS[0].id)
  const [contractLanguage, setContractLanguage] = useState('ar')
  const [tenantId, setTenantId] = useState('')
  const [rent, setRent] = useState('')
  const [deposit, setDeposit] = useState('1 month')
  const [moveIn, setMoveIn] = useState('')
  const [duration, setDuration] = useState('1 year')
  const [payment, setPayment] = useState('bank transfer')
  const [special, setSpecial] = useState('')
  const [concerns, setConcerns] = useState('')

  const [visitId, setVisitId] = useState(null)
  const [agreedPoints, setAgreedPoints] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [loadingRanked, setLoadingRanked] = useState(true)
  const [loadingDetect, setLoadingDetect] = useState(false)
  const [loadingContract, setLoadingContract] = useState(false)
  const [error, setError] = useState(null)

  const [contractId, setContractId] = useState(null)
  const [contractHtml, setContractHtml] = useState('')
  const [summary, setSummary] = useState(null)
  const [signedOk, setSignedOk] = useState(false)

  const [resolutionDraft, setResolutionDraft] = useState({})

  const tenantFromVisitName = useMemo(() => {
    const row = ranked.find((r) => String(r.id) === String(tenantId))
    return row?.full_name ?? ''
  }, [ranked, tenantId])

  const loadRanked = useCallback(async () => {
    setLoadingRanked(true)
    setError(null)
    const timeoutMs = 12_000

    const loadWithTimeout = async (fn) => {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
      try {
        return await fn(controller.signal)
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    try {
      const rows = await loadWithTimeout((signal) => fetchRankedTenants({ signal }))
      const list = Array.isArray(rows) ? rows : []
      if (list.length > 0) {
        setRanked(list)
        const amal = list.find((r) => r.full_name === DEMO_AMAL_FULL_NAME)
        if (amal) {
          setTenantId(String(amal.id))
          setRent(String(amal.target_rent ?? 4400))
          setMoveIn('2026-04-01')
          setSpecial(DEMO_SPECIAL_RENT_DAY)
        } else {
          setTenantId(String(list[0].id))
        }
        return
      }
      throw new Error('No ranked tenants returned (database may be empty).')
    } catch (firstErr) {
      try {
        const raw = await loadWithTimeout((signal) => fetchTenantsList({ signal }))
        const list = Array.isArray(raw) ? raw : []
        if (list.length === 0) {
          throw new Error(
            'No tenants in the database. From backend/: run `python -m app.db.seed` with DATABASE_URL set.',
          )
        }
        const mapped = list.map((t) => ({
          ...t,
          financial_score: 0,
          payment_score: 0,
          stability_score: 0,
          combined_score: 70,
        }))
        setRanked(mapped)
        const amal = mapped.find((t) => t.full_name === DEMO_AMAL_FULL_NAME)
        if (amal) {
          setTenantId(String(amal.id))
          setRent(String(amal.target_rent ?? 4400))
          setMoveIn('2026-04-01')
          setSpecial(DEMO_SPECIAL_RENT_DAY)
        } else {
          setTenantId(String(mapped[0].id))
        }
        setError(null)
      } catch (e) {
        const msg =
          e instanceof Error && e.name === 'AbortError'
            ? `Request timed out (${timeoutMs / 1000}s). Start uvicorn on port 8000 and ensure Vite proxies /tenants.`
            : e instanceof Error
              ? e.message
              : String(e)
        setError(msg)
        setRanked([])
      }
    } finally {
      setLoadingRanked(false)
    }
  }, [])

  useEffect(() => {
    loadRanked()
  }, [loadRanked])

  useEffect(() => {
    if (step !== 2 || visitId == null) return
    let cancelled = false
    ;(async () => {
      setLoadingDetect(true)
      setError(null)
      try {
        const data = await postLegalDetectConflicts(visitId)
        if (!cancelled) {
          setAgreedPoints(data.agreed_points ?? [])
          setConflicts(data.conflicts ?? [])
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoadingDetect(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [step, visitId])

  const allResolved = useMemo(
    () => conflicts.length === 0 || conflicts.every((c) => c.resolved),
    [conflicts],
  )

  const handleStep1 = useCallback(
    async (e) => {
      e.preventDefault()
      setError(null)
      if (!tenantId || !moveIn || !rent) {
        setError(
          !tenantId
            ? 'This visit could not be linked to a tenant in the database (e.g. seed data missing Amal Serhani).'
            : 'Please enter rent and move-in date.',
        )
        return
      }
      const n = Number(String(rent).replace(/\s/g, ''))
      if (!Number.isFinite(n) || n <= 0) {
        setError('Enter a valid rent amount.')
        return
      }
      try {
        const res = await postLegalPostVisit({
          tenant_id: tenantId,
          property_address: DEMO_PROPERTY_ADDRESS,
          contract_language: contractLanguage,
          agreed_rent_mad: n,
          deposit_months: deposit,
          move_in_date: moveIn,
          lease_duration: duration,
          payment_method: payment,
          special_conditions: special || null,
          landlord_concerns: concerns || null,
        })
        setVisitId(res.visit_id)
        setStep(2)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    },
    [tenantId, contractLanguage, rent, deposit, moveIn, duration, payment, special, concerns],
  )

  const mergeConflict = useCallback((updated) => {
    setConflicts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }, [])

  const resolveConflict = useCallback(
    async (conflictId, resolved, agreedValue) => {
      setError(null)
      try {
        const updated = await patchLegalResolveConflict(conflictId, {
          resolved,
          agreed_value: agreedValue ?? null,
        })
        mergeConflict(updated)
        setResolutionDraft((d) => {
          const next = { ...d }
          delete next[conflictId]
          return next
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    },
    [mergeConflict],
  )

  const handleGenerate = useCallback(async () => {
    if (!visitId || !allResolved) return
    setStep(3)
    setLoadingContract(true)
    setContractHtml('')
    setContractId(null)
    setSummary(null)
    setSignedOk(false)
    setError(null)
    try {
      const data = await postLegalGenerateContract(visitId)
      setContractId(data.contract_id)
      setContractHtml(data.contract_html)
      setSummary(data)
    } catch (e) {
      setStep(2)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingContract(false)
    }
  }, [visitId, allResolved])

  const printPdf = useCallback(() => {
    if (!contractHtml) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(contractHtml)
    w.document.close()
    w.focus()
    w.print()
  }, [contractHtml])

  const onUploadSigned = useCallback(
    async (e) => {
      const file = e.target.files?.[0]
      if (!file || contractId == null) return
      setError(null)
      try {
        await postLegalUploadSigned(contractId, file)
        setSignedOk(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
      e.target.value = ''
    },
    [contractId],
  )

  const resetWizard = useCallback(() => {
    setStep(1)
    setVisitId(null)
    setAgreedPoints([])
    setConflicts([])
    setContractId(null)
    setContractHtml('')
    setSummary(null)
    setSignedOk(false)
    setError(null)
    setResolutionDraft({})
  }, [])

  return (
    <>
      <header className={shellStyles.pageHead}>
        <div>
          <p className={shellStyles.kicker}>Compliance</p>
          <h1 className={shellStyles.pageTitle}>Legal Advisor</h1>
        </div>
        <p className={shellStyles.pageMeta}>
          Post-visit capture, Law 67-12 checks, and lease generation in Arabic, French, or English.
        </p>
      </header>

      <div className={styles.wrap}>
        <div className={styles.progress} aria-label="Progress">
          <span
            className={
              step === 1 ? styles.progressStepActive : step > 1 ? styles.progressStepDone : styles.progressStep
            }
          >
            Step 1 · Visit
          </span>
          <span className={styles.progressArrow}>→</span>
          <span
            className={
              step === 2 ? styles.progressStepActive : step > 2 ? styles.progressStepDone : styles.progressStep
            }
          >
            Step 2 · Conflicts
          </span>
          <span className={styles.progressArrow}>→</span>
          <span className={step === 3 ? styles.progressStepActive : styles.progressStep}>Step 3 · Contract</span>
        </div>

        {error ? <div className={styles.errorBox}>{error}</div> : null}

        {step === 1 && (
          <form className={styles.card} onSubmit={handleStep1}>
            <h2 className={styles.cardTitle}>Post-Visit Details</h2>
            <p className={styles.cardSub}>Fill in what was verbally agreed during your visit.</p>

            {loadingRanked ? (
              <p className={styles.cardSub}>Loading tenants from the database…</p>
            ) : ranked.length === 0 ? (
              <div className={styles.emptyTenants}>
                <p className={styles.cardSub}>
                  No tenant rows available. Start the API, set <code>DATABASE_URL</code>, then run{' '}
                  <code>python -m app.db.seed</code> from the backend folder.
                </p>
                <button type="button" className={styles.submitBtn} onClick={loadRanked}>
                  Retry load
                </button>
              </div>
            ) : (
              <>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="legal-past-visit">
                    Past visit (demo)
                  </label>
                  <select
                    id="legal-past-visit"
                    className={styles.selectField}
                    value={pastVisitId}
                    onChange={(e) => setPastVisitId(e.target.value)}
                  >
                    {DEMO_PAST_VISITS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <p className={styles.noteLaw}>
                    Démo : une seule visite enregistrée. L’adresse du logement est celle du bien Aïn Sebaa
                    associé au profil (non modifiable ici).
                  </p>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="legal-contract-lang">
                    Contract language
                  </label>
                  <select
                    id="legal-contract-lang"
                    className={styles.selectField}
                    value={contractLanguage}
                    onChange={(e) => setContractLanguage(e.target.value)}
                  >
                    <option value="ar">العربية (Arabic)</option>
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <p className={styles.label}>Tenant (from visit)</p>
                  <p className={styles.cardSub} style={{ marginTop: 0, fontWeight: 600, color: '#0f172a' }}>
                    {tenantFromVisitName || '—'}
                  </p>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="legal-rent">
                    Rent agreed (MAD / month)
                  </label>
                  <input
                    id="legal-rent"
                    type="number"
                    min={1}
                    step="any"
                    className={styles.input}
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="legal-deposit">
                    Deposit
                  </label>
                  <select
                    id="legal-deposit"
                    className={styles.selectField}
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                  >
                    <option value="1 month">1 month</option>
                    <option value="2 months">2 months</option>
                  </select>
                  <p className={styles.noteLaw}>
                    Law 67.12 — maximum allowed deposit is <strong>2 months</strong>.
                  </p>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="legal-move">
                    Move-in date
                  </label>
                  <input
                    id="legal-move"
                    type="date"
                    className={styles.input}
                    value={moveIn}
                    onChange={(e) => setMoveIn(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="legal-duration">
                    Lease duration
                  </label>
                  <select
                    id="legal-duration"
                    className={styles.selectField}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  >
                    <option value="6 months">6 months</option>
                    <option value="1 year">1 year</option>
                    <option value="2 years">2 years</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="legal-pay">
                    Payment method
                  </label>
                  <select
                    id="legal-pay"
                    className={styles.selectField}
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                  >
                    <option value="bank transfer">Bank transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                    <option value="mobile money">Mobile money</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="legal-special">
                    Special conditions
                  </label>
                  <textarea
                    id="legal-special"
                    className={styles.textarea}
                    value={special}
                    onChange={(e) => setSpecial(e.target.value)}
                    placeholder="Ex. démo : paiement le 5 de chaque mois (inclus par défaut pour Amal Serhani)."
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="legal-concerns">
                    Legal concerns
                  </label>
                  <textarea
                    id="legal-concerns"
                    className={styles.textarea}
                    value={concerns}
                    onChange={(e) => setConcerns(e.target.value)}
                  />
                </div>

                <button type="submit" className={styles.submitBtn}>
                  Continue to Conflict Check →
                </button>
              </>
            )}
          </form>
        )}

        {step === 2 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Conflict detection & resolution</h2>
            <p className={styles.cardSub}>Align your notes with the tenant profile and Moroccan Law 67.12.</p>

            {loadingDetect ? (
              <div className={styles.spinnerWrap} role="status" aria-live="polite">
                <div className={styles.spinner} aria-hidden />
                <p>Analyzing profiles…</p>
              </div>
            ) : (
              <>
                <p className={styles.sectionTitle}>Agreed points</p>
                {agreedPoints.length === 0 ? (
                  <p className={styles.cardSub}>No extra aligned fields returned — proceed to conflicts below.</p>
                ) : (
                  <ul className={styles.agreedList}>
                    {agreedPoints.map((ap) => (
                      <li key={`${ap.field}-${ap.value}`} className={styles.agreedItem}>
                        <span>
                          <strong>{ap.field}</strong> — {ap.value}
                        </span>
                        <span className={styles.badgeAligned}>Aligned</span>
                      </li>
                    ))}
                  </ul>
                )}

                <p className={styles.sectionTitle}>Conflicts</p>
                {conflicts.length === 0 ? (
                  <p className={styles.cardSub}>No conflicts detected. You can generate the contract.</p>
                ) : (
                  conflicts.map((c) => (
                    <div key={c.id} className={styles.conflictCard}>
                      <h3 className={styles.conflictField}>{c.field.replace(/_/g, ' ')}</h3>
                      <p className={styles.rowYou}>You want → {c.landlord_wants}</p>
                      <p className={styles.rowThey}>Tenant declared → {c.tenant_declared}</p>
                      {c.legal_note ? (
                        <div className={styles.legalBanner}>⚠ {c.legal_note}</div>
                      ) : null}
                      {c.question ? <p className={styles.question}>{c.question}</p> : null}

                      {!c.resolved ? (
                        <>
                          <p className={styles.label}>Did you reach an agreement during the visit?</p>
                          <div className={styles.toggleRow}>
                            <button
                              type="button"
                              className={`${styles.toggleBtn} ${resolutionDraft[c.id] === 'yes' ? styles.toggleBtnOn : ''}`}
                              onClick={() => setResolutionDraft((d) => ({ ...d, [c.id]: 'yes' }))}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              className={`${styles.toggleBtn} ${resolutionDraft[c.id] === 'no' ? styles.toggleBtnOn : ''}`}
                              onClick={() => {
                                setResolutionDraft((d) => ({ ...d, [c.id]: 'no' }))
                              }}
                            >
                              No, still pending
                            </button>
                          </div>
                          {resolutionDraft[c.id] === 'yes' ? (
                            <div className={styles.field}>
                              <label className={styles.label} htmlFor={`agreed-${c.id}`}>
                                Agreed value
                              </label>
                              <input
                                id={`agreed-${c.id}`}
                                className={styles.input}
                                placeholder="e.g. 2 months deposit, bank transfer only…"
                                value={resolutionDraft[`${c.id}_text`] ?? ''}
                                onChange={(e) =>
                                  setResolutionDraft((d) => ({ ...d, [`${c.id}_text`]: e.target.value }))
                                }
                              />
                              <button
                                type="button"
                                className={styles.submitBtn}
                                style={{ marginTop: '0.65rem' }}
                                onClick={() => {
                                  const v = resolutionDraft[`${c.id}_text`]?.trim()
                                  if (!v) {
                                    setError('Enter the agreed value.')
                                    return
                                  }
                                  resolveConflict(c.id, true, v)
                                }}
                              >
                                Confirm alignment
                              </button>
                            </div>
                          ) : null}
                          {resolutionDraft[c.id] === 'no' ? (
                            <button
                              type="button"
                              className={styles.secondaryAction}
                              onClick={() => resolveConflict(c.id, false, null)}
                            >
                              Save as pending
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <p className={styles.resolvedBadge}>
                          {c.resolved ? `✓ Aligned${c.agreed_value ? ` — ${c.agreed_value}` : ''}` : 'Pending'}
                        </p>
                      )}
                    </div>
                  ))
                )}

                <div className={styles.genRow}>
                  {!allResolved ? (
                    <p className={styles.cardSub}>
                      Resolve every conflict (or mark pending blocks generation until resolved).
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className={styles.genBtn}
                    disabled={!allResolved || loadingContract}
                    onClick={handleGenerate}
                  >
                    {loadingContract ? 'Working…' : 'Generate contract'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            {loadingContract ? (
              <div className={styles.card}>
                <div className={styles.spinnerWrap} role="status">
                  <div className={styles.spinner} aria-hidden />
                  <p
                    dir={contractLanguage === 'ar' ? 'rtl' : 'ltr'}
                    style={{ fontSize: '1.05rem', color: '#0f172a' }}
                  >
                    {contractLanguage === 'fr'
                      ? 'Préparation du contrat…'
                      : contractLanguage === 'en'
                        ? 'Preparing your contract…'
                        : 'جاري إعداد عقدك القانوني…'}
                  </p>
                </div>
              </div>
            ) : contractId ? (
              <>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryGrid}>
                    <div>
                      <strong>{summary?.landlord_name}</strong> ↔ <strong>{summary?.tenant_name}</strong>
                    </div>
                    <div>Property: {summary?.property_address || '—'}</div>
                    <div>
                      Rent: {summary?.rent_summary} · Duration: {summary?.duration_summary}
                    </div>
                  </div>
                  <span className={styles.statusReady}>Contract ready ✓</span>
                </div>

                <div className={styles.card} style={{ padding: '1rem' }}>
                  <iframe
                    key={contractLanguage}
                    title="Contract preview"
                    className={styles.previewFrame}
                    srcDoc={contractHtml}
                    sandbox="allow-same-origin allow-popups"
                  />
                </div>

                <div className={styles.actionsRow}>
                  <button type="button" className={styles.actionLink} onClick={printPdf}>
                    📄 Save as PDF
                  </button>
                  <a className={styles.actionLink} href={legalContractDocxUrl(contractId)} download>
                    📝 Download Word
                  </a>
                </div>

                <div className={styles.nextCard}>
                  <h3 className={styles.nextTitle}>What to do next</h3>
                  <ol className={styles.nextList}>
                    <li>Print 3 copies of this contract.</li>
                    <li>Both parties sign all copies physically.</li>
                    <li>Go to your local المقاطعة for مصادقة على التوقيع.</li>
                    <li>Each party keeps one signed copy.</li>
                  </ol>
                </div>

                <div className={styles.uploadZone}>
                  <p className={styles.cardSub} style={{ marginBottom: '0.75rem' }}>
                    Once signed, upload a photo of the contract to complete the process.
                  </p>
                  <label className={styles.uploadLabel}>
                    📸 Upload signed contract
                    <input type="file" accept="image/*,.pdf" onChange={onUploadSigned} />
                  </label>
                  {signedOk ? <p className={styles.signedBadge}>Signed ✅</p> : null}
                </div>

                <button type="button" className={styles.resetLink} onClick={resetWizard}>
                  Start a new legal workflow
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </>
  )
}
