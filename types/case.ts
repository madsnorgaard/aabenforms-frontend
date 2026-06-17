/**
 * A municipal case (sag) as surfaced in the caseworker inbox.
 *
 * Mirrors the aabenforms_case Drupal entity exposed via JSON:API. The raw CPR
 * is never part of this payload - it stays encrypted on the linked submission.
 */
export interface CaseItem {
  id: string
  title: string
  caseType: string
  status: CaseStatus
  /** Deadline (frist) due as a Unix timestamp in seconds, or null. */
  fristDue: number | null
  /** Receipt date as a Unix timestamp in seconds, or null. */
  modtagelsesdato: number | null
  created: string | null
}

export type CaseStatus =
  | 'modtaget'
  | 'oplyst'
  | 'partshoering'
  | 'afgoerelse'
  | 'paaklaget'
  | 'lukket'

/** Deadline traffic-light state. */
export type FristState = 'groen' | 'gul' | 'roed' | 'none'
