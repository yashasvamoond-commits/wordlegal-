import { courtByKey } from '../data/courts'
import type { CaseDetails } from '../types'

export function COURT_LABEL(cd: CaseDetails): string {
  if (cd.court === 'custom') return cd.customCourt || 'न्यायालय'
  const c = courtByKey(cd.court)
  return cd.place ? `${c.short} · ${cd.place}` : c.short
}

export function courtFull(cd: CaseDetails): string {
  if (cd.court === 'custom') return cd.customCourt || 'न्यायालय'
  return courtByKey(cd.court).hi
}
