import { useMemo, useState } from 'react'
import { courtShort } from '../lib/courtLabel'
import { useT } from '../lib/useT'
import { PHRASES, PHRASE_CATS } from '../data/phrasebook'
import { TEMPLATE_CATEGORIES, searchTemplates, templateById, TEMPLATES } from '../data/templates'
import { htmlToText } from '../lib/storage'
import type { CourtKey, TemplateDef } from '../types'
import { Icon } from './icons'
import { Btn, Chips, Empty, Sheet } from './ui'

const COURTS: ('all' | CourtKey)[] = ['all', 'jmfc', 'acjm', 'adsj', 'cjm', 'dsj']

/** हिन्दी श्रेणी-नाम → UI नाम */
const CAT_LABELS = (c: (s: string) => string) =>
  Object.fromEntries([...TEMPLATE_CATEGORIES, ...PHRASE_CATS].map((k) => [k, c(k)]))

interface Props {
  open: boolean
  onClose: () => void
  onPick: (tpl: TemplateDef, mode: 'new' | 'insert') => void
  allowInsert: boolean
  court?: CourtKey
}

export function TemplateGallery({ open, onClose, onPick, allowInsert, court }: Props) {
  const { t, c, lang } = useT()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('सभी')
  const [ct, setCt] = useState<'all' | CourtKey>(court ?? 'all')
  const [sel, setSel] = useState<TemplateDef | null>(null)

  const list = useMemo(() => {
    let out = searchTemplates(q, cat)
    if (ct !== 'all') out = out.filter((t) => t.courts.includes(ct))
    return out.sort((a, b) => a.title.localeCompare(b.title, 'hi'))
  }, [q, cat, ct])

  const close = () => { setSel(null); setQ(''); onClose() }

  return (
    <Sheet
      open={open}
      onClose={close}
      wide
      tall
      title={sel ? sel.title : t('tpl.title')}
      subtitle={sel ? sel.subtitle : t('tpl.subtitle', { n: TEMPLATES.length })}
      badge={sel ? <Btn icon="back" size="sm" label={t('c.list')} onClick={() => setSel(null)} /> : undefined}
    >
      {sel ? (
        <TemplateDetail tpl={sel} allowInsert={allowInsert} onPick={(mode) => { onPick(sel, mode); close() }} />
      ) : (
        <>
          <div className="search-wrap">
            <span className="ico"><Icon name="search" size={18} /></span>
            <input className="search" placeholder={t('tpl.search')} aria-label={t('tpl.search')} value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <span className="search-clear"><Btn icon="close" size="xs" onClick={() => setQ('')} /></span>}
          </div>

          <div style={{ marginTop: 10 }}>
            <Chips items={TEMPLATE_CATEGORIES as string[]} value={cat} onChange={setCat} labels={CAT_LABELS(c)} />
          </div>
          <div className="chipbar no-sb" style={{ marginTop: 8 }}>
            {COURTS.map((k) => (
              <button key={k} type="button" className={`chip ${ct === k ? 'on' : ''}`} onClick={() => setCt(k)}>
                {k === 'all' ? t('tpl.allCourts') : courtShort(k, lang)}
              </button>
            ))}
          </div>

          <div className="tpl-grid" style={{ marginTop: 12 }}>
            {list.map((tpl) => (
              <button key={tpl.id} type="button" className="tpl-card" onClick={() => setSel(tpl)}>
                <div className="t-title">{tpl.title}</div>
                <div className="t-sub">{tpl.subtitle}</div>
                <div className="t-foot">
                  <span className="t-stat">{c(tpl.category)}</span>
                  {tpl.courts.slice(0, 3).map((k) => (
                    <span key={k} className="t-stat">{courtShort(k, lang)}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
          {list.length === 0 && <Empty title={t('tpl.empty')} hint={t('tpl.emptyHint')} />}
        </>
      )}
    </Sheet>
  )
}

function TemplateDetail({ tpl, onPick, allowInsert }: { tpl: TemplateDef; onPick: (m: 'new' | 'insert') => void; allowInsert: boolean }) {
  const { t, c, lang } = useT()
  const text = useMemo(() => htmlToText(tpl.body).slice(0, 2200), [tpl])
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className="tag-mini">{c(tpl.category)}</span>
        <span className="tag-mini">{tpl.statute}</span>
        {tpl.courts.map((k) => <span key={k} className="tag-mini">{courtShort(k, lang)}</span>)}
      </div>

      <div className="dict-detail">
        <div className="block">
          <h5>{t('tpl.whenToUse')}</h5>
          <p>{tpl.useWhen}</p>
        </div>
        <div className="block">
          <h5>{t('tpl.checklist')}</h5>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.7 }}>
            {tpl.checklist.map((c, i) => <li key={i}>{c}</li>)}
          </ol>
        </div>
        <div className="block">
          <h5>{t('tpl.preview')}</h5>
          <p style={{ whiteSpace: 'pre-wrap', fontFamily: "'Noto Serif Devanagari', serif", fontSize: 13, lineHeight: 1.7 }}>
            {text}…
          </p>
        </div>
      </div>

      <div className="dict-toolbar" style={{ position: 'sticky', bottom: 0, background: 'var(--panel)', paddingTop: 10 }}>
        <Btn variant="primary" icon="plus" label={t('tpl.newDoc')}  onClick={() => onPick('new')} />
        {allowInsert && <Btn variant="ghost" icon="download" label={t('tpl.insert')}  onClick={() => onPick('insert')} />}
      </div>
    </div>
  )
}

/* ------------------------------ वाक्यांश ------------------------- */
export function PhraseSheet({ open, onClose, onInsert }: { open: boolean; onClose: () => void; onInsert?: (html: string) => void }) {
  const { t, c } = useT()
  const [cat, setCat] = useState('सभी')
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const n = q.trim().toLowerCase()
    return PHRASES.filter(
      (p) =>
        (cat === 'सभी' || p.cat === cat) &&
        (!n || `${p.title} ${p.cat} ${p.body}`.toLowerCase().includes(n)),
    )
  }, [cat, q])

  return (
    <Sheet open={open} onClose={onClose} wide title={t('tpl.phrasesTitle')} subtitle={t('tpl.phrasesSub')}>
      <div className="search-wrap">
        <span className="ico"><Icon name="search" size={18} /></span>
        <input className="search" placeholder={t('tpl.phrasesSearch')} aria-label={t('tpl.phrasesSearch')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div style={{ marginTop: 10 }}>
        <Chips items={PHRASE_CATS as string[]} value={cat} onChange={setCat} labels={CAT_LABELS(c)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            className="check-item"
            style={{ textAlign: 'left' }}
            onClick={() => { onInsert?.(p.body); onClose() }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <strong style={{ fontSize: 13.5 }}>{p.title}</strong>
              <span className="tag-mini">{c(p.cat)}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}><Icon name="plus" size={16} /></span>
            </div>
            <div className="ctx">{htmlToText(p.body).slice(0, 150)}</div>
          </button>
        ))}
        {list.length === 0 && <Empty title={t('tpl.phrasesEmpty')} />}
      </div>
    </Sheet>
  )
}
