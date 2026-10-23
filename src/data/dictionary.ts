import type { DictEntry } from '../types'
import { DICT_CORE } from './dictCore'
import { DICT_MORE } from './dictMore'
import { DICT_EXTRA } from './dictExtra'

/** एक ही हिन्दी शब्द की पुनरावृत्ति हटाएँ (पहली प्रविष्टि प्राथमिक) */
function dedupe(list: DictEntry[]): DictEntry[] {
  const seen = new Set<string>()
  const out: DictEntry[] = []
  for (const e of list) {
    const k = e.hi.trim()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(e)
  }
  return out
}

export const DICTIONARY: DictEntry[] = dedupe([...DICT_CORE, ...DICT_MORE, ...DICT_EXTRA])

/** Devanagari-friendly normaliser: strips nukta, zero-width joiners, case. */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\u093C\u200B-\u200D\uFEFF]/g, '')
    .replace(/[।.,;:!?"'“”‘’()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const DICT_INDEX = new Map<string, DictEntry>(DICTIONARY.map((e) => [e.id, e]))

const SEARCHABLE = DICTIONARY.map((e) => ({
  e,
  hi: norm(e.hi),
  en: norm(e.en),
  all: norm(`${e.hi} ${e.en} ${e.alt ?? ''} ${e.cat} ${e.meaning} ${e.usage ?? ''}`),
}))

export const CATEGORIES = Array.from(new Set(DICTIONARY.map((e) => e.cat))).sort((a, b) =>
  a.localeCompare(b, 'hi'),
)

export const RARITIES: DictEntry['rarity'][] = ['सामान्य', 'विशिष्ट', 'दुर्लभ']

function score(e: (typeof SEARCHABLE)[number], q: string): number {
  const n = norm(q)
  if (!n) return 1
  const tokens = n.split(' ').filter(Boolean)
  if (!tokens.every((t) => e.all.includes(t))) return 0
  let s = 2
  if (e.hi === n || e.en === n) s = 100
  else if (e.hi.startsWith(n) || e.en.startsWith(n)) s = 60
  else if (e.hi.includes(n) || e.en.includes(n)) s = 40
  else if (tokens.every((t) => e.hi.includes(t) || e.en.includes(t))) s = 25
  if (e.e.rarity === 'सामान्य') s += 3
  return s
}

export interface DictFilter {
  q?: string
  cat?: string
  rarity?: string
  latinOnly?: boolean
}

export function searchDict({ q = '', cat = 'all', rarity = 'all', latinOnly }: DictFilter): DictEntry[] {
  const scored: { e: DictEntry; s: number }[] = []
  for (const item of SEARCHABLE) {
    if (cat !== 'all' && item.e.cat !== cat) continue
    if (rarity !== 'all' && item.e.rarity !== rarity) continue
    if (latinOnly && !item.e.latin) continue
    const s = score(item, q)
    if (s > 0) scored.push({ e: item.e, s })
  }
  scored.sort((a, b) => b.s - a.s || a.e.hi.localeCompare(b.e.hi, 'hi'))
  return scored.slice(0, 400).map((x) => x.e)
}

/** Fast prefix suggestions for the in-editor dictionary popover. */
export function suggestDict(prefix: string, limit = 6): DictEntry[] {
  const n = norm(prefix)
  if (n.length < 1) return []
  const out: DictEntry[] = []
  for (const item of SEARCHABLE) {
    if (item.hi.startsWith(n) || item.en.startsWith(n)) out.push(item.e)
    if (out.length >= limit) break
  }
  if (out.length < limit) {
    for (const item of SEARCHABLE) {
      if (!out.includes(item.e) && (item.hi.includes(n) || item.en.includes(n))) out.push(item.e)
      if (out.length >= limit) break
    }
  }
  return out
}

/** Find the dictionary entry matching a selected word (used by the "अर्थ" action). */
export function lookupWord(word: string): DictEntry | undefined {
  const n = norm(word)
  if (!n) return undefined
  return (
    SEARCHABLE.find((s) => s.hi === n)?.e ??
    SEARCHABLE.find((s) => s.en === n)?.e ??
    SEARCHABLE.find((s) => s.hi.includes(n) || s.en.includes(n))?.e
  )
}

export const DICT_STATS = {
  total: DICTIONARY.length,
  categories: CATEGORIES.length,
  rare: DICTIONARY.filter((d) => d.rarity === 'दुर्लभ').length,
  latin: DICTIONARY.filter((d) => d.latin).length,
}
