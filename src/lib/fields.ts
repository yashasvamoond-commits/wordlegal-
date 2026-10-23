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

/** सभी उपलब्ध फ़ील्ड → मान */
export function fieldValues(cd: CaseDetails, page?: PageSettings): Record<string, string> {
  const court = cd.court === 'custom'
    ? or(cd.customCourt, '[न्यायालय का नाम]')
    : esc(courtHeading(cd, true))
  return {
    COURT_HEAD: court,
    COURT_EN: esc(cd.court === 'custom' ? cd.customCourt : courtHeading(cd, false)),
    CASE: or(cd.caseNo, '[प्रकरण संख्या]'),
    FIR: or(cd.firNo, '[एफ.आई.आर. संख्या]'),
    PS: or(cd.policeStation, '[थाना]'),
    SECTIONS: or(cd.sections, '[धाराएँ]'),
    PARTYA: or(cd.partyA, '[पक्षकार — प्रथम]'),
    PARTYA_LABEL: or(cd.partyALabel, 'अभियुक्त'),
    PARTYB: or(cd.partyB, 'राज्य'),
    PARTYB_LABEL: or(cd.partyBLabel, 'अभियोजन'),
    CLIENT: or(cd.clientName, '[प्रार्थी का नाम]'),
    CLIENTADDR: or(cd.clientAddress, '[प्रार्थी का पता]'),
    ADDR: or(cd.clientAddress, '[पता]'),
    PHONE: or(cd.clientPhone, ''),
    ADV: or(cd.counselName, '[प्रार्थी अधिवक्ता]'),
    ADVREG: or(cd.counselRegNo, '[पंजीकरण संख्या]'),
    ADVADDR: or(cd.counselAddress, '[अधिवक्ता का पता]'),
    DATE: or(cd.today, todayHi()),
    PLACE: or(cd.place, '[स्थान]'),
    ROOM: or(cd.courtRoom, '[न्यायालय कक्ष]'),
    NEXTDATE: or(cd.nextDate, '[अगली तिथि]'),
    WATERMARK: page?.watermarkText ? esc(page.watermarkText) : '',
  }
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
  { key: 'court', label: 'न्यायालय', group: 'न्यायालय' },
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
