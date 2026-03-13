/**
 * KOL Vault Deal State Machine
 *
 * Valid status flow:
 *
 *   draft ──→ open ──→ in_progress ──→ pending_review ──→ completed
 *     │         │            │                │
 *     └→ cancelled    └→ disputed ←──────────┘
 *                            │
 *                    pending_review (after resolution)
 *
 * Project can trigger:  draft→open, draft→cancelled, open→cancelled, in_progress→pending_review
 * System auto-triggers: open→in_progress (on application accept), in_progress/pending_review→disputed
 * Admin can trigger:    any valid transition + completed→cancelled (refund case)
 */

export type DealStatus =
  | 'draft'
  | 'open'
  | 'in_progress'
  | 'pending_review'
  | 'completed'
  | 'cancelled'
  | 'disputed'

/** Transitions a project owner is allowed to trigger manually */
const PROJECT_TRANSITIONS: Partial<Record<DealStatus, DealStatus[]>> = {
  draft:       ['open', 'cancelled'],
  open:        ['cancelled'],
  in_progress: ['pending_review'],
}

/** Transitions any authenticated party can trigger */
const PARTY_TRANSITIONS: Partial<Record<DealStatus, DealStatus[]>> = {
  in_progress:    ['disputed'],
  pending_review: ['disputed'],
}

/** Admin can make any of these transitions */
const ADMIN_TRANSITIONS: Partial<Record<DealStatus, DealStatus[]>> = {
  draft:          ['open', 'cancelled'],
  open:           ['in_progress', 'cancelled'],
  in_progress:    ['pending_review', 'disputed', 'completed', 'cancelled'],
  pending_review: ['completed', 'disputed', 'cancelled'],
  disputed:       ['pending_review', 'completed', 'cancelled'],
  completed:      ['cancelled'], // refund path
}

export type TransitionRole = 'project' | 'kol' | 'admin'

export interface TransitionResult {
  allowed: boolean
  reason?: string
}

export function canTransition(
  from: DealStatus,
  to: DealStatus,
  role: TransitionRole
): TransitionResult {
  if (from === to) {
    return { allowed: false, reason: 'Deal is already in this status' }
  }

  if (role === 'admin') {
    const allowed = ADMIN_TRANSITIONS[from]?.includes(to) ?? false
    return allowed
      ? { allowed: true }
      : { allowed: false, reason: `Admins cannot move a deal from '${from}' to '${to}'` }
  }

  if (role === 'project') {
    const allowed = PROJECT_TRANSITIONS[from]?.includes(to) ?? false
    return allowed
      ? { allowed: true }
      : { allowed: false, reason: `Cannot move deal from '${from}' to '${to}'. Allowed: ${PROJECT_TRANSITIONS[from]?.join(', ') ?? 'none'}` }
  }

  if (role === 'kol') {
    const allowed = PARTY_TRANSITIONS[from]?.includes(to) ?? false
    return allowed
      ? { allowed: true }
      : { allowed: false, reason: `KOLs cannot change deal status from '${from}' to '${to}'` }
  }

  return { allowed: false, reason: 'Unknown role' }
}

/** Terminal statuses — no further transitions */
export const TERMINAL_STATUSES: DealStatus[] = ['completed', 'cancelled']

export function isTerminal(status: DealStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}
