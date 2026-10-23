import { useRef, useState, type ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
import { COURTS, PAGE_SIZES, courtByKey, courtHeading } from '../data/courts'
import { COURT_EN } from '../i18n'
import { useT } from '../lib/useT'
import type { CaseDetails, PageSettings, SheetKey, CourtKey, PageSize } from '../types'
import type { Settings } from '../lib/storage'
import { Icon, type IconName } from './icons'
import { Btn, ColorGrid, Field, Sheet, TEXT_COLORS, HIGHLIGHT_COLORS } from './ui'
import { toast } from '../lib/toast'
import { fieldValues } from '../lib/fields'

export const FONTS = [
  { label: 'Noto Serif Devanagari', hi: 'नोटो सेरिफ़ देवनागरी', v: "'Noto Serif Devanagari', serif" },
  { label: 'Noto Sans Devanagari', hi: 'नोटो संस देवनागरी', v: "'Noto Sans Devanagari', sans-serif" },
  { label: 'Mangal', hi: 'मंगल', v: "'Mangal', 'Noto Sans Devanagari', sans-serif" },
  { label: 'Nirmala UI', hi: 'निर्मला यूआई', v: "'Nirmala UI', 'Noto Sans Devanagari', sans-serif" },
  { label: 'Times New Roman', hi: 'टाइम्स न्यू रोमन', v: "'Times New Roman', 'Noto Serif Devanagari', serif" },
  { label: 'Arial', hi: 'एरियल', v: "Arial, 'Noto Sans Devanagari', sans-serif" },
  { label: 'Courier New', hi: 'कूरियर', v: "'Courier New', 'Noto Sans Devanagari', monospace" },
]

const SIZES = ['8', '9', '10', '10.5', '11', '12', '13', '14', '16', '18', '20', '22', '24', '28', '32', '36', '48']

const G = ({ label, children }: { label?: string; children: ReactNode }) => (
  <div className="rgroup">
    <div className="rgroup-inner">
      <div className="rgroup-row">{children}</div>
      {label && <div className="rlabel">{label}</div>}
    </div>
  </div>
)

const T = ({ icon, title, on, onClick, disabled, label }: {
  icon: IconName; title: string; on?: boolean; onClick: () => void; disabled?: boolean; label?: string
}) => <Btn icon={icon} label={label} size="sm" active={on} title={title} onClick={onClick} disabled={disabled} />

interface Props {
  ed: Editor | null
  tab: string
  setTab: (t: string) => void
  page: PageSettings
  onPage: (p: Partial<PageSettings>) => void
  cd: CaseDetails
  onCase: (c: Partial<CaseDetails>) => void
  settings: Settings
  onSettings: (s: Partial<Settings>) => void
  onSheet: (s: SheetKey) => void
  onFillFields: () => void
  onTemplates: () => void
  onPhrases: () => void
  zoom: number
  setZoom: (z: number) => void
  fitZoom: () => void
  words: number
  chars: number
}

export function Ribbon(p: Props) {
  const { ed } = p
  const { t, lang } = useT()
  const [pop, setPop] = useState<null | 'color' | 'highlight' | 'table' | 'field' | 'link'>(null)
  const [link, setLink] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const run = (fn: (c: any) => any) => {
    if (!ed) return
    fn(ed.chain().focus()).run()
  }

  const insertHtml = (html: string) => {
    if (!ed) return
    ed.chain().focus().insertContent(html).run()
  }

  const vals = fieldValues(p.cd, p.page)

  const fontFamily = (ed?.getAttributes('textStyle').fontFamily as string) || ''
  const fontSize = ((ed?.getAttributes('textStyle').fontSize as string) || '').replace('pt', '')
  const lh = (ed?.getAttributes('paragraph').lineHeight as string) || ''
  const blockCls = (ed?.getAttributes('paragraph').blockClass as string) || 'doc-body'

  const LINE_HEIGHTS = [
    { label: t('rib.jh1'), v: '1' },
    { label: '1.15', v: '1.15' },
    { label: '1.5', v: '1.5' },
    { label: t('rib.jh2'), v: '2' },
    { label: '2.5', v: '2.5' },
    { label: '3', v: '3' },
  ]

  const BLOCK_STYLES = [
    { key: 'legalBody', cls: 'doc-body' },
    { key: 'courtHeading', cls: 'doc-court' },
    { key: 'caseNumber', cls: 'doc-caseno' },
    { key: 'parties', cls: 'doc-party' },
    { key: 'subject', cls: 'doc-subject' },
    { key: 'prayer', cls: 'doc-prayer' },
    { key: 'signature', cls: 'doc-sign' },
    { key: 'verification', cls: 'doc-verify' },
    { key: 'note', cls: 'doc-note' },
    { key: 'quote', cls: 'doc-quote' },
  ] as const

  const insertImage = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result)
      const img = new Image()
      img.onload = () => {
        const max = 1100
        const scale = Math.min(1, max / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const out = canvas.toDataURL('image/jpeg', 0.86)
        run((c) => c.setImage({ src: out }))
        toast(t('rib.imageAdded'), 'ok')
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  const courtTitle = (key: CourtKey) =>
    lang === 'hi' ? COURTS.find((c) => c.key === key)?.hi ?? key : COURT_EN[key] ?? key

  /* ------------------------------- HOME --------------------------- */
  const home = (
    <>
      <G label={t('rib.style')}>
        <div className="rgroup-col">
          <select
            className="sel"
            value={ed?.isActive('heading', { level: 1 }) ? 'h1' : ed?.isActive('heading', { level: 2 }) ? 'h2' : ed?.isActive('heading', { level: 3 }) ? 'h3' : 'p'}
            onChange={(e) => {
              const v = e.target.value
              run((c) => (v === 'p' ? c.setParagraph() : c.toggleHeading({ level: Number(v.slice(1)) })))
            }}
            title={t('rib.paragraphStyle')}
          >
            <option value="p">{t('rib.normal')}</option>
            <option value="h1">{t('rib.heading1')}</option>
            <option value="h2">{t('rib.heading2')}</option>
            <option value="h3">{t('rib.heading3')}</option>
          </select>
          <select
            className="sel"
            value={blockCls}
            onChange={(e) => run((c) => c.setBlockStyle(e.target.value))}
            title={t('rib.legalBlockStyle')}
          >
            {BLOCK_STYLES.map((s) => (
              <option key={s.cls} value={s.cls}>{t(`rib.blockStyle.${s.key}` as never)}</option>
            ))}
          </select>
        </div>
      </G>

      <G label={t('rib.font')}>
        <div className="rgroup-col">
          <select
            className="sel"
            style={{ maxWidth: 200 }}
            value={fontFamily || p.settings.docFont}
            onChange={(e) => run((c) => c.setFontFamily(e.target.value))}
            title={t('rib.font')}
          >
            {FONTS.map((f) => (
              <option key={f.v} value={f.v}>{lang === 'hi' ? f.hi : f.label}</option>
            ))}
          </select>
          <div className="rgroup-row">
            <select
              className="sel narrow"
              value={fontSize || p.settings.docSize.replace('pt', '')}
              onChange={(e) => run((c) => c.setFontSize(e.target.value + 'pt'))}
              title={t('rib.fontSize')}
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>{s} pt</option>
              ))}
            </select>
            <Btn icon="plus" size="xs" title={t('rib.increaseSize')} onClick={() => {
              const idx = SIZES.indexOf(fontSize || '12')
              run((c) => c.setFontSize(SIZES[Math.min(idx + 1, SIZES.length - 1)] + 'pt'))
            }} />
            <Btn icon="minus" size="xs" title={t('rib.decreaseSize')} onClick={() => {
              const idx = SIZES.indexOf(fontSize || '12')
              run((c) => c.setFontSize(SIZES[Math.max(idx - 1, 0)] + 'pt'))
            }} />
          </div>
        </div>
      </G>

      <G label={t('rib.formatting')}>
        <div className="rgroup-col">
          <div className="rgroup-row">
            <T icon="bold" title={t('rib.bold')} on={ed?.isActive('bold')} onClick={() => run((c) => c.toggleBold())} />
            <T icon="italic" title={t('rib.italic')} on={ed?.isActive('italic')} onClick={() => run((c) => c.toggleItalic())} />
            <T icon="underline" title={t('rib.underline')} on={ed?.isActive('underline')} onClick={() => run((c) => c.toggleUnderline())} />
            <T icon="strike" title={t('rib.strike')} on={ed?.isActive('strike')} onClick={() => run((c) => c.toggleStrike())} />
            <T icon="sub" title={t('rib.subscript')} on={ed?.isActive('subscript')} onClick={() => run((c) => c.toggleSubscript())} />
            <T icon="sup" title={t('rib.superscript')} on={ed?.isActive('superscript')} onClick={() => run((c) => c.toggleSuperscript())} />
          </div>
          <div className="rgroup-row">
            <Btn size="sm" title={t('rib.textColor')} onClick={() => setPop('color')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="font" size={16} />
                <span className="bar" style={{ background: (ed?.getAttributes('textStyle').color as string) || '#eaf0fa' }} />
              </span>
            </Btn>
            <Btn size="sm" title={t('rib.highlight')} onClick={() => setPop('highlight')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="highlighter" size={16} />
                <span className="bar" style={{ background: (ed?.getAttributes('highlight').color as string) || '#fef08a' }} />
              </span>
            </Btn>
            <T icon="eraser" title={t('rib.clearFormatting')} onClick={() => run((c) => c.unsetAllMarks().clearNodes())} />
          </div>
        </div>
      </G>

      <G label={t('rib.paragraph')}>
        <div className="rgroup-col">
          <div className="rgroup-row">
            <T icon="alignLeft" title={t('rib.alignLeft')} on={ed?.isActive({ textAlign: 'left' })} onClick={() => run((c) => c.setTextAlign('left'))} />
            <T icon="alignCenter" title={t('rib.alignCenter')} on={ed?.isActive({ textAlign: 'center' })} onClick={() => run((c) => c.setTextAlign('center'))} />
            <T icon="alignRight" title={t('rib.alignRight')} on={ed?.isActive({ textAlign: 'right' })} onClick={() => run((c) => c.setTextAlign('right'))} />
            <T icon="alignJustify" title={t('rib.alignJustify')} on={ed?.isActive({ textAlign: 'justify' })} onClick={() => run((c) => c.setTextAlign('justify'))} />
          </div>
          <div className="rgroup-row">
            <T icon="list" title={t('rib.bulletList')} on={ed?.isActive('bulletList')} onClick={() => run((c) => c.toggleBulletList())} />
            <T icon="listOrdered" title={t('rib.orderedList')} on={ed?.isActive('orderedList')} onClick={() => run((c) => c.toggleOrderedList())} />
            <T icon="indentInc" title={t('rib.increaseIndent')} onClick={() => run((c) => c.indent())} />
            <T icon="indentDec" title={t('rib.decreaseIndent')} onClick={() => run((c) => c.outdent())} />
            <select
              className="sel tiny"
              value={lh || p.settings.docLh}
              onChange={(e) => run((c) => c.setLineHeight(e.target.value))}
              title={t('rib.lineSpacing')}
            >
              {LINE_HEIGHTS.map((l) => (
                <option key={l.v} value={l.v}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </G>

      <G label={t('rib.editing')}>
        <div className="rgroup-col">
          <div className="rgroup-row">
            <T icon="undo" title={t('rib.undo')} onClick={() => run((c) => c.undo())} disabled={!ed?.can().undo()} />
            <T icon="redo" title={t('rib.redo')} onClick={() => run((c) => c.redo())} disabled={!ed?.can().redo()} />
            <T icon="search" title={t('rib.findReplace')} onClick={() => p.onSheet('find')} />
          </div>
          <div className="rgroup-row">
            <T icon="book" title={t('rib.legalDictionary')} onClick={() => p.onSheet('dict')} />
            <T icon="listCheck" title={t('rib.languageCheck')} onClick={() => p.onSheet('check')} />
          </div>
        </div>
      </G>
    </>
  )

  /* ------------------------------ INSERT -------------------------- */
  const insert = (
    <>
      <G label={t('rib.page')}>
        <T icon="pageBreak" title={t('rib.pageBreak')} onClick={() => { run((c) => c.setPageBreak()); toast(t('rib.pageBreakAdded'), 'ok') }} />
      </G>
      <G label={t('rib.table')}>
        <T icon="table" title={t('rib.tableTitle')} onClick={() => setPop('table')} />
      </G>
      <G label={t('rib.media')}>
        <T icon="image" title={t('rib.image')} onClick={() => fileRef.current?.click()} />
        <T icon="link" title={t('rib.link')} onClick={() => setPop('link')} />
        <T icon="minus" title={t('rib.horizontalRule')} onClick={() => run((c) => c.setHorizontalRule())} />
      </G>
      <G label={t('rib.fields')}>
        <T icon="calendar" title={t('rib.today')} onClick={() => insertHtml(vals.DATE)} />
        <Btn icon="type" label={t('rib.fields')} size="sm" title={t('rib.fieldMenu')} onClick={() => setPop('field')} />
        <T icon="signature" title={t('rib.signatureBlock')} onClick={() => insertHtml(
          `<p class="doc-sign">दिनांक: ${vals.DATE}</p><p class="doc-sign">स्थान: ${vals.PLACE}</p>` +
          `<p class="doc-sign"><strong>प्रार्थी/निवेदक</strong><br>${vals.CLIENT}<br>प्रार्थी अधिवक्ता: ${vals.ADV}</p>`,
        )} />
      </G>
      <G label={t('rib.legalBlocks')}>
        <Btn icon="docs" label={t('rib.templatesBtn')} size="sm" onClick={p.onTemplates} title={t('rib.insertTemplate')} />
        <Btn icon="list" label={t('rib.phrasesBtn')} size="sm" onClick={p.onPhrases} title={t('tpl.phrasesTitle')} />
        <Btn icon="book" label={t('rib.wordsBtn')} size="sm" onClick={() => p.onSheet('dict')} title={t('rib.legalDictionary')} />
      </G>
    </>
  )

  /* ------------------------------ LAYOUT -------------------------- */
  const layout = (
    <>
      <G label={t('rib.pageSize')}>
        <div className="rgroup-col">
          <select
            className="sel"
            value={p.page.size}
            onChange={(e) => p.onPage({ size: e.target.value as PageSize })}
            title={t('pg.size')}
          >
            {Object.keys(PAGE_SIZES).map((k) => (
              <option key={k} value={k}>{t(`pg.size.${k === 'legal13' ? 'legal13' : k}` as never)}</option>
            ))}
          </select>
          <div className="rgroup-row">
            <T icon="portrait" title={t('rib.portrait')} on={p.page.orientation === 'portrait'} onClick={() => p.onPage({ orientation: 'portrait' })} />
            <T icon="landscape" title={t('rib.landscape')} on={p.page.orientation === 'landscape'} onClick={() => p.onPage({ orientation: 'landscape' })} />
            <Btn icon="layout" label={t('rib.margins')} size="sm" onClick={() => p.onSheet('page')} title={t('pg.title')} />
          </div>
        </div>
      </G>

      <G label={t('rib.headerFooter')}>
        <div className="rgroup-col">
          <div className="rgroup-row">
            <T icon="page" title={t('rib.headerFooterBtn')} onClick={() => p.onSheet('page')} />
            <T icon="listOrdered" title={t('rib.pageNumbers')} on={p.page.pageNumbers} onClick={() => p.onPage({ pageNumbers: !p.page.pageNumbers })} />
            <T icon="grid" title={t('rib.borderFrame')} on={p.page.borderFrame} onClick={() => p.onPage({ borderFrame: !p.page.borderFrame })} />
          </div>
          <div className="rgroup-row">
            <select
              className="sel tiny"
              value={p.page.watermark}
              onChange={(e) => {
                const v = e.target.value as PageSettings['watermark']
                p.onPage({ watermark: v, watermarkText: v === 'custom' ? p.page.watermarkText || 'DRAFT' : p.page.watermarkText })
                if (v === 'custom') p.onSheet('page')
              }}
              title={t('rib.watermark')}
            >
              <option value="none">{t('pg.wm.none')}</option>
              <option value="DRAFT">DRAFT</option>
              <option value="अंतिम प्रारूप">{t('pg.wm.final')}</option>
              <option value="कॉपी">{t('pg.wm.copy')}</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="custom">{t('pg.wm.custom')}</option>
            </select>
            <T icon="listOrdered" title={t('rib.lineNumbers')} on={p.page.lineNumbers} onClick={() => p.onPage({ lineNumbers: !p.page.lineNumbers })} />
          </div>
        </div>
      </G>

      <G label={t('rib.viewGroup')}>
        <div className="rgroup-col">
          <div className="rgroup-row">
            <T icon="zoomOut" title={t('rib.zoomOut')} onClick={() => p.setZoom(Math.max(0.3, p.zoom - 0.1))} />
            <span style={{ minWidth: 46, textAlign: 'center', fontSize: 12 }}>{Math.round(p.zoom * 100)}%</span>
            <T icon="zoomIn" title={t('rib.zoomIn')} onClick={() => p.setZoom(Math.min(2.4, p.zoom + 0.1))} />
            <T icon="fit" title={t('rib.fitWidth')} onClick={p.fitZoom} />
          </div>
          <div className="rgroup-row">
            <T icon="grid" title={t('rib.pageGuides')} on={p.page.showGuides} onClick={() => p.onPage({ showGuides: !p.page.showGuides })} />
            <T icon={p.settings.theme === 'dark' ? 'moon' : 'sun'} title={t('rib.themeToggle')} onClick={() => p.onSettings({ theme: p.settings.theme === 'dark' ? 'light' : 'dark' })} />
          </div>
        </div>
      </G>
    </>
  )

  /* ------------------------------ REVIEW -------------------------- */
  const review = (
    <>
      <G label={t('rib.counts')}>
        <div className="rgroup-col">
          <div style={{ display: 'flex', gap: 10, fontSize: 11.5, color: 'var(--muted)' }}>
            <div><b style={{ color: 'var(--text)', fontSize: 15 }}>{p.words}</b><div>{t('c.words')}</div></div>
            <div><b style={{ color: 'var(--text)', fontSize: 15 }}>{p.chars}</b><div>{t('ed.chars')}</div></div>
            <div><b style={{ color: 'var(--text)', fontSize: 15 }}>{Math.max(1, Math.round(p.words / 150))}</b><div>{t('rib.readingTime')}</div></div>
          </div>
        </div>
      </G>
      <G label={t('rib.searchGroup')}>
        <T icon="search" title={t('rib.findReplace')} onClick={() => p.onSheet('find')} />
        <T icon="listCheck" title={t('ck.title')} onClick={() => p.onSheet('check')} />
      </G>
      <G label={t('rib.language')}>
        <T icon="book" title={t('rib.legalDictionary')} onClick={() => p.onSheet('dict')} />
        <T icon="scales" title={t('menu.law')} onClick={() => p.onSheet('law')} />
      </G>
      <G label={t('rib.versions')}>
        <T icon="history" title={t('ver.title')} onClick={() => p.onSheet('versions')} />
      </G>
    </>
  )

  /* ------------------------------ LEGAL --------------------------- */
  const court = courtByKey(p.cd.court)
  const legal = (
    <>
      <G label={t('rib.court')}>
        <div className="rgroup-col">
          <select
            className="sel"
            style={{ maxWidth: 240 }}
            value={p.cd.court}
            onChange={(e) => p.onCase({ court: e.target.value as CourtKey })}
            title={t('case.court')}
          >
            {COURTS.map((c) => (
              <option key={c.key} value={c.key}>{courtTitle(c.key)}</option>
            ))}
          </select>
          <div className="rgroup-row">
            <Btn icon="user" label={t('rib.caseDetailsBtn')} size="sm" onClick={() => p.onSheet('case')} />
            <Btn icon="sparkle" label={t('rib.fillFields')} size="sm" onClick={p.onFillFields} title={t('rib.fillFields')} />
          </div>
        </div>
      </G>
      <G label={t('rib.heading')}>
        <div className="rgroup-col">
          <Btn icon="page" label={t('rib.courtHeadingBtn')} size="sm" onClick={() => insertHtml(`<p class="doc-court">${courtHeading(p.cd, true)}</p>`)} />
          <Btn icon="signature" label={t('rib.partyBlockBtn')} size="sm" onClick={() => insertHtml(
            `<p class="doc-party"><strong>${vals.PARTYA_LABEL}:</strong> ${vals.PARTYA}<br><em>बनाम</em><br><strong>${vals.PARTYB_LABEL}:</strong> ${vals.PARTYB}</p>`,
          )} />
        </div>
      </G>
      <G label={t('rib.assistance')}>
        <div className="rgroup-col">
          <Btn icon="docs" label={t('rib.insertTemplate')} size="sm" onClick={p.onTemplates} />
          <Btn icon="list" label={t('rib.phrasesShort')} size="sm" onClick={p.onPhrases} />
        </div>
      </G>
      <G label={t('rib.jurisdiction')}>
        <div style={{ maxWidth: 340, fontSize: 11, color: 'var(--muted)', lineHeight: 1.45, paddingTop: 4 }}>
          <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>
            {lang === 'hi' ? court.hi : COURT_EN[court.key] ?? court.en}
          </div>
          {court.power}
        </div>
      </G>
    </>
  )

  /* ------------------------------- VIEW --------------------------- */
  const view = (
    <>
      <G label={t('rib.zoom')}>
        <T icon="zoomOut" title={t('rib.zoomOut')} onClick={() => p.setZoom(Math.max(0.3, p.zoom - 0.1))} />
        <T icon="zoomIn" title={t('rib.zoomIn')} onClick={() => p.setZoom(Math.min(2.4, p.zoom + 0.1))} />
        <T icon="fit" title={t('rib.fitWidth')} onClick={p.fitZoom} />
      </G>
      <G label={t('rib.display')}>
        <T icon="grid" title={t('rib.pageGuides')} on={p.page.showGuides} onClick={() => p.onPage({ showGuides: !p.page.showGuides })} />
        <T icon={p.settings.theme === 'dark' ? 'moon' : 'sun'} title={t('rib.theme')} onClick={() => p.onSettings({ theme: p.settings.theme === 'dark' ? 'light' : 'dark' })} />
        <T icon="keyboard" title={t('rib.punctStrip')} on={p.settings.showKeyboardStrip} onClick={() => p.onSettings({ showKeyboardStrip: !p.settings.showKeyboardStrip })} />
      </G>
      <G label={t('rib.document')}>
        <T icon="eye" title={t('rib.printPreview')} onClick={() => p.onSheet('preview')} />
        <T icon="download" title={t('rib.exportBtn')} onClick={() => p.onSheet('export')} />
        <T icon="page" title={t('rib.pageSetupBtn')} onClick={() => p.onSheet('page')} />
      </G>
    </>
  )

  return (
    <>
      <div className="tabbar">
        {[
          ['home', t('tab.home')],
          ['insert', t('tab.insert')],
          ['layout', t('tab.layout')],
          ['review', t('tab.review')],
          ['legal', t('tab.legal')],
          ['view', t('tab.view')],
        ].map(([k, label]) => (
          <button key={k} type="button" className={`tab ${p.tab === k ? 'on' : ''}`} onClick={() => p.setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      <div className="ribbon">
        {p.tab === 'home' && home}
        {p.tab === 'insert' && insert}
        {p.tab === 'layout' && layout}
        {p.tab === 'review' && review}
        {p.tab === 'legal' && legal}
        {p.tab === 'view' && view}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) insertImage(f)
          e.target.value = ''
        }}
      />

      {/* पाठ रंग */}
      <Sheet open={pop === 'color'} onClose={() => setPop(null)} title={t('rib.textColourTitle')} center>
        <ColorGrid
          colors={TEXT_COLORS}
          value={ed?.getAttributes('textStyle').color as string}
          onPick={(c) => { run((x) => x.setColor(c)); setPop(null) }}
          allowCustom
        />
        <div style={{ marginTop: 14 }}>
          <Btn wide variant="ghost" icon="eraser" label={t('rib.removeColour')} onClick={() => { run((x) => x.unsetColor()); setPop(null) }} />
        </div>
      </Sheet>

      {/* हाइलाइट */}
      <Sheet open={pop === 'highlight'} onClose={() => setPop(null)} title={t('rib.highlightTitle')} center>
        <ColorGrid
          colors={HIGHLIGHT_COLORS}
          value={ed?.getAttributes('highlight').color as string}
          onPick={(c) => { run((x) => (c === 'transparent' ? x.unsetHighlight() : x.setHighlight({ color: c }))); setPop(null) }}
        />
      </Sheet>

      {/* तालिका */}
      <Sheet open={pop === 'table'} onClose={() => setPop(null)} title={t('rib.tableTitle')} center>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{t('rib.tableInsert')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[[2, 2], [3, 2], [2, 3], [3, 3], [4, 3], [3, 4], [4, 4], [5, 3]].map(([r, c]) => (
            <Btn key={`${r}x${c}`} variant="ghost" size="sm" label={`${r}×${c}`} onClick={() => { run((x) => x.insertTable({ rows: r, cols: c, withHeaderRow: true })); setPop(null) }} />
          ))}
        </div>
        <div style={{ height: 1, background: 'var(--line-soft)', margin: '16px 0' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Btn size="sm" variant="ghost" label={t('rib.addRow')} onClick={() => run((x) => x.addRowAfter())} />
          <Btn size="sm" variant="ghost" label={t('rib.addColumn')} onClick={() => run((x) => x.addColumnAfter())} />
          <Btn size="sm" variant="ghost" label={t('rib.deleteRow')} onClick={() => run((x) => x.deleteRow())} />
          <Btn size="sm" variant="ghost" label={t('rib.deleteColumn')} onClick={() => run((x) => x.deleteColumn())} />
          <Btn size="sm" variant="danger" label={t('rib.deleteTable')} onClick={() => run((x) => x.deleteTable())} />
        </div>
      </Sheet>

      {/* फ़ील्ड */}
      <Sheet open={pop === 'field'} onClose={() => setPop(null)} title={t('rib.fieldTitle')} subtitle={t('rib.fieldSub')} center>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.keys(vals).filter((k) => !['WATERMARK', 'COURT_EN', 'PHONE'].includes(k)).map((k) => (
            <Btn
              key={k}
              size="sm"
              variant="ghost"
              label={`${k} — ${vals[k] ? String(vals[k]).slice(0, 18) || '—' : t('rib.fieldEmpty')}`}
              onClick={() => { insertHtml(vals[k] || `[${k}]`); setPop(null) }}
            />
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <Btn wide icon="sparkle" label={t('rib.fillAll')} variant="ghost" onClick={() => { p.onFillFields(); setPop(null) }} />
        </div>
      </Sheet>

      {/* लिंक */}
      <Sheet
        open={pop === 'link'}
        onClose={() => setPop(null)}
        title={t('rib.linkTitle')}
        center
        footer={
          <>
            <Btn label={t('c.cancel')} variant="ghost" onClick={() => setPop(null)} />
            <Btn
              label={t('rib.addLink')}
              variant="primary"
              onClick={() => {
                if (!link.trim()) return
                const href = /^https?:/i.test(link) ? link : 'https://' + link
                run((x) => x.setLink({ href }))
                setLink('')
                setPop(null)
              }}
            />
          </>
        }
      >
        <Field label="URL">
          <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com" inputMode="url" />
        </Field>
        {ed?.isActive('link') && (
          <Btn wide variant="danger" icon="close" label={t('rib.removeLink')} onClick={() => { run((x) => x.unsetLink()); setPop(null) }} />
        )}
      </Sheet>
    </>
  )
}
