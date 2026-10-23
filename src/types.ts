/* ------------------------------------------------------------------
   WordLegal — shared types
   ------------------------------------------------------------------ */

export type CourtKey = 'jmfc' | 'acjm' | 'adsj' | 'cjm' | 'dsj' | 'custom'

export interface CourtDef {
  key: CourtKey
  hi: string
  en: string
  short: string
  /** how the court is addressed in the cause-title */
  headingHi: (place: string) => string
  headingEn: (place: string) => string
  /** maximum sentencing power / jurisdiction note */
  power: string
  /** applications commonly filed in this court */
  competent: string[]
  tier: 'magistrate' | 'sessions' | 'custom'
}

export interface CaseDetails {
  court: CourtKey
  customCourt: string
  place: string
  courtRoom: string
  caseNo: string
  firNo: string
  policeStation: string
  sections: string
  partyA: string
  partyALabel: string
  partyB: string
  partyBLabel: string
  clientName: string
  clientAddress: string
  clientPhone: string
  counselName: string
  counselRegNo: string
  counselAddress: string
  counselPhone: string
  nextDate: string
  today: string
}

export type PageSize = 'legal' | 'a4' | 'letter' | 'legal13'

export interface PageSettings {
  size: PageSize
  orientation: 'portrait' | 'landscape'
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  /** header / footer band heights, in inches */
  headerBand: number
  footerBand: number
  lineNumbers: boolean
  showGuides: boolean
  watermark: 'none' | 'DRAFT' | 'अंतिम प्रारूप' | 'कॉपी' | 'CONFIDENTIAL' | 'custom'
  watermarkText: string
  headerText: string
  footerText: string
  pageNumbers: boolean
  firstPageHeader: boolean
  borderFrame: boolean
}

export interface DocRecord {
  id: string
  title: string
  html: string
  json?: unknown
  createdAt: number
  updatedAt: number
  page: PageSettings
  caseDetails: CaseDetails
  starred?: boolean
  versions: { at: number; html: string; label: string }[]
}

export interface RuleRef {
  oldAct: 'IPC' | 'CrPC' | 'IEA' | '—'
  oldSec: string
  newAct: 'BNS' | 'BNSS' | 'BSA' | '—'
  newSec: string
  hi: string
  en: string
  note?: string
}

export interface DictEntry {
  id: string
  hi: string
  en: string
  cat: string
  rarity: 'सामान्य' | 'विशिष्ट' | 'दुर्लभ'
  meaning: string
  usage?: string
  alt?: string
  latin?: boolean
  /** extra Hindi spellings / english variants used by the search engine */
  keys: string
}

export interface TemplateDef {
  id: string
  title: string
  subtitle: string
  category: string
  courts: CourtKey[]
  statute: string
  useWhen: string
  checklist: string[]
  body: string
  tags: string
}

export interface PhraseDef {
  id: string
  title: string
  cat: string
  body: string
}

export type RibbonTab = 'file' | 'home' | 'insert' | 'layout' | 'review' | 'legal' | 'view'

export type SheetKey =
  | 'dict'
  | 'templates'
  | 'law'
  | 'case'
  | 'page'
  | 'preview'
  | 'find'
  | 'check'
  | 'versions'
  | 'settings'
  | 'about'
  | 'phrases'
  | 'export'
  | 'exportPdf'

/** संपादक का imperative API — शीट/शब्दकोश से लिखने हेतु */
export interface EditorApi {
  insertText: (t: string) => void
  insertHtml: (h: string) => void
  getHTML: () => string
  getText: () => string
  setHTML: (h: string) => void
  replaceAll: (find: string, rep: string, caseSensitive?: boolean) => number
  focus: () => void
  setPageBreak: () => void
  selectionText: () => string
}
