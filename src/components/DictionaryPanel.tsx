import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, DICT_STATS, RARITIES, searchDict } from '../data/dictionary'
import { loadFavs, loadRecent, saveFavs, saveRecent } from '../lib/storage'
import { toast } from '../lib/toast'
import { useT } from '../lib/useT'
import type { DictEntry } from '../types'
import { Icon } from './icons'
import { Btn, Chips, Empty, Sheet } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  onInsert?: (text: string) => void
  initialQuery?: string
}

export function DictionaryPanel({ open, onClose, onInsert, initialQuery = '' }: Props) {
  const { t, c, rarity: rv } = useT()
  const [q, setQ] = useState(initialQuery)
  const [cat, setCat] = useState('all')
  const [rarity, setRarity] = useState('all')
  const [latinOnly, setLatinOnly] = useState(false)
  const [sel, setSel] = useState<DictEntry | null>(null)
  const [favs, setFavs] = useState<string[]>(() => loadFavs())
  const [recent, setRecent] = useState<string[]>(() => loadRecent())
  const [showFavs, setShowFavs] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQ(initialQuery)
      setSel(null)
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [open, initialQuery])

  const results = useMemo(
    () => searchDict({ q, cat, rarity, latinOnly }),
    [q, cat, rarity, latinOnly],
  )

  const favEntries = useMemo(() => {
    const set = new Set(favs)
    return searchDict({ q: '' }).filter((e) => set.has(e.id)).slice(0, 60)
  }, [favs])

  const recentEntries = useMemo(() => {
    const map = new Map(searchDict({ q: '' }).map((e) => [e.id, e]))
    return recent.map((id) => map.get(id)).filter(Boolean) as DictEntry[]
  }, [recent])

  const pick = (e: DictEntry) => {
    setSel(e)
    const next = [e.id, ...recent.filter((x) => x !== e.id)].slice(0, 30)
    setRecent(next)
    saveRecent(next)
  }

  const toggleFav = (id: string) => {
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs]
    setFavs(next)
    saveFavs(next)
    toast(t(favs.includes(id) ? 'dict.removedFav' : 'dict.addedFav'), 'ok', 1400)
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast(t('dict.copied'), 'ok', 1400)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      toast(t('dict.copied'), 'ok', 1400)
    }
  }

  const list = showFavs ? favEntries : q.trim() ? results : results

  return (
    <Sheet
      open={open}
      onClose={onClose}
      wide
      tall
      title={sel ? t('dict.wordDetails') : t('dict.title')}
      subtitle={
        sel
          ? undefined
          : t('dict.subtitle', { n: DICT_STATS.total, c: DICT_STATS.categories, l: DICT_STATS.latin })
      }
      badge={
        sel ? <Btn icon="back" size="sm" label={t('c.list')} onClick={() => setSel(null)} /> : undefined
      }
    >
      {sel ? (
        <div className="dict-detail">
          <div className="term">{sel.hi}</div>
          <div className="eng">{sel.en}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="tag-mini">{c(sel.cat)}</span>
            <span className={`rarity ${sel.rarity}`}>{rv(sel.rarity)}</span>
            {sel.latin && <span className="tag-mini">{t('dict.latinOnly')}</span>}
          </div>

          <div className="block">
            <h5>{t('dict.meaning')}</h5>
            <p>{sel.meaning}</p>
          </div>

          {sel.usage && (
            <div className="block">
              <h5>{t('dict.courtUsage')}</h5>
              <p className="usage">“{sel.usage}”</p>
            </div>
          )}

          {sel.alt && (
            <div className="block">
              <h5>{t('dict.altForms')}</h5>
              <p>{sel.alt}</p>
            </div>
          )}

          <div className="dict-toolbar">
            {onInsert && (
              <Btn variant="primary" icon="plus" label={t('dict.insert')}  onClick={() => { onInsert(sel.hi); onClose() }} />
            )}
            {sel.usage && onInsert && (
              <Btn variant="ghost" icon="type" label={t('dict.insertUsage')}  onClick={() => { onInsert(sel.usage!); onClose() }} />
            )}
            <Btn variant="ghost" icon="copy" label={t('c.copy')}  onClick={() => copy(`${sel.hi} — ${sel.en}: ${sel.meaning}`)} />
            <Btn
              variant="ghost"
              icon="star"
              label={t(favs.includes(sel.id) ? 'c.inFavourites' : 'c.favourite')}
              active={favs.includes(sel.id)}
              onClick={() => toggleFav(sel.id)}
            />
          </div>

          {q && (
            <div style={{ marginTop: 18 }}>
              <div className="section-title"><span>{t('dict.related')}</span><span className="line" /></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {searchDict({ q: sel.cat, cat: 'all' })
                  .filter((e) => e.id !== sel.id)
                  .slice(0, 12)
                  .map((e) => (
                    <button key={e.id} type="button" className="chip" onClick={() => pick(e)}>{e.hi}</button>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="search-wrap">
            <span className="ico"><Icon name="search" size={18} /></span>
            <input
              ref={inputRef}
              className="search"
              placeholder={t('dict.search')}
              aria-label={t('dict.search')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              inputMode="search"
            />
            {q && <span className="search-clear"><Btn icon="close" size="xs" onClick={() => setQ('')} /></span>}
          </div>

          <div style={{ marginTop: 10 }}>
            <Chips
              items={['all', ...CATEGORIES]}
              value={cat}
              onChange={setCat}
              labels={{ all: t('dict.allCategories') }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="chipbar no-sb" style={{ flex: 1 }}>
              <button type="button" className={`chip ${rarity === 'all' ? 'on' : ''}`} onClick={() => setRarity('all')}>{t('dict.allLevels')}</button>
              {RARITIES.map((r) => (
                <button key={r} type="button" className={`chip ${rarity === r ? 'on' : ''}`} onClick={() => setRarity(r)}>{rv(r)}</button>
              ))}
            </div>
            <Btn size="xs" variant="ghost" label={t('dict.latin')}  active={latinOnly} onClick={() => setLatinOnly((v) => !v)} />
            <Btn size="xs" variant="ghost" icon="star" label={t('dict.favourites')} active={showFavs} onClick={() => setShowFavs((v) => !v)} />
          </div>

          {showFavs && favEntries.length === 0 && (
            <Empty title={t('dict.noFavs')} hint={t('dict.noFavsHint')} icon="star" />
          )}

          {!showFavs && !q && recentEntries.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="section-title"><span>{t('dict.recent')}</span><span className="line" /></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {recentEntries.slice(0, 10).map((e) => (
                  <button key={e.id} type="button" className="chip" onClick={() => pick(e)}>{e.hi}</button>
                ))}
              </div>
            </div>
          )}

          <div className="dict-list">
            {list.length === 0 && !showFavs && (
              <Empty title={t('dict.noResults')} hint={t('dict.noResultsHint')} />
            )}
            {list.map((e) => (
              <button key={e.id} type="button" className="dict-row" onClick={() => pick(e)}>
                <div style={{ minWidth: 0 }}>
                  <div className="hi">{e.hi}</div>
                  <div className="en">{e.en}</div>
                  <div className="mean">{e.meaning}</div>
                </div>
                <div className="meta">
                  <span className={`rarity ${e.rarity}`}>{rv(e.rarity)}</span>
                  {favs.includes(e.id) && <Icon name="star" size={13} />}
                </div>
              </button>
            ))}
          </div>
          {list.length >= 400 && (
            <div style={{ textAlign: 'center', color: 'var(--muted-2)', fontSize: 11.5, padding: 10 }}>
              {t('dict.limit')}
            </div>
          )}
        </>
      )}
    </Sheet>
  )
}
