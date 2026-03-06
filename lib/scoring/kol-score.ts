/**
 * KOL Score calculation for KOLVault.
 *
 * Score range: 0–100
 * A KOL starts at 50 on first campaign.
 *
 * Delta per campaign:
 *   - success  (≥100% KPI): +10 (capped at 100)
 *   - partial  (50–99% KPI): +2
 *   - failure  (<50% KPI):   -8
 *   - dispute ruled against: additional -5
 *   - dispute dismissed:     no change
 *
 * Tier assignment based on score:
 *   - bronze:   0–39
 *   - silver:  40–59
 *   - gold:    60–79
 *   - platinum: 80–100
 */

export type KOLTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export function calculateScoreDelta(verdict: 'success' | 'partial' | 'failure'): number {
  switch (verdict) {
    case 'success': return 10
    case 'partial': return 2
    case 'failure': return -8
  }
}

export function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score))
}

export function assignTier(score: number): KOLTier {
  if (score >= 80) return 'platinum'
  if (score >= 60) return 'gold'
  if (score >= 40) return 'silver'
  return 'bronze'
}

export function calculateFee(budgetUsdc: number, feeBps: number): number {
  return (budgetUsdc * feeBps) / 10000
}
