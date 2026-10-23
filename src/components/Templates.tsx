import { useMemo, useState } from 'react'
import { COURT_LABEL_SHORT } from '../lib/pageHelpers'
import { PHRASES, PHRASE_CATS } from '../data/phrasebook'
import { TEMPLATE_CATEGORIES, searchTemplates, templateById, TEMPLATES } from '../data/templates'
import { htmlToText } from '../lib/storage'
import type { CourtKey, TemplateDef } from '../types'
import { Icon } from './icons'
import { Btn, Chips, Empty, Sheet } from './ui'

const COURTS: { k: 'all' | CourtKey; l: string }[] = [
  { k: 'all', l: 'सभी न्यायालय' },
  { k: 'jmfc', l: 'जे.एम.एफ.सी.' },
  { k: 'acjm', l: 'ए.सी.जे.एम.' },
  { k: 'adsj', l: 'ए.डी.जे.' },
  { k: 'cjm', l: 'सी.जे.एम.' },
  { k: 'dsj', l: 'डी.एस.जे.' },
]

interface Props {
  open: boolean
  onClose: () => void
  onPick: (tpl: TemplateDef, mode: 'new' | 'insert') => void
  allowInsert: boolean
  court?: CourtKey
}

export function TemplateGallery({ open, onClose, onPick, allowInsert, court }: Props) {
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
      title={sel ? sel.title : 'प्रारूप लाइब्रेरी'}
      subtitle={sel ? sel.subtitle : `${TEMPLATES.length} न्यायालयीन प्रारूप — मजिस्ट्रेट एवं सत्र न्यायालय हेतु`}
      badge={sel ? <Btn icon="back" size="sm" label="सूची" onClick={() => setSel(null)} /> : undefined}
    >
      {sel ? (
        <TemplateDetail tpl={sel} allowInsert={allowInsert} onPick={(mode) => { onPick(sel, mode); close() }} />
      ) : (
        <>
          <div className="search-wrap">
            <span className="ico"><Icon name="search" size={18} /></span>
            <input className="search" placeholder="प्रारूप खोजें… (जमानत, स्थगन, अपील, गवाह…)" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <span className="search-clear"><Btn icon="close" size="xs" onClick={() => setQ('')} /></span>}
          </div>

          <div style={{ marginTop: 10 }}>
            <Chips items={TEMPLATE_CATEGORIES as string[]} value={cat} onChange={setCat} />
          </div>
          <div className="chipbar no-sb" style={{ marginTop: 8 }}>
            {COURTS.map((c) => (
              <button key={c.k} type="button" className={`chip ${ct === c.k ? 'on' : ''}`} onClick={() => setCt(c.k)}>{c.l}</button>
            ))}
          </div>

          <div className="tpl-grid" style={{ marginTop: 12 }}>
            {list.map((t) => (
              <button key={t.id} type="button" className="tpl-card" onClick={() => setSel(t)}>
                <div className="t-title">{t.title}</div>
                <div className="t-sub">{t.subtitle}</div>
                <div className="t-foot">
                  <span className="t-stat">{t.category}</span>
                  {t.courts.slice(0, 3).map((c) => (
                    <span key={c} className="t-stat">{COURT_LABEL_SHORT(c)}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
          {list.length === 0 && <Empty title="कोई प्रारूप नहीं मिला" hint="श्रेणी या न्यायालय बदलकर देखें" />}
        </>
      )}
    </Sheet>
  )
}

function TemplateDetail({ tpl, onPick, allowInsert }: { tpl: TemplateDef; onPick: (m: 'new' | 'insert') => void; allowInsert: boolean }) {
  const text = useMemo(() => htmlToText(tpl.body).slice(0, 2200), [tpl])
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className="tag-mini">{tpl.category}</span>
        <span className="tag-mini">{tpl.statute}</span>
        {tpl.courts.map((c) => <span key={c} className="tag-mini">{COURT_LABEL_SHORT(c)}</span>)}
      </div>

      <div className="dict-detail">
        <div className="block">
          <h5>कब प्रयोग करें</h5>
          <p>{tpl.useWhen}</p>
        </div>
        <div className="block">
          <h5>आवश्यक संलग्नक / चेकलिस्ट</h5>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.7 }}>
            {tpl.checklist.map((c, i) => <li key={i}>{c}</li>)}
          </ol>
        </div>
        <div className="block">
          <h5>मसौदा झलक</h5>
          <p style={{ whiteSpace: 'pre-wrap', fontFamily: "'Noto Serif Devanagari', serif", fontSize: 13, lineHeight: 1.7 }}>
            {text}…
          </p>
        </div>
      </div>

      <div className="dict-toolbar" style={{ position: 'sticky', bottom: 0, background: 'var(--panel)', paddingTop: 10 }}>
        <Btn variant="primary" icon="plus" label="नया दस्तावेज़ बनाएँ" onClick={() => onPick('new')} />
        {allowInsert && <Btn variant="ghost" icon="download" label="मौजूदा मसौदे में जोड़ें" onClick={() => onPick('insert')} />}
      </div>
    </div>
  )
}

/* ------------------------------ वाक्यांश ------------------------- */
export function PhraseSheet({ open, onClose, onInsert }: { open: boolean; onClose: () => void; onInsert?: (html: string) => void }) {
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
    <Sheet open={open} onClose={onClose} wide title="न्यायालयीन वाक्यांश" subtitle="एक टैप में मसौदे में जोड़ें">
      <div className="search-wrap">
        <span className="ico"><Icon name="search" size={18} /></span>
        <input className="search" placeholder="वाक्यांश खोजें…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div style={{ marginTop: 10 }}>
        <Chips items={PHRASE_CATS as string[]} value={cat} onChange={setCat} />
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
              <span className="tag-mini">{p.cat}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}><Icon name="plus" size={16} /></span>
            </div>
            <div className="ctx">{htmlToText(p.body).slice(0, 150)}</div>
          </button>
        ))}
        {list.length === 0 && <Empty title="कोई वाक्यांश नहीं मिला" />}
      </div>
    </Sheet>
  )
}
