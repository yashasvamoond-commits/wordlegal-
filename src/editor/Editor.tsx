import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import FontFamily from '@tiptap/extension-font-family'
import TextAlign from '@tiptap/extension-text-align'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Placeholder from '@tiptap/extension-placeholder'
import { FontSize, LineHeight, Indent, BlockStyle, PageBreak, FieldTokens } from './extensions'
import { Ribbon } from '../components/Ribbon'
import { Icon } from '../components/icons'
import { Btn, Menu } from '../components/ui'
import { toast } from '../lib/toast'
import { COURT_LABEL } from '../lib/courtLabel'
import { replaceAllInDoc, selectionText } from '../lib/textOps'
import { useT } from '../lib/useT'
import type { Settings } from '../lib/storage'
import type { CaseDetails, DocRecord, EditorApi, PageSettings, SheetKey } from '../types'
import { pageDims } from '../lib/storage'
import { watermarkOf } from '../lib/watermark'

interface Props {
  doc: DocRecord
  settings: Settings
  onSettings: (s: Partial<Settings>) => void
  onChange: (patch: Partial<DocRecord>) => void
  onBack: () => void
  onSheet: (s: SheetKey) => void
  onApi: (api: EditorApi) => void
  onFillFields: () => void
  onToggleLang: () => void
}

const KEY_STRIP = [
  '।', '॥', '₹', '§', '¶', '—', '–', '“', '”', '‘', '’', '(', ')', '[', ']',
  '०', '१', '२', '३', '४', '५', '६', '७', '८', '९', 'धारा', 'अनुच्छेद', 'पैरा', 'दिनांक',
  '×', '÷', '°', '½', '%', '&', 'श्री', 'श्रीमती', 'पुत्र', 'पत्नी', 'निवासी',
]

export function Editor(p: Props) {
  const { doc, settings } = p
  const { t, lang } = useT()
  const dims = pageDims(doc.page)
  const pageWpx = dims.w * 96
  const pageHpx = dims.h * 96

  const canvasRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<number | undefined>(undefined)
  const htmlRef = useRef(doc.html)
  const dirtyRef = useRef(false)

  const [tab, setTab] = useState(settings.lastTab || 'home')
  const [zoom, setZoom] = useState(settings.zoom || 1)
  const [fitMode, setFitMode] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [menu, setMenu] = useState(false)
  const [counts, setCounts] = useState({ words: 0, chars: 0, tokens: 0 })
  const [paperH, setPaperH] = useState(pageHpx)
  const [guideCount, setGuideCount] = useState(1)

  const typecss = useMemo(
    () => ({ fontFamily: settings.docFont, fontSize: settings.docSize, lineHeight: settings.docLh }),
    [settings.docFont, settings.docSize, settings.docLh],
  )

  const docFontSizePt = parseFloat(settings.docSize) || 12

  const recount = useCallback((text: string) => {
    setCounts({
      words: text.split(/\s+/).filter(Boolean).length,
      chars: text.length,
      tokens: (text.match(/\{\{\s*[A-Z_]+\s*\}\}/g) ?? []).length,
    })
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        horizontalRule: {},
        dropcursor: { color: '#e0a33a' },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Subscript,
      Superscript,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener' } }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: t('ed.placeholder') }),
      FontSize,
      LineHeight,
      Indent,
      BlockStyle,
      PageBreak,
      FieldTokens,
    ],
    content: doc.html,
    editorProps: {
      attributes: {
        class: 'doc-content',
        spellcheck: 'false',
        autocapitalize: 'sentences',
      },
    },
    onUpdate: ({ editor: ed }) => {
      htmlRef.current = ed.getHTML()
      dirtyRef.current = true
      setDirty(true)
      recount(ed.getText())
      window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        p.onChange({ html: htmlRef.current, updatedAt: Date.now() })
        dirtyRef.current = false
        setDirty(false)
      }, 650)
      requestAnimationFrame(measure)
    },
  })

  useEffect(() => {
    if (!editor) return
    recount(editor.getText())
    const tt = setTimeout(() => recount(editor.getText()), 300)
    return () => clearTimeout(tt)
  }, [editor, doc.id, recount])

  /* ------------------------------ API ---------------------------- */
  useEffect(() => {
    if (!editor) return
    const api: EditorApi = {
      insertText: (txt) => { editor.chain().focus().insertContent(txt).run() },
      insertHtml: (h) => { editor.chain().focus().insertContent(h).run() },
      getHTML: () => editor.getHTML(),
      getText: () => editor.getText(),
      setHTML: (h) => { editor.commands.setContent(h, false); htmlRef.current = h; dirtyRef.current = true; p.onChange({ html: h }) },
      replaceAll: (a, b, cs) => replaceAllInDoc(editor, a, b, cs),
      focus: () => editor.commands.focus(),
      setPageBreak: () => (editor.commands as unknown as { setPageBreak: () => void }).setPageBreak(),
      selectionText: () => selectionText(editor),
    }
    p.onApi(api)
  }, [editor])

  /* --------------------------- मापन / गाइड ----------------------- */
  const measure = useCallback(() => {
    const paper = paperRef.current
    const edDom = editor?.view.dom as HTMLElement | undefined
    if (!paper || !edDom) return
    const px = 96
    const startY = doc.page.marginTop * px
    const contentH = (dims.h - doc.page.marginTop - doc.page.marginBottom) * px
    const actual = edDom.scrollHeight
    const total = startY + actual + doc.page.marginBottom * px + 8
    setPaperH(Math.max(pageHpx, total))
    setGuideCount(Math.max(1, Math.ceil(actual / contentH)))
  }, [doc.page, dims.h, pageHpx, editor])

  useEffect(() => {
    measure()
    const tt = setTimeout(measure, 120)
    const ro = new ResizeObserver(() => measure())
    if (paperRef.current) ro.observe(paperRef.current)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(tt); ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [measure, doc.html])

  /* ------------------------------ फ़िट --------------------------- */
  const computeFit = useCallback(() => {
    const c = canvasRef.current
    if (!c) return 0.6
    const avail = c.clientWidth - (window.innerWidth > 700 ? 48 : 12)
    return Math.min(1, Math.max(0.28, avail / pageWpx))
  }, [pageWpx])

  useEffect(() => {
    if (!fitMode) return
    const apply = () => setZoom(computeFit())
    apply()
    const ro = new ResizeObserver(apply)
    if (canvasRef.current) ro.observe(canvasRef.current)
    window.addEventListener('orientationchange', apply)
    return () => { ro.disconnect(); window.removeEventListener('orientationchange', apply) }
  }, [fitMode, computeFit, doc.page.orientation, doc.page.size])

  useEffect(() => {
    if (fitMode) return
    p.onSettings({ zoom })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, fitMode])

  const setZoomManual = (z: number) => {
    setFitMode(false)
    setZoom(Math.round(Math.min(2.4, Math.max(0.28, z)) * 100) / 100)
  }

  /* ------------------------------ सहेजें ------------------------- */
  const flush = () => {
    window.clearTimeout(saveTimer.current)
    if (dirtyRef.current) {
      p.onChange({ html: htmlRef.current, updatedAt: Date.now() })
      dirtyRef.current = false
      setDirty(false)
    }
  }

  useEffect(() => {
    const beforeUnload = () => flush()
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goBack = () => { flush(); p.onBack() }

  /* --------------------------- शीर्ष/पाद -------------------------- */
  const guides = useMemo(() => {
    if (!doc.page.showGuides) return []
    const px = 96
    const startY = doc.page.marginTop * px
    const contentH = (dims.h - doc.page.marginTop - doc.page.marginBottom) * px
    const out: number[] = []
    for (let k = 1; k < guideCount; k++) out.push(startY + k * contentH)
    return out
  }, [doc.page, dims.h, guideCount])

  const onChangePage = (patch: Partial<PageSettings>) => p.onChange({ page: { ...doc.page, ...patch } })
  const onChangeCase = (patch: Partial<CaseDetails>) => p.onChange({ caseDetails: { ...doc.caseDetails, ...patch } })

  const wm = watermarkOf(doc.page)

  return (
    <div className="app">
      <header className="topbar">
        <Btn icon="back" size="sm" title={t('tb.library')} onClick={goBack} />
        <input
          className="doc-title-input"
          value={doc.title}
          onChange={(e) => p.onChange({ title: e.target.value, updatedAt: Date.now() })}
          onBlur={flush}
          placeholder={t('tb.titlePlaceholder')}
          aria-label={t('tb.titlePlaceholder')}
        />
        <span className={`save-pill ${dirty ? 'dirty' : ''}`}>
          <span className="dot" />
          <span className="label">{dirty ? t('tb.saving') : t('tb.saved')}</span>
        </span>
        <Btn
          size="sm"
          title={lang === 'en' ? t('tb.switchToHindi') : t('tb.switchToEnglish')}
          onClick={p.onToggleLang}
          className="lang-btn"
        >
          <span style={{ fontWeight: 700, letterSpacing: '.4px', fontSize: 12.5 }}>{lang === 'en' ? 'EN' : 'हि'}</span>
        </Btn>
        <Btn icon="book" size="sm" title={t('tb.dictionary')} onClick={() => p.onSheet('dict')} />
        <div style={{ position: 'relative' }}>
          <Btn icon="morev" size="sm" title={t('c.more')} onClick={() => setMenu((v) => !v)} />
          {menu && (
            <Menu
              onClose={() => setMenu(false)}
              items={[
                { label: t('menu.preview'), icon: 'eye', onClick: () => p.onSheet('preview') },
                { label: t('menu.export'), icon: 'download', onClick: () => p.onSheet('export') },
                { label: t('menu.case'), icon: 'user', onClick: () => p.onSheet('case') },
                { label: t('menu.pageSetup'), icon: 'layout', onClick: () => p.onSheet('page') },
                { label: t('menu.versions'), icon: 'history', onClick: () => p.onSheet('versions') },
                null,
                { label: t('menu.dictionary'), icon: 'book', onClick: () => p.onSheet('dict') },
                { label: t('menu.law'), icon: 'scales', onClick: () => p.onSheet('law') },
                { label: t('tb.settings'), icon: 'settings', onClick: () => p.onSheet('settings') },
                { label: t('menu.about'), icon: 'info', onClick: () => p.onSheet('about') },
              ]}
            />
          )}
        </div>
      </header>

      <Ribbon
        ed={editor}
        tab={tab}
        setTab={(next) => { setTab(next); p.onSettings({ lastTab: next }) }}
        page={doc.page}
        onPage={onChangePage}
        cd={doc.caseDetails}
        onCase={onChangeCase}
        settings={settings}
        onSettings={p.onSettings}
        onSheet={p.onSheet}
        onFillFields={p.onFillFields}
        onTemplates={() => p.onSheet('templates')}
        onPhrases={() => p.onSheet('phrases')}
        zoom={zoom}
        setZoom={setZoomManual}
        fitZoom={() => setFitMode(true)}
        words={counts.words}
        chars={counts.chars}
      />

      <div className="canvas" ref={canvasRef} onDoubleClick={() => editor?.commands.focus()}>
        <div
          className="scaler"
          style={{ width: pageWpx * zoom, height: Math.max(pageHpx, paperH) * zoom }}
        >
          <div
            className="paper"
            ref={paperRef}
            style={{
              ['--pw' as string]: `${dims.w}in`,
              ['--ph' as string]: `${dims.h}in`,
              ['--pt' as string]: `${doc.page.marginTop}in`,
              ['--pr' as string]: `${doc.page.marginRight}in`,
              ['--pb' as string]: `${doc.page.marginBottom}in`,
              ['--pl' as string]: `${doc.page.marginLeft}in`,
              ['--doc-font' as string]: typecss.fontFamily,
              ['--doc-size' as string]: `${docFontSizePt}pt`,
              ['--doc-lh' as string]: typecss.lineHeight,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              minHeight: `${Math.max(pageHpx, paperH)}px`,
              height: `${Math.max(pageHpx, paperH)}px`,
              overflow: 'hidden',
            }}
          >
            {doc.page.borderFrame && (
              <div style={{ position: 'absolute', inset: '0.32in', border: '2px double rgba(90,80,60,.55)', pointerEvents: 'none', zIndex: 1 }} />
            )}
            {wm && (
              <div
                style={{
                  position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                  pointerEvents: 'none', zIndex: 1, overflow: 'hidden',
                }}
              >
                <div style={{
                  fontSize: 74, fontWeight: 800, letterSpacing: 8, color: 'rgba(0,0,0,.055)',
                  transform: 'rotate(-30deg)', whiteSpace: 'nowrap',
                }}>{wm}</div>
              </div>
            )}
            <div className="guide-layer">
              {guides.map((y, i) => (
                <div key={i} className="page-guide" style={{ top: y }} data-label={`${t('c.page')} ${i + 2}`} />
              ))}
            </div>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {settings.showKeyboardStrip && (
        <div className="key-strip" aria-label={t('ed.symbols')}>
          {KEY_STRIP.map((k) => (
            <button key={k} type="button" onClick={() => editor?.chain().focus().insertContent(k).run()}>{k}</button>
          ))}
        </div>
      )}

      <footer className="statusbar">
        <span className="status-item"><Icon name="page" size={13} /> {t('c.page')} <b>{guideCount}</b></span>
        <span className="status-item"><b>{counts.words}</b> {t('c.words')}</span>
        <span className="status-item"><b>{counts.chars}</b> {t('ed.chars')}</span>
        {counts.tokens > 0 && (
          <button
            type="button"
            className="status-item"
            style={{ color: 'var(--accent)' }}
            title={t('rib.fillFields')}
            onClick={p.onFillFields}
          >
            <Icon name="sparkle" size={13} /> <b>{counts.tokens}</b> {t('ed.fieldsPending')}
          </button>
        )}
        <span className="status-item"><Icon name="scales" size={13} /> {COURT_LABEL(doc.caseDetails, lang)}</span>
        <span className="spacer" />
        <span className="status-item">
          <Btn icon="minus" size="xs" title={t('rib.zoomOut')} onClick={() => setZoomManual(zoom - 0.1)} />
          <b style={{ minWidth: 38, textAlign: 'center' }}>{Math.round(zoom * 100)}%</b>
          <Btn icon="plus" size="xs" title={t('rib.zoomIn')} onClick={() => setZoomManual(zoom + 0.1)} />
          <Btn icon="fit" size="xs" title={t('rib.fitWidth')} onClick={() => setFitMode(true)} />
        </span>
        <span className="status-item">
          <Btn icon="keyboard" size="xs" title={t('rib.punctStrip')} onClick={() => p.onSettings({ showKeyboardStrip: !settings.showKeyboardStrip })} />
        </span>
      </footer>
    </div>
  )
}
