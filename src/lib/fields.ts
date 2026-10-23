/* ------------------------------------------------------------------
   प्रारूप फ़ील्ड — केस विवरण से {{PLACEHOLDER}} भरना
   ------------------------------------------------------------------ */
import { courtHeading } from '../data/courts'
import type { CaseDetails, PageSettings } from '../types'

/** आज की तिथि — dd.mm.yyyy */
export function todayHi(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const or = (v: string | undefined, d: string) => (v && v.trim() ? esc(v.trim()) : d)

/** रिक्त फ़ील्ड हेतु प्रदर्शित पाठ — बाद में इन्हें भी भरा जा सकता है */
export const FALLBACKS: Record<string, string> = {
  COURT_HEAD: '[न्यायालय का नाम]',
  COURT_EN: '[Court name]',
  CASE: '[प्रकरण संख्या]',
  FIR: '[एफ.आई.आर. संख्या]',
  PS: '[थाना]',
  SECTIONS: '[धाराएँ]',
  PARTYA: '[पक्षकार — प्रथम]',
  PARTYA_LABEL: 'अभियुक्त',
  PARTYB: 'राज्य',
  PARTYB_LABEL: 'अभियोजन',
  CLIENT: '[प्रार्थी का नाम]',
  CLIENTADDR: '[प्रार्थी का पता]',
  ADDR: '[पता]',
  PHONE: '',
  ADV: '[प्रार्थी अधिवक्ता]',
  ADVREG: '[पंजीकरण संख्या]',
  ADVADDR: '[अधिवक्ता का पता]',
  DATE: '',
  PLACE: '[स्थान]',
  ROOM: '[न्यायालय कक्ष]',
  NEXTDATE: '[अगली तिथि]',
  WATERMARK: '',
}

/** सभी उपलब्ध फ़ील्ड → मान */
export function fieldValues(cd: CaseDetails, page?: PageSettings): Record<string, string> {
  const court = cd.court === 'custom'
    ? or(cd.customCourt, FALLBACKS.COURT_HEAD)
    : esc(courtHeading(cd, true))
  return {
    COURT_HEAD: court,
    COURT_EN: esc(cd.court === 'custom' ? cd.customCourt : courtHeading(cd, false)),
    CASE: or(cd.caseNo, FALLBACKS.CASE),
    FIR: or(cd.firNo, FALLBACKS.FIR),
    PS: or(cd.policeStation, FALLBACKS.PS),
    SECTIONS: or(cd.sections, FALLBACKS.SECTIONS),
    PARTYA: or(cd.partyA, FALLBACKS.PARTYA),
    PARTYA_LABEL: or(cd.partyALabel, FALLBACKS.PARTYA_LABEL),
    PARTYB: or(cd.partyB, FALLBACKS.PARTYB),
    PARTYB_LABEL: or(cd.partyBLabel, FALLBACKS.PARTYB_LABEL),
    CLIENT: or(cd.clientName, FALLBACKS.CLIENT),
    CLIENTADDR: or(cd.clientAddress, FALLBACKS.CLIENTADDR),
    ADDR: or(cd.clientAddress, FALLBACKS.ADDR),
    PHONE: or(cd.clientPhone, ''),
    ADV: or(cd.counselName, FALLBACKS.ADV),
    ADVREG: or(cd.counselRegNo, FALLBACKS.ADVREG),
    ADVADDR: or(cd.counselAddress, FALLBACKS.ADVADDR),
    DATE: or(cd.today, todayHi()),
    PLACE: or(cd.place, FALLBACKS.PLACE),
    ROOM: or(cd.courtRoom, FALLBACKS.ROOM),
    NEXTDATE: or(cd.nextDate, FALLBACKS.NEXTDATE),
    WATERMARK: page?.watermarkText ? esc(page.watermarkText) : '',
  }
}

/** किसी एक फ़ील्ड का टोकन-रेगुलर एक्सप्रेशन */
export function tokenRe(key: string): RegExp {
  return new RegExp('\\{\\{\\s*' + key + '\\s*\\}\\}', 'g')
}

/** प्रारूप में सभी ज्ञात फ़ील्ड भरें */
export function fillTemplate(html: string, cd: CaseDetails, page?: PageSettings): string {
  const vals = fieldValues(cd, page)
  return html.replace(/\{\{\s*([A-Z_]+)\s*\}\}/g, (m, key: string) => vals[key] ?? m)
}

/** दस्तावेज़ में बचे हुए (अभी न भरे) फ़ील्ड */
export function remainingFields(html: string): string[] {
  const out = new Set<string>()
  for (const m of html.matchAll(/\{\{\s*([A-Z_]+)\s*\}\}/g)) out.add(m[1])
  return [...out]
}

export interface FieldDef {
  key: string
  label: string
  group: string
}

/** रिबन → "फ़ील्ड जोड़ें" हेतु */
export const FIELD_DEFS: FieldDef[] = [
  { key: 'COURT_HEAD', label: 'न्यायालय शीर्षक', group: 'शीर्षक' },
  { key: 'CASE', label: 'प्रकरण संख्या', group: 'शीर्षक' },
  { key: 'FIR', label: 'एफ.आई.आर. संख्या', group: 'शीर्षक' },
  { key: 'PS', label: 'थाना', group: 'शीर्षक' },
  { key: 'SECTIONS', label: 'धाराएँ', group: 'शीर्षक' },
  { key: 'ROOM', label: 'न्यायालय कक्ष', group: 'शीर्षक' },
  { key: 'PARTYA', label: 'पक्षकार — प्रथम', group: 'पक्षकार' },
  { key: 'PARTYA_LABEL', label: 'प्रथम पक्षकार का परिचय', group: 'पक्षकार' },
  { key: 'PARTYB', label: 'पक्षकार — द्वितीय', group: 'पक्षकार' },
  { key: 'PARTYB_LABEL', label: 'द्वितीय पक्षकार का परिचय', group: 'पक्षकार' },
  { key: 'CLIENT', label: 'प्रार्थी का नाम', group: 'पक्षकार' },
  { key: 'CLIENTADDR', label: 'प्रार्थी का पता', group: 'पक्षकार' },
  { key: 'ADV', label: 'अधिवक्ता का नाम', group: 'हस्ताक्षर' },
  { key: 'ADVREG', label: 'अधिवक्ता पंजीकरण संख्या', group: 'हस्ताक्षर' },
  { key: 'PLACE', label: 'स्थान', group: 'हस्ताक्षर' },
  { key: 'DATE', label: 'दिनांक', group: 'हस्ताक्षर' },
  { key: 'NEXTDATE', label: 'अगली तिथि', group: 'हस्ताक्षर' },
]

export const CASE_FIELDS: { key: keyof CaseDetails; label: string; hint?: string; group: string }[] = [
  { key: 'customCourt', label: 'अन्य न्यायालय का नाम', hint: 'केवल "अन्य" चुनने पर', group: 'न्यायालय' },
  { key: 'place', label: 'स्थान / जिला', group: 'न्यायालय' },
  { key: 'courtRoom', label: 'न्यायालय कक्ष', group: 'न्यायालय' },
  { key: 'caseNo', label: 'प्रकरण संख्या', group: 'प्रकरण' },
  { key: 'firNo', label: 'एफ.आई.आर. संख्या', group: 'प्रकरण' },
  { key: 'policeStation', label: 'थाना', group: 'प्रकरण' },
  { key: 'sections', label: 'धाराएँ', hint: 'जैसे: 103(1), 115(2) बी.एन.एस.', group: 'प्रकरण' },
  { key: 'partyA', label: 'पक्षकार — प्रथम', group: 'पक्षकार' },
  { key: 'partyALabel', label: 'प्रथम का परिचय', hint: 'अभियुक्त / प्रार्थी / वादी', group: 'पक्षकार' },
  { key: 'partyB', label: 'पक्षकार — द्वितीय', group: 'पक्षकार' },
  { key: 'partyBLabel', label: 'द्वितीय का परिचय', hint: 'अभियोजन / प्रतिवादी', group: 'पक्षकार' },
  { key: 'clientName', label: 'प्रार्थी का नाम', group: 'पक्षकार' },
  { key: 'clientAddress', label: 'प्रार्थी का पता', group: 'पक्षकार' },
  { key: 'clientPhone', label: 'प्रार्थी का दूरभाष', group: 'पक्षकार' },
  { key: 'counselName', label: 'अधिवक्ता का नाम', group: 'अधिवक्ता' },
  { key: 'counselRegNo', label: 'अधिवक्ता पंजीकरण संख्या', group: 'अधिवक्ता' },
  { key: 'counselAddress', label: 'अधिवक्ता का पता', group: 'अधिवक्ता' },
  { key: 'counselPhone', label: 'अधिवक्ता का दूरभाष', group: 'अधिवक्ता' },
  { key: 'today', label: 'दिनांक', group: 'अन्य' },
  { key: 'nextDate', label: 'अगली तिथि', group: 'अन्य' },
]
