import { useRef, useState, type ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
import { COURTS, PAGE_SIZES, courtByKey, courtHeading } from '../data/courts'
import type { CaseDetails, PageSettings, SheetKey, CourtKey, PageSize } from '../types'
import type { Settings } from '../lib/storage'
import { Icon, type IconName } from './icons'
import { Btn, ColorGrid, Field, Sheet, TEXT_COLORS, HIGHLIGHT_COLORS } from './ui'
import { toast } from '../lib/toast'
import { fieldValues } from '../lib/fields'

export const FONTS = [
  { label: 'नोटो सेरिफ़ देवनागरी', v: "'Noto Serif Devanagari', serif" },
  { label: 'नोटो संस देवनागरी', v: "'Noto Sans Devanagari', sans-serif" },
  { label: 'मंगल', v: "'Mangal', 'Noto Sans Devanagari', sans-serif" },
  { label: 'निर्मला यूआई', v: "'Nirmala UI', 'Noto Sans Devanagari', sans-serif" },
  { label: 'टाइम्स न्यू रोमन', v: "'Times New Roman', 'Noto Serif Devanagari', serif" },
  { label: 'एरियल', v: "Arial, 'Noto Sans Devanagari', sans-serif" },
  { label: 'कूरियर', v: "'Courier New', 'Noto Sans Devanagari', monospace" },
]

const SIZES = ['8', '9', '10', '10.5', '11', '12', '13', '14', '16', '18', '20', '22', '24', '28', '32', '36', '48']
const LINE_HEIGHTS = [
  { label: 'एकल', v: '1' },
  { label: '1.15', v: '1.15' },
  { label: '1.5', v: '1.5' },
  { label: 'दोहरा', v: '2' },
  { label: '2.5', v: '2.5' },
  { label: '3', v: '3' },
]

const BLOCK_STYLES = [
  { label: 'सामान्य अनुच्छेद', v: 'doc-body', cls: 'doc-body' },
  { label: 'न्यायालय शीर्षक', v: 'doc-court', cls: 'doc-court' },
  { label: 'प्रकरण संख्या', v: 'doc-caseno', cls: 'doc-caseno' },
  { label: 'पक्षकार (बनाम)', v: 'doc-party', cls: 'doc-party' },
  { label: 'विषय पंक्ति', v: 'doc-subject', cls: 'doc-subject' },
  { label: 'प्रार्थना शीर्षक', v: 'doc-prayer', cls: 'doc-prayer' },
  { label: 'हस्ताक्षर खंड', v: 'doc-sign', cls: 'doc-sign' },
  { label: 'सत्यापन', v: 'doc-verify', cls: 'doc-verify' },
  { label: 'टिप्पणी / नोट', v: 'doc-note', cls: 'doc-note' },
  { label: 'उद्धरण', v: 'doc-quote', cls: 'doc-quote' },
]

const WATERMARKS: { label: string; v: PageSettings['watermark'] }[] = [
  { label: 'कोई नहीं', v: 'none' },
  { label: 'DRAFT', v: 'DRAFT' },
  { label: 'अंतिम प्रारूप', v: 'अंतिम प्रारूप' },
  { label: 'कॉपी', v: 'कॉपी' },
  { label: 'CONFIDENTIAL', v: 'CONFIDENTIAL' },
  { label: 'अपना पाठ…', v: 'custom' },
]

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
  const [pop, setPop] = useState<null | 'color' | 'highlight' | 'table' | 'field' | 'link' | 'textcolor2'>(null)
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

  const insertImage = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result)
      const img = new Image()
      img.onload = () => {
        /* बड़ी छवि को छोटा करें — संग्रहण हल्का रहे */
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
        toast('चित्र जोड़ा गया', 'ok')
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  /* ------------------------------- HOME --------------------------- */
  const home = (
    <>
      <G label="शैली">
        <div className="rgroup-col">
          <select
            className="sel"
            value={ed?.isActive('heading', { level: 1 }) ? 'h1' : ed?.isActive('heading', { level: 2 }) ? 'h2' : ed?.isActive('heading', { level: 3 }) ? 'h3' : 'p'}
            onChange={(e) => {
              const v = e.target.value
              run((c) => (v === 'p' ? c.setParagraph() : c.toggleHeading({ level: Number(v.slice(1)) })))
            }}
            title="अनुच्छेद शैली"
          >
            <option value="p">सामान्य</option>
            <option value="h1">शीर्षक 1</option>
            <option value="h2">शीर्षक 2</option>
            <option value="h3">शीर्षक 3</option>
          </select>
          <select
            className="sel"
            value={blockCls}
            onChange={(e) => run((c) => c.setBlockStyle(e.target.value))}
            title="विधिक ब्लॉक शैली"
          >
            {BLOCK_STYLES.map((s) => (
              <option key={s.v} value={s.v}>{s.label}</option>
            ))}
          </select>
        </div>
      </G>

      <G label="फ़ॉन्ट">
        <div className="rgroup-col">
          <select
            className="sel"
            style={{ maxWidth: 200 }}
            value={fontFamily || p.settings.docFont}
            onChange={(e) => run((c) => c.setFontFamily(e.target.value))}
            title="फ़ॉन्ट"
          >
            {FONTS.map((f) => (
              <option key={f.v} value={f.v}>{f.label}</option>
            ))}
          </select>
          <div className="rgroup-row">
            <select
              className="sel narrow"
              value={fontSize || p.settings.docSize.replace('pt', '')}
              onChange={(e) => run((c) => c.setFontSize(e.target.value + 'pt'))}
              title="आकार"
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>{s} pt</option>
              ))}
            </select>
            <Btn icon="plus" size="xs" title="आकार बढ़ाएँ" onClick={() => {
              const idx = SIZES.indexOf(fontSize || '12')
              run((c) => c.setFontSize(SIZES[Math.min(idx + 1, SIZES.length - 1)] + 'pt'))
            }} />
            <Btn icon="minus" size="xs" title="आकार घटाएँ" onClick={() => {
              const idx = SIZES.indexOf(fontSize || '12')
              run((c) => c.setFontSize(SIZES[Math.max(idx - 1, 0)] + 'pt'))
            }} />
          </div>
        </div>
      </G>

      <G label="स्वरूप">
        <div className="rgroup-col">
          <div className="rgroup-row">
            <T icon="bold" title="मोटा" on={ed?.isActive('bold')} onClick={() => run((c) => c.toggleBold())} />
            <T icon="italic" title="तिरछा" on={ed?.isActive('italic')} onClick={() => run((c) => c.toggleItalic())} />
            <T icon="underline" title="रेखांकित" on={ed?.isActive('underline')} onClick={() => run((c) => c.toggleUnderline())} />
            <T icon="strike" title="काटें" on={ed?.isActive('strike')} onClick={() => run((c) => c.toggleStrike())} />
            <T icon="sub" title="अधोलेख" on={ed?.isActive('subscript')} onClick={() => run((c) => c.toggleSubscript())} />
            <T icon="sup" title="उर्ध्वलेख" on={ed?.isActive('superscript')} onClick={() => run((c) => c.toggleSuperscript())} />
          </div>
          <div className="rgroup-row">
            <Btn size="sm" title="पाठ रंग" onClick={() => setPop('color')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="font" size={16} />
                <span className="bar" style={{ background: (ed?.getAttributes('textStyle').color as string) || '#eaf0fa' }} />
              </span>
            </Btn>
            <Btn size="sm" title="हाइलाइट" onClick={() => setPop('highlight')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="highlighter" size={16} />
                <span className="bar" style={{ background: (ed?.getAttributes('highlight').color as string) || '#fef08a' }} />
              </span>
            </Btn>
            <T icon="eraser" title="स्वरूपण हटाएँ" onClick={() => run((c) => c.unsetAllMarks().clearNodes())} />
          </div>
        </div>
      </G>

      <G label="अनुच्छेद">
        <div className="rgroup-col">
          <div className="rgroup-row">
            <T icon="alignLeft" title="बाएँ" on={ed?.isActive({ textAlign: 'left' })} onClick={() => run((c) => c.setTextAlign('left'))} />
            <T icon="alignCenter" title="मध्य" on={ed?.isActive({ textAlign: 'center' })} onClick={() => run((c) => c.setTextAlign('center'))} />
            <T icon="alignRight" title="दाएँ" on={ed?.isActive({ textAlign: 'right' })} onClick={() => run((c) => c.setTextAlign('right'))} />
            <T icon="alignJustify" title="समायोजित" on={ed?.isActive({ textAlign: 'justify' })} onClick={() => run((c) => c.setTextAlign('justify'))} />
          </div>
          <div className="rgroup-row">
            <T icon="list" title="बिंदु सूची" on={ed?.isActive('bulletList')} onClick={() => run((c) => c.toggleBulletList())} />
            <T icon="listOrdered" title="क्रमांकित सूची" on={ed?.isActive('orderedList')} onClick={() => run((c) => c.toggleOrderedList())} />
            <T icon="indentInc" title="इंडेंट बढ़ाएँ" onClick={() => run((c) => c.indent())} />
            <T icon="indentDec" title="इंडेंट घटाएँ" onClick={() => run((c) => c.outdent())} />
            <select
              className="sel tiny"
              value={lh || p.settings.docLh}
              onChange={(e) => run((c) => c.setLineHeight(e.target.value))}
              title="पंक्ति अंतर"
            >
              {LINE_HEIGHTS.map((l) => (
                <option key={l.v} value={l.v}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </G>

      <G label="संपादन">
        <div className="rgroup-col">
          <div className="rgroup-row">
            <T icon="undo" title="पूर्ववत" onClick={() => run((c) => c.undo())} disabled={!ed?.can().undo()} />
            <T icon="redo" title="दोहराएँ" onClick={() => run((c) => c.redo())} disabled={!ed?.can().redo()} />
            <T icon="search" title="खोजें / बदलें" onClick={() => p.onSheet('find')} />
          </div>
          <div className="rgroup-row">
            <T icon="book" title="विधिक शब्दकोश" onClick={() => p.onSheet('dict')} />
            <T icon="listCheck" title="भाषा जाँच" onClick={() => p.onSheet('check')} />
          </div>
        </div>
      </G>
    </>
  )

  /* ------------------------------ INSERT -------------------------- */
  const insert = (
    <>
      <G label="पृष्ठ">
        <T icon="pageBreak" title="पृष्ठ विच्छेद" onClick={() => { run((c) => c.setPageBreak()); toast('पृष्ठ विच्छेद जोड़ा गया', 'ok') }} />
      </G>
      <G label="तालिका">
        <T icon="table" title="तालिका" onClick={() => setPop('table')} />
      </G>
      <G label="मीडिया">
        <T icon="image" title="चित्र" onClick={() => fileRef.current?.click()} />
        <T icon="link" title="लिंक" onClick={() => setPop('link')} />
        <T icon="minus" title="क्षैतिज रेखा" onClick={() => run((c) => c.setHorizontalRule())} />
      </G>
      <G label="फ़ील्ड">
        <T icon="calendar" title="आज की तिथि" onClick={() => insertHtml(vals.DATE)} />
        <Btn icon="type" label="फ़ील्ड" size="sm" title="केस फ़ील्ड जोड़ें" onClick={() => setPop('field')} />
        <T icon="signature" title="हस्ताक्षर खंड" onClick={() => insertHtml(
          `<p class="doc-sign">दिनांक: ${vals.DATE}</p><p class="doc-sign">स्थान: ${vals.PLACE}</p>` +
          `<p class="doc-sign"><strong>प्रार्थी/निवेदक</strong><br>${vals.CLIENT}<br>प्रार्थी अधिवक्ता: ${vals.ADV}</p>`,
        )} />
      </G>
      <G label="विधिक खंड">
        <Btn icon="docs" label="प्रारूप" size="sm" onClick={p.onTemplates} title="तैयार प्रारूप जोड़ें" />
        <Btn icon="list" label="वाक्यांश" size="sm" onClick={p.onPhrases} title="न्यायालयीन वाक्यांश" />
        <Btn icon="book" label="शब्द" size="sm" onClick={() => p.onSheet('dict')} title="शब्दकोश से शब्द जोड़ें" />
      </G>
    </>
  )

  /* ------------------------------ LAYOUT -------------------------- */
  const layout = (
    <>
      <G label="पृष्ठ आकार">
        <div className="rgroup-col">
          <select
            className="sel"
            value={p.page.size}
            onChange={(e) => p.onPage({ size: e.target.value as PageSize })}
            title="पृष्ठ आकार"
          >
            {Object.entries(PAGE_SIZES).map(([k, v]) => (
              <option key={k} value={k}>{v.hi}</option>
            ))}
          </select>
          <div className="rgroup-row">
            <T icon="portrait" title="खड़ा" on={p.page.orientation === 'portrait'} onClick={() => p.onPage({ orientation: 'portrait' })} />
            <T icon="landscape" title="भूमि" on={p.page.orientation === 'landscape'} onClick={() => p.onPage({ orientation: 'landscape' })} />
            <Btn icon="layout" label="हाशिया" size="sm" onClick={() => p.onSheet('page')} title="हाशिया एवं पृष्ठ सेटिंग" />
          </div>
        </div>
      </G>

      <G label="शीर्ष/पाद">
        <div className="rgroup-col">
          <div className="rgroup-row">
            <T icon="page" title="शीर्षक एवं पाद लेख" onClick={() => p.onSheet('page')} />
            <T icon="listOrdered" title="पृष्ठ संख्या" on={p.page.pageNumbers} onClick={() => p.onPage({ pageNumbers: !p.page.pageNumbers })} />
            <T icon="grid" title="रेखांकित सीमा" on={p.page.borderFrame} onClick={() => p.onPage({ borderFrame: !p.page.borderFrame })} />
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
              title="वॉटरमार्क"
            >
              {WATERMARKS.map((w) => (
                <option key={w.v} value={w.v}>{w.label}</option>
              ))}
            </select>
            <T icon="listOrdered" title="पंक्ति क्रमांक" on={p.page.lineNumbers} onClick={() => p.onPage({ lineNumbers: !p.page.lineNumbers })} />
          </div>
        </div>
      </G>

      <G label="दृश्य">
        <div className="rgroup-col">
          <div className="rgroup-row">
            <T icon="zoomOut" title="छोटा" onClick={() => p.setZoom(Math.max(0.3, p.zoom - 0.1))} />
            <span style={{ minWidth: 46, textAlign: 'center', fontSize: 12 }}>{Math.round(p.zoom * 100)}%</span>
            <T icon="zoomIn" title="बड़ा" onClick={() => p.setZoom(Math.min(2.4, p.zoom + 0.1))} />
            <T icon="fit" title="चौड़ाई में फ़िट" onClick={p.fitZoom} />
          </div>
          <div className="rgroup-row">
            <T icon="grid" title="पृष्ठ गाइड" on={p.page.showGuides} onClick={() => p.onPage({ showGuides: !p.page.showGuides })} />
            <T icon={p.settings.theme === 'dark' ? 'moon' : 'sun'} title="थीम" onClick={() => p.onSettings({ theme: p.settings.theme === 'dark' ? 'light' : 'dark' })} />
          </div>
        </div>
      </G>
    </>
  )

  /* ------------------------------ REVIEW -------------------------- */
  const review = (
    <>
      <G label="गणना">
        <div className="rgroup-col">
          <div style={{ display: 'flex', gap: 10, fontSize: 11.5, color: 'var(--muted)' }}>
            <div><b style={{ color: 'var(--text)', fontSize: 15 }}>{p.words}</b><div>शब्द</div></div>
            <div><b style={{ color: 'var(--text)', fontSize: 15 }}>{p.chars}</b><div>अक्षर</div></div>
            <div><b style={{ color: 'var(--text)', fontSize: 15 }}>{Math.max(1, Math.round(p.words / 150))}</b><div>मिनट पठन</div></div>
          </div>
        </div>
      </G>
      <G label="खोज">
        <T icon="search" title="खोजें एवं बदलें" onClick={() => p.onSheet('find')} />
        <T icon="listCheck" title="भाषा एवं वर्तनी जाँच" onClick={() => p.onSheet('check')} />
      </G>
      <G label="भाषा">
        <T icon="book" title="विधिक शब्दकोश" onClick={() => p.onSheet('dict')} />
        <T icon="scales" title="धारा मैपिंग" onClick={() => p.onSheet('law')} />
      </G>
      <G label="संस्करण">
        <T icon="history" title="संस्करण इतिहास" onClick={() => p.onSheet('versions')} />
      </G>
    </>
  )

  /* ------------------------------ LEGAL --------------------------- */
  const court = courtByKey(p.cd.court)
  const legal = (
    <>
      <G label="न्यायालय">
        <div className="rgroup-col">
          <select
            className="sel"
            style={{ maxWidth: 240 }}
            value={p.cd.court}
            onChange={(e) => {
              const k = e.target.value as CourtKey
              p.onCase({ court: k })
            }}
            title="न्यायालय चुनें"
          >
            {COURTS.map((c) => (
              <option key={c.key} value={c.key}>{c.hi}</option>
            ))}
          </select>
          <div className="rgroup-row">
            <Btn icon="user" label="केस विवरण" size="sm" onClick={() => p.onSheet('case')} />
            <Btn icon="sparkle" label="फ़ील्ड भरें" size="sm" onClick={p.onFillFields} title="सभी {{फ़ील्ड}} केस विवरण से भरें" />
          </div>
        </div>
      </G>
      <G label="शीर्षक">
        <div className="rgroup-col">
          <Btn icon="page" label="न्यायालय शीर्षक" size="sm" onClick={() => insertHtml(`<p class="doc-court">${courtHeading(p.cd, true)}</p>`)} />
          <Btn icon="signature" label="पक्षकार ब्लॉक" size="sm" onClick={() => insertHtml(
            `<p class="doc-party"><strong>${vals.PARTYA_LABEL}:</strong> ${vals.PARTYA}<br><em>बनाम</em><br><strong>${vals.PARTYB_LABEL}:</strong> ${vals.PARTYB}</p>`,
          )} />
        </div>
      </G>
      <G label="सहायता">
        <div className="rgroup-col">
          <Btn icon="docs" label="प्रारूप जोड़ें" size="sm" onClick={p.onTemplates} />
          <Btn icon="list" label="वाक्यांश" size="sm" onClick={p.onPhrases} />
        </div>
      </G>
      <G label="क्षेत्राधिकार">
        <div style={{ maxWidth: 340, fontSize: 11, color: 'var(--muted)', lineHeight: 1.45, paddingTop: 4 }}>
          <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>{court.hi}</div>
          {court.power}
        </div>
      </G>
    </>
  )

  /* ------------------------------- VIEW --------------------------- */
  const view = (
    <>
      <G label="ज़ूम">
        <T icon="zoomOut" title="छोटा" onClick={() => p.setZoom(Math.max(0.3, p.zoom - 0.1))} />
        <T icon="zoomIn" title="बड़ा" onClick={() => p.setZoom(Math.min(2.4, p.zoom + 0.1))} />
        <T icon="fit" title="फ़िट" onClick={p.fitZoom} />
      </G>
      <G label="प्रदर्शन">
        <T icon="grid" title="पृष्ठ गाइड" on={p.page.showGuides} onClick={() => p.onPage({ showGuides: !p.page.showGuides })} />
        <T icon={p.settings.theme === 'dark' ? 'moon' : 'sun'} title="थीम बदलें" onClick={() => p.onSettings({ theme: p.settings.theme === 'dark' ? 'light' : 'dark' })} />
        <T icon="keyboard" title="विधिक चिह्न पट्टी" on={p.settings.showKeyboardStrip} onClick={() => p.onSettings({ showKeyboardStrip: !p.settings.showKeyboardStrip })} />
      </G>
      <G label="दस्तावेज़">
        <T icon="eye" title="प्रिंट पूर्वावलोकन" onClick={() => p.onSheet('preview')} />
        <T icon="download" title="निर्यात" onClick={() => p.onSheet('export')} />
        <T icon="page" title="पृष्ठ सेटिंग" onClick={() => p.onSheet('page')} />
      </G>
    </>
  )

  return (
    <>
      <div className="tabbar">
        {[
          ['home', 'होम'],
          ['insert', 'सम्मिलित करें'],
          ['layout', 'लेआउट'],
          ['review', 'समीक्षा'],
          ['legal', 'विधिक'],
          ['view', 'दृश्य'],
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
      <Sheet open={pop === 'color'} onClose={() => setPop(null)} title="पाठ का रंग" center>
        <ColorGrid
          colors={TEXT_COLORS}
          value={ed?.getAttributes('textStyle').color as string}
          onPick={(c) => { run((x) => x.setColor(c)); setPop(null) }}
          allowCustom
        />
        <div style={{ marginTop: 14 }}>
          <Btn wide variant="ghost" icon="eraser" label="रंग हटाएँ" onClick={() => { run((x) => x.unsetColor()); setPop(null) }} />
        </div>
      </Sheet>

      {/* हाइलाइट */}
      <Sheet open={pop === 'highlight'} onClose={() => setPop(null)} title="हाइलाइट रंग" center>
        <ColorGrid
          colors={HIGHLIGHT_COLORS}
          value={ed?.getAttributes('highlight').color as string}
          onPick={(c) => { run((x) => (c === 'transparent' ? x.unsetHighlight() : x.setHighlight({ color: c }))); setPop(null) }}
        />
      </Sheet>

      {/* तालिका */}
      <Sheet open={pop === 'table'} onClose={() => setPop(null)} title="तालिका" center>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>तालिका सम्मिलित करें</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[[2, 2], [3, 2], [2, 3], [3, 3], [4, 3], [3, 4], [4, 4], [5, 3]].map(([r, c]) => (
            <Btn key={`${r}x${c}`} variant="ghost" size="sm" label={`${r}×${c}`} onClick={() => { run((x) => x.insertTable({ rows: r, cols: c, withHeaderRow: true })); setPop(null) }} />
          ))}
        </div>
        <div style={{ height: 1, background: 'var(--line-soft)', margin: '16px 0' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Btn size="sm" variant="ghost" label="पंक्ति जोड़ें" onClick={() => run((x) => x.addRowAfter())} />
          <Btn size="sm" variant="ghost" label="स्तंभ जोड़ें" onClick={() => run((x) => x.addColumnAfter())} />
          <Btn size="sm" variant="ghost" label="पंक्ति हटाएँ" onClick={() => run((x) => x.deleteRow())} />
          <Btn size="sm" variant="ghost" label="स्तंभ हटाएँ" onClick={() => run((x) => x.deleteColumn())} />
          <Btn size="sm" variant="danger" label="तालिका हटाएँ" onClick={() => run((x) => x.deleteTable())} />
        </div>
      </Sheet>

      {/* फ़ील्ड */}
      <Sheet open={pop === 'field'} onClose={() => setPop(null)} title="केस फ़ील्ड जोड़ें" subtitle="दस्तावेज़ में मान स्वतः भर जाएगा" center>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.keys(vals).filter((k) => !['WATERMARK', 'COURT_EN', 'PHONE'].includes(k)).map((k) => (
            <Btn
              key={k}
              size="sm"
              variant="ghost"
              label={`${k} — ${vals[k] ? String(vals[k]).slice(0, 18) || '—' : 'रिक्त'}`}
              onClick={() => { insertHtml(vals[k] || `[${k}]`); setPop(null) }}
            />
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <Btn wide icon="sparkle" label="सभी फ़ील्ड भरें" variant="ghost" onClick={() => { p.onFillFields(); setPop(null) }} />
        </div>
      </Sheet>

      {/* लिंक */}
      <Sheet
        open={pop === 'link'}
        onClose={() => setPop(null)}
        title="लिंक जोड़ें"
        center
        footer={
          <>
            <Btn label="रद्द" variant="ghost" onClick={() => setPop(null)} />
            <Btn
              label="जोड़ें"
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
          <Btn wide variant="danger" icon="close" label="मौजूदा लिंक हटाएँ" onClick={() => { run((x) => x.unsetLink()); setPop(null) }} />
        )}
      </Sheet>
    </>
  )
}
