import { useCallback, useSyncExternalStore } from 'react'
import { catName, getLang, setLang, subscribeLang, tt, type Lang, type StrKey } from '../i18n'

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, getLang)
}

/** अनुवाद हुक — t('key', {n: 3}) एवं श्रेणी-नाम c('विचारण') */
export function useT() {
  const lang = useLang()
  const t = useCallback(
    (key: StrKey, vars?: Record<string, string | number>) => tt(key, lang, vars),
    [lang],
  )
  const c = useCallback((hiCat: string) => catName(hiCat, lang), [lang])
  const rarity = useCallback(
    (r: string) =>
      tt(
        r === 'सामान्य' ? 'dict.rarity.common' : r === 'विशिष्ट' ? 'dict.rarity.special' : 'dict.rarity.rare',
        lang,
      ),
    [lang],
  )
  return { t, c, rarity, lang, setLang }
}
