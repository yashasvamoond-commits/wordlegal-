import { courtByKey } from '../data/courts'
import type { CourtKey } from '../types'

export const COURT_LABEL_SHORT = (k: CourtKey) => courtByKey(k).short

export const PAGE_LABELS: Record<string, string> = {
  legal: 'लीगल 8.5 × 14',
  legal13: 'लीगल 13',
  a4: 'A4',
  letter: 'लेटर',
}

export const MARGIN_PRESETS = [
  { label: 'मानक न्यायालयीन (बायाँ 1.25″)', v: { marginTop: 1, marginRight: 1, marginBottom: 1, marginLeft: 1.25 } },
  { label: 'सामान्य (सभी 1″)', v: { marginTop: 1, marginRight: 1, marginBottom: 1, marginLeft: 1 } },
  { label: 'चौड़ा बायाँ (1.5″)', v: { marginTop: 1, marginRight: 0.9, marginBottom: 1, marginLeft: 1.5 } },
  { label: 'संकीर्ण (0.75″)', v: { marginTop: 0.75, marginRight: 0.75, marginBottom: 0.75, marginLeft: 0.75 } },
  { label: 'फाइलिंग हेतु (बायाँ 2″)', v: { marginTop: 1, marginRight: 0.8, marginBottom: 1, marginLeft: 2 } },
]
