import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, DICT_STATS, RARITIES, searchDict } from '../data/dictionary'
import { loadFavs, loadRecent, saveFavs, saveRecent } from '../lib/storage'
import { toast } from '../lib/toast'
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
    toast(favs.includes(id) ? 'पसंदीदा से हटाया' : 'पसंदीदा में जोड़ा', 'ok', 1400)
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast('कॉपी हो गया', 'ok', 1400)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      toast('कॉपी हो गया', 'ok', 1400)
    }
  }

  const list = showFavs ? favEntries : q.trim() ? results : results

  return (
    <Sheet
      open={open}
      onClose={onClose}
      wide
      tall
      title={sel ? 'शब्द विवरण' : 'विधिक शब्दकोश'}
      subtitle={
        sel
          ? undefined
          : `${DICT_STATS.total} शब्द · ${DICT_STATS.categories} श्रेणियाँ · ${DICT_STATS.latin} लैटिन सूत्र`
      }
      badge={
        sel ? <Btn icon="back" size="sm" label="सूची" onClick={() => setSel(null)} /> : undefined
      }
    >
      {sel ? (
        <div className="dict-detail">
          <div className="term">{sel.hi}</div>
          <div className="eng">{sel.en}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="tag-mini">{sel.cat}</span>
            <span className={`rarity ${sel.rarity}`}>{sel.rarity}</span>
            {sel.latin && <span className="tag-mini">लैटिन सूत्र</span>}
          </div>

          <div className="block">
            <h5>अर्थ</h5>
            <p>{sel.meaning}</p>
          </div>

          {sel.usage && (
            <div className="block">
              <h5>न्यायालयीन प्रयोग</h5>
              <p className="usage">“{sel.usage}”</p>
            </div>
          )}

          {sel.alt && (
            <div className="block">
              <h5>वैकल्पिक रूप</h5>
              <p>{sel.alt}</p>
            </div>
          )}

          <div className="dict-toolbar">
            {onInsert && (
              <Btn variant="primary" icon="plus" label="दस्तावेज़ में जोड़ें" onClick={() => { onInsert(sel.hi); onClose() }} />
            )}
            {sel.usage && onInsert && (
              <Btn variant="ghost" icon="type" label="प्रयोग-वाक्य जोड़ें" onClick={() => { onInsert(sel.usage!); onClose() }} />
            )}
            <Btn variant="ghost" icon="copy" label="कॉपी" onClick={() => copy(`${sel.hi} — ${sel.en}: ${sel.meaning}`)} />
            <Btn
              variant="ghost"
              icon="star"
              label={favs.includes(sel.id) ? 'पसंदीदा में है' : 'पसंदीदा'}
              active={favs.includes(sel.id)}
              onClick={() => toggleFav(sel.id)}
            />
          </div>

          {q && (
            <div style={{ marginTop: 18 }}>
              <div className="section-title"><span>संबंधित शब्द</span><span className="line" /></div>
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
              placeholder="हिन्दी या अंग्रेज़ी में खोजें… (जैसे: ज़मानत / bail)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              inputMode="search"
            />
            {q && <span className="search-clear"><Btn icon="close" size="xs" onClick={() => setQ('')} /></span>}
          </div>

          <div style={{ marginTop: 10 }}>
            <Chips items={['all', ...CATEGORIES]} value={cat} onChange={setCat} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="chipbar no-sb" style={{ flex: 1 }}>
              <button type="button" className={`chip ${rarity === 'all' ? 'on' : ''}`} onClick={() => setRarity('all')}>सभी स्तर</button>
              {RARITIES.map((r) => (
                <button key={r} type="button" className={`chip ${rarity === r ? 'on' : ''}`} onClick={() => setRarity(r)}>{r}</button>
              ))}
            </div>
            <Btn size="xs" variant="ghost" label="लैटिन" active={latinOnly} onClick={() => setLatinOnly((v) => !v)} />
            <Btn size="xs" variant="ghost" icon="star" label="पसंदीदा" active={showFavs} onClick={() => setShowFavs((v) => !v)} />
          </div>

          {showFavs && favEntries.length === 0 && (
            <Empty title="अभी कोई पसंदीदा शब्द नहीं" hint="किसी शब्द पर ★ दबाकर सहेजें" icon="star" />
          )}

          {!showFavs && !q && recentEntries.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="section-title"><span>हाल में देखे गए</span><span className="line" /></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {recentEntries.slice(0, 10).map((e) => (
                  <button key={e.id} type="button" className="chip" onClick={() => pick(e)}>{e.hi}</button>
                ))}
              </div>
            </div>
          )}

          <div className="dict-list">
            {list.length === 0 && !showFavs && (
              <Empty title="कोई शब्द नहीं मिला" hint="वर्तनी बदलकर देखें या अंग्रेज़ी शब्द खोजें" />
            )}
            {list.map((e) => (
              <button key={e.id} type="button" className="dict-row" onClick={() => pick(e)}>
                <div style={{ minWidth: 0 }}>
                  <div className="hi">{e.hi}</div>
                  <div className="en">{e.en}</div>
                  <div className="mean">{e.meaning}</div>
                </div>
                <div className="meta">
                  <span className={`rarity ${e.rarity}`}>{e.rarity}</span>
                  {favs.includes(e.id) && <Icon name="star" size={13} />}
                </div>
              </button>
            ))}
          </div>
          {list.length >= 400 && (
            <div style={{ textAlign: 'center', color: 'var(--muted-2)', fontSize: 11.5, padding: 10 }}>
              केवल पहले 400 परिणाम दिखाए गए हैं — खोज सीमित करें
            </div>
          )}
        </>
      )}
    </Sheet>
  )
}
