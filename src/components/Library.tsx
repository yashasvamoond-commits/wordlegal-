import { useMemo, useState } from 'react'
import { DICTIONARY, DICT_STATS } from '../data/dictionary'
import { TEMPLATES } from '../data/templates'
import { COURT_LABEL } from '../lib/courtLabel'
import { fmtAgo, wordCount } from '../lib/storage'
import type { DocRecord } from '../types'
import { Icon } from './icons'
import { Btn, Menu } from './ui'
import { useT } from '../lib/useT'

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
  onToggleLang: () => void
}

export function Library(p: Props) {
  const { t, c, rarity, lang } = useT()
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
            <div className="brand-name">{t('app.name')}</div>
            <div className="brand-sub">{t('app.tagline')}</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <Btn
          size="sm"
          title={lang === 'en' ? t('tb.switchToHindi') : t('tb.switchToEnglish')}
          onClick={p.onToggleLang}
          className="lang-btn"
        >
          <span style={{ fontWeight: 700, letterSpacing: '.4px', fontSize: 12.5 }}>{lang === 'en' ? 'EN' : 'हि'}</span>
        </Btn>
        <Btn icon="search" size="sm" title={t('tb.dictionary')} onClick={p.onOpenDict} />
        <Btn icon="settings" size="sm" title={t('tb.settings')} onClick={p.onOpenSettings} />
        <div style={{ position: 'relative' }}>
          <Btn icon="morev" size="sm" title={t('c.more')} onClick={() => setMenu((v) => !v)} />
          {menu && (
            <Menu
              onClose={() => setMenu(false)}
              items={[
                { label: t('menu.dictionary'), icon: 'book', onClick: p.onOpenDict },
                { label: t('menu.law'), icon: 'scales', onClick: p.onOpenLaw },
                { label: t('tpl.title'), icon: 'docs', onClick: p.onOpenTemplates },
                { label: t('menu.about'), icon: 'info', onClick: p.onOpenAbout },
                null,
                { label: t('menu.newBlank'), icon: 'plus', onClick: p.onNew },
              ]}
            />
          )}
        </div>
      </header>

      <div className="library">
        <div className="hero">
          <h1>{t('lib.hero.title')}</h1>
          <p>{t('lib.hero.sub')}</p>
          <div className="hero-tags">
            <span className="tag">{t('lib.tag.legal')}</span>
            <span className="tag">{t('lib.tag.templates', { n: TEMPLATES.length })}</span>
            <span className="tag">{t('lib.tag.dict', { n: DICT_STATS.total })}</span>
            <span className="tag">{t('lib.tag.laws')}</span>
            <span className="tag">{t('lib.tag.offline')}</span>
          </div>
          <div className="hero-actions">
            <Btn icon="plus" label={t('lib.newDraft')} variant="primary" onClick={p.onNew} />
            <Btn icon="docs" label={t('lib.fromTemplate')} variant="ghost" onClick={p.onOpenTemplates} />
            <Btn icon="book" label={t('lib.dictionary')} variant="ghost" onClick={p.onOpenDict} />
          </div>
        </div>

        {p.docs.length > 0 && (
          <div className="search-wrap" style={{ marginBottom: 4 }}>
            <span className="ico"><Icon name="search" size={18} /></span>
            <input
              className="search"
              placeholder={t('lib.searchDocs')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t('lib.searchDocs')}
            />
            {q && <span className="search-clear"><Btn icon="close" size="xs" onClick={() => setQ('')} /></span>}
          </div>
        )}

        <div className="section-title">
          <span>{t('lib.section.docs')}</span>
          <span className="line" />
          <span style={{ textTransform: 'none', letterSpacing: 0 }}>{p.docs.length}</span>
        </div>

        <div className="doc-grid">
          <button type="button" className="doc-card quick" onClick={p.onNew}>
            <Icon name="plus" size={24} />
            <span style={{ fontWeight: 600 }}>{t('lib.blankCard')}</span>
            <span style={{ fontSize: 11 }}>{t('lib.blankCardHint')}</span>
          </button>

          {docs.map((d) => (
            <div key={d.id} className="doc-card" onClick={() => p.onOpen(d.id)} role="button" tabIndex={0}>
              <div className="dc-top">
                <div className="dc-title">{d.title || t('lib.untitled')}</div>
                <button
                  type="button"
                  className={`star ${d.starred ? 'on' : ''}`}
                  onClick={(e) => { e.stopPropagation(); p.onStar(d.id) }}
                  aria-label={t('lib.favourite')}
                >
                  <Icon name="star" size={16} />
                </button>
              </div>
              <div className="dc-sub">
                {COURT_LABEL(d.caseDetails, lang)} · {wordCount(d.html)} {t('c.words')}
              </div>
              <div className="dc-meta">
                <span className="dc-badge">{d.page.orientation === 'landscape' ? t('rib.landscape') : t('rib.portrait')}</span>
                <span className="dc-badge">{d.page.size.toUpperCase()}</span>
                <span style={{ marginLeft: 'auto' }}>{fmtAgo(d.updatedAt)}</span>
              </div>
              <div className="del" onClick={(e) => e.stopPropagation()}>
                <Btn icon="copy" size="xs" title={t('c.duplicate')} onClick={() => p.onDuplicate(d.id)} />
                <Btn icon="trash" size="xs" variant="danger" title={t('c.delete')} onClick={() => p.onDelete(d.id)} />
              </div>
            </div>
          ))}
        </div>

        <div className="section-title">
          <span>{t('lib.section.popular')}</span>
          <span className="line" />
          <button type="button" style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--accent)', fontSize: 12 }} onClick={p.onOpenTemplates}>
            {t('lib.viewAll')}
          </button>
        </div>
        <div className="tpl-grid">
          {popular.map((tpl) => (
            <button key={tpl.id} type="button" className="tpl-card" onClick={() => p.onFromTemplate(tpl.id)}>
              <div className="t-title">{tpl.title}</div>
              <div className="t-sub">{tpl.subtitle}</div>
              <div className="t-foot">
                <span className="t-stat">{c(tpl.category)}</span>
                <span className="t-stat">{tpl.statute.split(',')[0]}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="section-title">
          <span>{t('lib.section.wotd')}</span>
          <span className="line" />
        </div>
        <div className="wotd">
          <h4>{wotd.hi}</h4>
          <div className="en">
            {wotd.en} · {c(wotd.cat)} · {rarity(wotd.rarity)}
          </div>
          <p>{wotd.meaning}</p>
          {wotd.usage && <p style={{ fontStyle: 'italic' }}>{t('lib.usage')}: {wotd.usage}</p>}
          <div style={{ marginTop: 10 }}>
            <Btn size="sm" icon="book" label={t('lib.openDictionary')} variant="ghost" onClick={p.onOpenDict} />
          </div>
        </div>

        <div style={{ marginTop: 26, fontSize: 11.5, color: 'var(--muted-2)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--muted)' }}>{t('app.name')}</strong> — {t('lib.privacy')}
        </div>
      </div>
    </div>
  )
}
