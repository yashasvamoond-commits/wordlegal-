import { courtByKey } from '../data/courts'
import { COURT_EN, COURT_SHORT_EN, getLang, tt } from '../i18n'
import type { CaseDetails } from '../types'

/** संक्षिप्त लेबल — UI भाषा के अनुसार */
export function COURT_LABEL(cd: CaseDetails, lang = getLang()): string {
  if (cd.court === 'custom') {
    return cd.customCourt || tt('case.court', lang)
  }
  const c = courtByKey(cd.court)
  const short = lang === 'hi' ? c.short : COURT_SHORT_EN[cd.court] ?? c.en
  return cd.place ? `${short} · ${cd.place}` : short
}

/** संक्षिप्त कोड (JMFC / जे.एम.एफ.सी.) — UI भाषा के अनुसार */
export function courtShort(k: string, lang = getLang()): string {
  if (lang !== 'hi' && COURT_SHORT_EN[k]) return COURT_SHORT_EN[k]
  try {
    return courtByKey(k as never).short
  } catch {
    return COURT_SHORT_EN[k] ?? k
  }
}

/** पूरा नाम — UI भाषा के अनुसार */
export function courtFull(cd: CaseDetails, lang = getLang()): string {
  if (cd.court === 'custom') return cd.customCourt || tt('case.court', lang)
  return lang === 'hi' ? courtByKey(cd.court).hi : COURT_EN[cd.court] ?? courtByKey(cd.court).en
}
