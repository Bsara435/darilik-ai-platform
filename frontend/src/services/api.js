/**
 * DariLik FastAPI client.
 * Dev: Vite proxies /tenants → backend (see vite.config.js).
 * Prod: set VITE_API_BASE_URL (e.g. https://api.example.com) if API is on another origin.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function url(path) {
  return `${API_BASE}${path}`
}

/**
 * FastAPI returns { "detail": "..." } or { "detail": [...] } on errors.
 * @param {Response} res
 */
async function readApiErrorMessage(res) {
  const text = await res.text().catch(() => '')
  const trimmed = text?.trim()
  if (!trimmed) return `HTTP ${res.status}`
  try {
    const body = JSON.parse(trimmed)
    const d = body?.detail
    if (typeof d === 'string') return d
    if (Array.isArray(d)) {
      return d.map((x) => (typeof x === 'object' && x.msg ? x.msg : JSON.stringify(x))).join('; ')
    }
    if (d != null) return JSON.stringify(d)
  } catch {
    /* not JSON */
  }
  return trimmed.length > 600 ? `${trimmed.slice(0, 600)}…` : trimmed
}

/**
 * @param {RequestInit} [init] — optional `signal` for timeout / abort
 * @returns {Promise<Array>} GET /tenants/ranked — full tenant rows with scores
 */
export async function fetchRankedTenants(init = {}) {
  const res = await fetch(url('/tenants/ranked'), {
    cache: 'no-store',
    ...init,
  })
  if (!res.ok) {
    const msg = await readApiErrorMessage(res)
    throw new Error(msg)
  }
  return res.json()
}

/**
 * Raw tenant rows from DB (no scores). Use when `/tenants/ranked` fails.
 * @param {RequestInit} [init]
 */
export async function fetchTenantsList(init = {}) {
  const res = await fetch(url('/tenants/'), {
    cache: 'no-store',
    ...init,
  })
  if (!res.ok) {
    const msg = await readApiErrorMessage(res)
    throw new Error(msg)
  }
  return res.json()
}

/**
 * @param {Array<{ name: string, financial_score: number, payment_score: number, stability_score: number, combined_score: number }>} tenants
 * @returns {Promise<Array>} POST /tenants/explanations — enriched rows
 */
export async function fetchTenantExplanations(tenants) {
  const res = await fetch(url('/tenants/explanations'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenants }),
  })
  if (!res.ok) {
    const msg = await readApiErrorMessage(res)
    throw new Error(msg)
  }
  return res.json()
}

/**
 * Maps backend ranked row → payload for explanations endpoint.
 * @param {object} row — TenantRankedRead from API (uses full_name)
 */
export function rankedRowToExplanationPayload(row) {
  return {
    name: row.full_name,
    financial_score: row.financial_score,
    payment_score: row.payment_score,
    stability_score: row.stability_score,
    combined_score: row.combined_score,
  }
}

/** @param {object} body */
export async function postLegalPostVisit(body) {
  const res = await fetch(url('/api/legal/post-visit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readApiErrorMessage(res))
  return res.json()
}

/** @param {number} visitId */
export async function postLegalDetectConflicts(visitId) {
  const res = await fetch(url('/api/legal/detect-conflicts'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visit_id: visitId }),
  })
  if (!res.ok) throw new Error(await readApiErrorMessage(res))
  return res.json()
}

/** @param {number} conflictId @param {{ resolved: boolean, agreed_value?: string|null }} body */
export async function patchLegalResolveConflict(conflictId, body) {
  const res = await fetch(url(`/api/legal/conflicts/${conflictId}/resolve`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readApiErrorMessage(res))
  return res.json()
}

/** @param {number} visitId */
export async function postLegalGenerateContract(visitId) {
  const res = await fetch(url('/api/legal/generate-contract'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visit_id: visitId }),
  })
  if (!res.ok) throw new Error(await readApiErrorMessage(res))
  return res.json()
}

export function legalContractDocxUrl(contractId) {
  return url(`/api/legal/contracts/${contractId}/docx`)
}

/** @param {number} contractId @param {File} file */
export async function postLegalUploadSigned(contractId, file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(url(`/api/legal/contracts/${contractId}/upload-signed`), {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) throw new Error(await readApiErrorMessage(res))
  return res.json()
}
