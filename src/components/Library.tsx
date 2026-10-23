import { useMemo, useState } from 'react'
import { DICTIONARY, DICT_STATS } from '../data/dictionary'
import { TEMPLATES } from '../data/templates'
import { COURT_LABEL } from '../lib/courtLabel'
import { fmtAgo, wordCount } from '../lib/storage'
import type { DocRecord } from '../types'
import { Icon } from './icons'
import { Btn, Menu } from './ui'

interface Props {
  docs: DocRecord[]
  onOpen: (id: string) => void
  onNew: () => void
  onFromTemplate: (id: string) => void
  onOpenTemplates: () => void
  onOpenDict: () => void
  onOpenLaw: () => void
  onOpenSettings: () => void
  onOpenAbout: () => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onStar: (id: string) => void
}

export function Library(p: Props) {
  const [menu, setMenu] = useState(false)
  const [q, setQ] = useState('')

  const docs = useMemo(() => {
    const list = [...p.docs].sort((a, b) => b.updatedAt - a.updatedAt)
    const n = q.trim().toLowerCase()
    return n ? list.filter((d) => d.title.toLowerCase().includes(n)) : list
  }, [p.docs, q])

  const wotd = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000)
    return DICTIONARY[day % DICTIONARY.length]
  }, [])

  const popular = useMemo(() => TEMPLATES.slice(0, 6), [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">व</div>
          <div>
            <div className="brand-name">वर्डलीगल</div>
            <div className="brand-sub">हिन्दी विधिक मसौदा स्टूडियो</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <Btn icon="search" size="sm" title="शब्दकोश खोजें" onClick={p.onOpenDict} />
        <Btn icon="settings" size="sm" title="सेटिंग्स" onClick={p.onOpenSettings} />
        <div style={{ position: 'relative' }}>
          <Btn icon="morev" size="sm" title="अधिक" onClick={() => setMenu((v) => !v)} />
          {menu && (
            <Menu
              onClose={() => setMenu(false)}
              items={[
                { label: 'विधिक शब्दकोश', icon: 'book', onClick: p.onOpenDict },
                { label: 'धारा मैपिंग — IPC → BNS', icon: 'scales', onClick: p.onOpenLaw },
                { label: 'प्रारूप लाइब्रेरी', icon: 'docs', onClick: p.onOpenTemplates },
                { label: 'ऐप के बारे में', icon: 'info', onClick: p.onOpenAbout },
                null,
                { label: 'नया खाली मसौदा', icon: 'plus', onClick: p.onNew },
              ]}
            />
          )}
        </div>
      </header>

      <div className="library">
        <div className="hero">
          <h1>न्यायालय में जमा करने योग्य हिन्दी मसौदे — लीगल साइज़ पर</h1>
          <p>
            मजिस्ट्रेट प्रथम श्रेणी, अपर मुख्य न्यायिक मजिस्ट्रेट एवं अपर जिला एवं सत्र न्यायाधीश के लिए तैयार
            प्रारूप, पूरा वर्ड-प्रोसेसर, विधिक शब्दकोश तथा पिक्सेल-सटीक PDF निर्यात।
          </p>
          <div className="hero-tags">
            <span className="tag">लीगल 8.5 × 14 इंच</span>
            <span className="tag">{TEMPLATES.length} न्यायालयीन प्रारूप</span>
            <span className="tag">{DICT_STATS.total} विधिक शब्द</span>
            <span className="tag">BNS · BNSS · BSA</span>
            <span className="tag">ऑफ़लाइन</span>
          </div>
          <div className="hero-actions">
            <Btn icon="plus" label="नया मसौदा" variant="primary" onClick={p.onNew} />
            <Btn icon="docs" label="प्रारूप से बनाएँ" variant="ghost" onClick={p.onOpenTemplates} />
            <Btn icon="book" label="शब्दकोश" variant="ghost" onClick={p.onOpenDict} />
          </div>
        </div>

        {p.docs.length > 0 && (
          <div className="search-wrap" style={{ marginBottom: 4 }}>
            <span className="ico"><Icon name="search" size={18} /></span>
            <input
              className="search"
              placeholder="अपने दस्तावेज़ खोजें…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && <span className="search-clear"><Btn icon="close" size="xs" onClick={() => setQ('')} /></span>}
          </div>
        )}

        <div className="section-title">
          <span>आपके दस्तावेज़</span>
          <span className="line" />
          <span style={{ textTransform: 'none', letterSpacing: 0 }}>{p.docs.length}</span>
        </div>

        <div className="doc-grid">
          <button type="button" className="doc-card quick" onClick={p.onNew}>
            <Icon name="plus" size={24} />
            <span style={{ fontWeight: 600 }}>खाली लीगल मसौदा</span>
            <span style={{ fontSize: 11 }}>न्यायालय शीर्षक सहित तैयार</span>
          </button>

          {docs.map((d) => (
            <div key={d.id} className="doc-card" onClick={() => p.onOpen(d.id)} role="button" tabIndex={0}>
              <div className="dc-top">
                <div className="dc-title">{d.title || 'शीर्षकहीन मसौदा'}</div>
                <button
                  type="button"
                  className={`star ${d.starred ? 'on' : ''}`}
                  onClick={(e) => { e.stopPropagation(); p.onStar(d.id) }}
                  aria-label="पसंदीदा"
                >
                  <Icon name="star" size={16} />
                </button>
              </div>
              <div className="dc-sub">
                {COURT_LABEL(d.caseDetails)} · {wordCount(d.html)} शब्द
              </div>
              <div className="dc-meta">
                <span className="dc-badge">{d.page.orientation === 'landscape' ? 'भूमि' : 'खड़ा'}</span>
                <span className="dc-badge">{d.page.size.toUpperCase()}</span>
                <span style={{ marginLeft: 'auto' }}>{fmtAgo(d.updatedAt)}</span>
              </div>
              <div className="del" onClick={(e) => e.stopPropagation()}>
                <Btn icon="copy" size="xs" title="प्रतिलिपि" onClick={() => p.onDuplicate(d.id)} />
                <Btn icon="trash" size="xs" variant="danger" title="हटाएँ" onClick={() => p.onDelete(d.id)} />
              </div>
            </div>
          ))}
        </div>

        <div className="section-title">
          <span>लोकप्रिय प्रारूप</span>
          <span className="line" />
          <button type="button" style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--accent)', fontSize: 12 }} onClick={p.onOpenTemplates}>
            सभी देखें →
          </button>
        </div>
        <div className="tpl-grid">
          {popular.map((t) => (
            <button key={t.id} type="button" className="tpl-card" onClick={() => p.onFromTemplate(t.id)}>
              <div className="t-title">{t.title}</div>
              <div className="t-sub">{t.subtitle}</div>
              <div className="t-foot">
                <span className="t-stat">{t.category}</span>
                <span className="t-stat">{t.statute.split(',')[0]}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="section-title">
          <span>आज का विधिक शब्द</span>
          <span className="line" />
        </div>
        <div className="wotd">
          <h4>{wotd.hi}</h4>
          <div className="en">{wotd.en} · {wotd.cat} · {wotd.rarity}</div>
          <p>{wotd.meaning}</p>
          {wotd.usage && <p style={{ fontStyle: 'italic' }}>प्रयोग: {wotd.usage}</p>}
          <div style={{ marginTop: 10 }}>
            <Btn size="sm" icon="book" label="शब्दकोश खोलें" variant="ghost" onClick={p.onOpenDict} />
          </div>
        </div>

        <div style={{ marginTop: 26, fontSize: 11.5, color: 'var(--muted-2)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--muted)' }}>वर्डलीगल</strong> — सभी दस्तावेज़ आपके डिवाइस पर ही सुरक्षित रहते हैं।
          कोई डेटा सर्वर पर नहीं भेजा जाता। मसौदे न्यायालय में प्रस्तुत करने से पूर्व तथ्यों, धाराओं एवं
          संलग्नकों का मिलान अधिवक्ता द्वारा अवश्य किया जाए।
        </div>
      </div>
    </div>
  )
}
