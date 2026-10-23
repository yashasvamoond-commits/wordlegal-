/* ------------------------------------------------------------------
   स्थानीय संग्रहण — दस्तावेज़, सेटिंग्स, पसंदीदा शब्द
   ------------------------------------------------------------------ */
import { DEFAULT_CASE, DEFAULT_PAGE, PAGE_SIZES, courtHeading } from '../data/courts'
import { todayHi } from './fields'
import type { CaseDetails, DocRecord, PageSettings } from '../types'

const K_DOCS = 'wl.docs.v1'
const K_SET = 'wl.settings.v1'
const K_FAV = 'wl.fav.v1'
const K_RECENT = 'wl.recent.v1'

export interface Settings {
  theme: 'dark' | 'light'
  zoom: number
  autoFill: boolean
  showGuides: boolean
  showKeyboardStrip: boolean
  lastTab: string
  docFont: string
  docSize: string
  docLh: string
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  zoom: 1,
  autoFill: true,
  showGuides: true,
  showKeyboardStrip: false,
  lastTab: 'home',
  docFont: "'Noto Serif Devanagari', 'Noto Sans Devanagari', serif",
  docSize: '12pt',
  docLh: '1.5',
}

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('storage full', e)
  }
}

export function loadDocs(): DocRecord[] {
  const docs = read<DocRecord[]>(K_DOCS, [])
  return Array.isArray(docs) ? docs : []
}
export function saveDocs(docs: DocRecord[]) {
  write(K_DOCS, docs)
}
export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(K_SET, {}) }
}
export function saveSettings(s: Settings) {
  write(K_SET, s)
}
export function loadFavs(): string[] {
  const v = read<string[]>(K_FAV, [])
  return Array.isArray(v) ? v : []
}
export function saveFavs(ids: string[]) {
  write(K_FAV, ids)
}
export function loadRecent(): string[] {
  const v = read<string[]>(K_RECENT, [])
  return Array.isArray(v) ? v : []
}
export function saveRecent(ids: string[]) {
  write(K_RECENT, ids.slice(0, 40))
}

export const emptyPage = (): PageSettings => ({ ...DEFAULT_PAGE, showGuides: true })
export const emptyCase = (): CaseDetails => ({ ...DEFAULT_CASE })

export function pageDims(p: PageSettings) {
  const base = PAGE_SIZES[p.size] ?? PAGE_SIZES.legal
  const w = p.orientation === 'landscape' ? base.h : base.w
  const h = p.orientation === 'landscape' ? base.w : base.h
  return { w, h, base, label: base.hi }
}

/** नया खाली दस्तावेज़ — लीगल साइज़, न्यायालय-शीर्षक तैयार */
export function createBlankDoc(court: CaseDetails['court'] = 'jmfc', place = ''): DocRecord {
  const cd: CaseDetails = { ...emptyCase(), court, place }
  const page = emptyPage()
  const body = `<p class="doc-court">{{COURT_HEAD}}</p>
<p class="doc-caseno">आपराधिक प्रकरण संख्या: </p>
<p class="doc-party"><strong>{{PARTYA_LABEL}}:</strong> {{PARTYA}}<br><em>बनाम</em><br><strong>{{PARTYB_LABEL}}:</strong> {{PARTYB}}</p>
<p class="doc-subject"><strong>विषय: </strong></p>
<p class="doc-body">माननीय न्यायालय महोदय,</p>
<p class="doc-body">सविनय निवेदन है कि </p>
<p class="doc-prayer"><strong>प्रार्थना</strong></p>
<p class="doc-body">अतः प्रार्थना है कि माननीय न्यायालय कृपया </p>
<p class="doc-sign">दिनांक: {{DATE}}</p>
<p class="doc-sign">स्थान: {{PLACE}}</p>
<p class="doc-sign"><strong>प्रार्थी/निवेदक</strong><br>{{CLIENT}}<br>प्रार्थी अधिवक्ता: {{ADV}}</p>`
  return {
    id: uid(),
    title: 'नया विधिक मसौदा',
    html: body
      .replace(/\{\{\s*COURT_HEAD\s*\}\}/g, courtHeading(cd, true))
      .replace(/\{\{\s*DATE\s*\}\}/g, todayHi()),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    page,
    caseDetails: cd,
    starred: false,
    versions: [],
  }
}

export function createDocFromTemplate(
  tpl: { title: string; body: string },
  caseDetails?: Partial<CaseDetails>,
  page?: Partial<PageSettings>,
): DocRecord {
  const cd: CaseDetails = { ...emptyCase(), ...caseDetails }
  const pg: PageSettings = { ...emptyPage(), ...page }
  return {
    id: uid(),
    title: tpl.title,
    html: tpl.body,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    page: pg,
    caseDetails: cd,
    starred: false,
    versions: [],
  }
}

export function fmtDate(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function fmtAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.round(diff / 60000)
  if (m < 1) return 'अभी';
  if (m < 60) return `${m} मिनट पहले`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} घंटे पहले`
  const d = Math.round(h / 24)
  if (d < 30) return `${d} दिन पहले`
  return fmtDate(ts).slice(0, 10)
}


export function readingTime(html: string): number {
  const words = htmlToText(html).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 150))
}

export function htmlToText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  div.querySelectorAll('br').forEach((b) => b.replaceWith('\n'))
  div.querySelectorAll('p,div,li,h1,h2,h3,tr').forEach((el) => el.append('\n'))
  return (div.textContent ?? '').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim()
}

export function wordCount(html: string): number {
  return htmlToText(html).split(/\s+/).filter(Boolean).length
}
