import { useId, useMemo, useState } from 'react'
import { PROPERTY_LISTINGS } from '../../data/propertyListings'
import { MATCHING_SECTIONS } from '../../data/matchingCandidates'
import styles from './ProfileMatchingPage.module.css'
import shellStyles from './Dashboard.module.css'

function candidatePhotoUrl(photoIndex) {
  if (photoIndex == null) return null
  return `${import.meta.env.BASE_URL}candidates/candidate-${photoIndex}.png`
}

/** Alternates one candidate with a photo and one without (photo, none, photo, none, …). */
function interleaveByPhoto(sections) {
  const withPhoto = []
  const withoutPhoto = []
  for (const section of sections) {
    for (const c of section.candidates) {
      const item = { ...c, tierId: section.id, tierTitle: section.title }
      if (c.photoIndex != null) withPhoto.push(item)
      else withoutPhoto.push(item)
    }
  }
  const out = []
  let i = 0
  let j = 0
  while (i < withPhoto.length || j < withoutPhoto.length) {
    if (i < withPhoto.length) out.push(withPhoto[i++])
    if (j < withoutPhoto.length) out.push(withoutPhoto[j++])
  }
  return out
}

function FacelessAvatar() {
  return (
    <div className={styles.facelessWrap} role="img" aria-label="No profile photo">
      <svg
        className={styles.facelessSvg}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" opacity="0.22" />
        <ellipse cx="32" cy="24" rx="12" ry="12" fill="currentColor" opacity="0.2" />
        <path
          d="M14 52c2.5-10 8.5-15 18-15s15.5 5 18 15"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          fill="none"
          opacity="0.28"
        />
      </svg>
    </div>
  )
}

const defaultCriteria = {
  rent: '7200',
  chargeWater: true,
  chargeElectric: false,
  chargeSyndic: true,
  depositMonths: '2',
  guarantor: 'depends',
  minIncome: '15000',
  employmentType: 'any',
  maxOccupants: '2',
  usage: 'residential',
  pets: 'no',
  smokers: 'no',
  leaseTerm: '1 year',
  paymentMethod: 'transfer',
  noticePeriod: '1 month',
  availabilityDate: '2026-04-15',
}

const TIER_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'strong', label: 'Strong fit' },
  { id: 'review', label: 'Review' },
  { id: 'risk', label: 'Higher risk' },
]

export default function ProfileMatchingPage() {
  const dialogTitleId = useId()
  const [selectedId, setSelectedId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [criteria, setCriteria] = useState(defaultCriteria)
  const [tierFilter, setTierFilter] = useState('all')

  const selected = PROPERTY_LISTINGS.find((p) => p.id === selectedId) ?? null

  const interleavedCandidates = useMemo(() => {
    const sections =
      tierFilter === 'all'
        ? MATCHING_SECTIONS
        : MATCHING_SECTIONS.filter((s) => s.id === tierFilter)
    return interleaveByPhoto(sections)
  }, [tierFilter])

  const setField = (key, value) => {
    setCriteria((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <header className={shellStyles.pageHead}>
        <div>
          <p className={shellStyles.kicker}>Casablanca · Portfolio</p>
          <h1 className={shellStyles.pageTitle}>Profile matching</h1>
        </div>
        <p className={shellStyles.pageMeta}>
          Select a unit, define your desired tenant profile, and review applicants. Layout only — matching rules are not
          active yet.
        </p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.unitPanel} aria-label="Units">
          <h2 className={styles.panelTitle}>Units</h2>
          <ul className={styles.unitList}>
            {PROPERTY_LISTINGS.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`${styles.unitCard} ${selectedId === p.id ? styles.unitCardActive : ''}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <span className={styles.unitThumbWrap}>
                    <img src={p.imageUrl} alt="" className={styles.unitThumb} />
                  </span>
                  <span className={styles.unitMeta}>
                    <span className={styles.unitName}>{p.shortName}</span>
                    <span className={styles.unitPrice}>{p.monthlyPrice.toLocaleString('en-US')} MAD / month</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className={styles.mainPanel}>
          {!selected ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No unit selected</p>
              <p className={styles.emptyText}>Choose a unit on the left to open the desired-profile form and applicant list.</p>
            </div>
          ) : (
            <>
              <div className={styles.toolbar}>
                <div>
                  <p className={styles.toolbarKicker}>Selected unit</p>
                  <p className={styles.toolbarTitle}>{selected.shortName}</p>
                </div>
                <button type="button" className={styles.primaryBtn} onClick={() => setModalOpen(true)}>
                  Edit desired tenant profile
                </button>
              </div>

              <div
                className={styles.filterBar}
                role="tablist"
                aria-label="Filter by match tier"
              >
                {TIER_FILTERS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tierFilter === id}
                    className={tierFilter === id ? styles.filterOn : styles.filterOff}
                    onClick={() => setTierFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className={styles.candidates}>
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Applicants</h3>
                  <p className={styles.sectionHint}>
                    {tierFilter === 'all'
                      ? 'Showing all tiers. Cards alternate between profiles with a photo and without.'
                      : `Showing ${TIER_FILTERS.find((f) => f.id === tierFilter)?.label ?? ''} only. Same alternation within this group.`}
                  </p>
                  <ul className={styles.cardGrid}>
                    {interleavedCandidates.length === 0 ? (
                      <li className={styles.listEmpty}>No applicants in this category.</li>
                    ) : (
                      interleavedCandidates.map((c) => {
                      const photoSrc = candidatePhotoUrl(c.photoIndex)
                      return (
                        <li key={c.id} className={styles.candidateCard}>
                          <div className={styles.candidateTop}>
                            {photoSrc ? (
                              <img
                                src={photoSrc}
                                alt=""
                                className={styles.candidatePhoto}
                                width={72}
                                height={72}
                              />
                            ) : (
                              <div className={styles.candidatePhotoEmpty}>
                                <FacelessAvatar />
                              </div>
                            )}
                            <div className={styles.candidateNameBlock}>
                              <span className={styles.tierBadge}>{c.tierTitle}</span>
                              <p className={styles.candidateName}>{c.name}</p>
                            </div>
                          </div>
                          <dl className={styles.candidateDl}>
                            {c.rows.map((row) => (
                              <div key={row.label} className={styles.candidateRow}>
                                <dt>{row.label}</dt>
                                <dd>
                                  <span className={styles.rowValue}>{row.value}</span>
                                  <span
                                    className={
                                      row.status === 'ok'
                                        ? styles.tagOk
                                        : row.status === 'warn'
                                          ? styles.tagWarn
                                          : styles.tagGap
                                    }
                                  >
                                    {row.status === 'ok'
                                      ? 'Aligned'
                                      : row.status === 'warn'
                                        ? 'Review'
                                        : 'Gap'}
                                  </span>
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </li>
                      )
                    })
                    )}
                  </ul>
                </section>
              </div>
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setModalOpen(false)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id={dialogTitleId} className={styles.modalTitle}>
                Desired tenant profile — {selected?.shortName ?? 'Unit'}
              </h2>
              <button type="button" className={styles.modalClose} onClick={() => setModalOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <section className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>Rent and charges</h3>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span className={styles.label}>Requested rent (MAD / month)</span>
                    <input
                      type="number"
                      className={styles.input}
                      value={criteria.rent}
                      onChange={(e) => setField('rent', e.target.value)}
                    />
                  </label>
                  <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>Charges included (water, electricity, syndic)</legend>
                    <label className={styles.check}>
                      <input
                        type="checkbox"
                        checked={criteria.chargeWater}
                        onChange={(e) => setField('chargeWater', e.target.checked)}
                      />{' '}
                      Water
                    </label>
                    <label className={styles.check}>
                      <input
                        type="checkbox"
                        checked={criteria.chargeElectric}
                        onChange={(e) => setField('chargeElectric', e.target.checked)}
                      />{' '}
                      Electricity
                    </label>
                    <label className={styles.check}>
                      <input
                        type="checkbox"
                        checked={criteria.chargeSyndic}
                        onChange={(e) => setField('chargeSyndic', e.target.checked)}
                      />{' '}
                      Syndic
                    </label>
                  </fieldset>
                  <label className={styles.field}>
                    <span className={styles.label}>Security deposit</span>
                    <select
                      className={styles.select}
                      value={criteria.depositMonths}
                      onChange={(e) => setField('depositMonths', e.target.value)}
                    >
                      <option value="1">1 month</option>
                      <option value="2">2 months</option>
                      <option value="3">3 months</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Guarantor required</span>
                    <select
                      className={styles.select}
                      value={criteria.guarantor}
                      onChange={(e) => setField('guarantor', e.target.value)}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="depends">Depends on profile</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>Step 3 — Preferred tenant profile</h3>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span className={styles.label}>Minimum monthly income (MAD)</span>
                    <input
                      type="number"
                      className={styles.input}
                      value={criteria.minIncome}
                      onChange={(e) => setField('minIncome', e.target.value)}
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Preferred employment type</span>
                    <select
                      className={styles.select}
                      value={criteria.employmentType}
                      onChange={(e) => setField('employmentType', e.target.value)}
                    >
                      <option value="permanent">Permanent (CDI)</option>
                      <option value="civil">Civil service</option>
                      <option value="self">Self-employed</option>
                      <option value="student">Student</option>
                      <option value="any">Any</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Maximum occupants</span>
                    <input
                      type="number"
                      min={1}
                      className={styles.input}
                      value={criteria.maxOccupants}
                      onChange={(e) => setField('maxOccupants', e.target.value)}
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Accepted use</span>
                    <select
                      className={styles.select}
                      value={criteria.usage}
                      onChange={(e) => setField('usage', e.target.value)}
                    >
                      <option value="residential">Residential</option>
                      <option value="professional">Professional</option>
                      <option value="both">Both</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Pets allowed</span>
                    <select
                      className={styles.select}
                      value={criteria.pets}
                      onChange={(e) => setField('pets', e.target.value)}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Smoking allowed</span>
                    <select
                      className={styles.select}
                      value={criteria.smokers}
                      onChange={(e) => setField('smokers', e.target.value)}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>Step 4 — Lease terms</h3>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span className={styles.label}>Preferred lease length</span>
                    <select
                      className={styles.select}
                      value={criteria.leaseTerm}
                      onChange={(e) => setField('leaseTerm', e.target.value)}
                    >
                      <option value="6 months">6 months</option>
                      <option value="1 year">1 year</option>
                      <option value="2 years">2 years</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Preferred payment method</span>
                    <select
                      className={styles.select}
                      value={criteria.paymentMethod}
                      onChange={(e) => setField('paymentMethod', e.target.value)}
                    >
                      <option value="transfer">Bank transfer</option>
                      <option value="check">Check</option>
                      <option value="cash">Cash</option>
                      <option value="mobile">Mobile money</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Notice period for move-out</span>
                    <select
                      className={styles.select}
                      value={criteria.noticePeriod}
                      onChange={(e) => setField('noticePeriod', e.target.value)}
                    >
                      <option value="1 month">1 month</option>
                      <option value="3 months">3 months</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Property available from (move-in)</span>
                    <input
                      type="date"
                      className={styles.input}
                      value={criteria.availabilityDate}
                      onChange={(e) => setField('availabilityDate', e.target.value)}
                    />
                  </label>
                </div>
              </section>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setModalOpen(false)}>
                Close
              </button>
              <button type="button" className={styles.primaryBtn} onClick={() => setModalOpen(false)}>
                Save (preview)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
