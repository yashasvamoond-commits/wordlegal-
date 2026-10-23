import { useEffect, useState } from 'react'
import { PAGE_SIZES } from '../data/courts'
import { DICT_STATS } from '../data/dictionary'
import { TEMPLATES } from '../data/templates'
import { MARGIN_PRESETS } from '../lib/pageHelpers'
import { exportDOCX, exportHTML, exportPDF, exportTXT, isNativeApp, saveOrShare, type ExportAction } from '../lib/exporters'
import type { TypeCSS } from '../lib/paginate'
import { toast } from '../lib/toast'
import { useT } from '../lib/useT'
import type { PageSettings, PageSize } from '../types'
import type { Settings } from '../lib/storage'
import { Btn, Field, Sheet, Stat, SwitchRow } from './ui'
import { Icon } from './icons'
import { FONTS } from './Ribbon'
import type { StrKey } from '../i18n'

interface PageProps {
  open: boolean
  onClose: () => void
  page: PageSettings
  onChange: (p: Partial<PageSettings>) => void
  settings: Settings
  onSettings: (s: Partial<Settings>) => void
}

const PRESET_KEYS: StrKey[] = [
  'pg.preset.court', 'pg.preset.normal', 'pg.preset.wide', 'pg.preset.narrow', 'pg.preset.filing',
]
const SIZE_KEYS: Record<string, { name: StrKey; note: StrKey }> = {
  legal: { name: 'pg.size.legal', note: 'pg.size.legalNote' },
  legal13: { name: 'pg.size.legal13', note: 'pg.size.legal13Note' },
  a4: { name: 'pg.size.a4', note: 'pg.size.a4Note' },
  letter: { name: 'pg.size.letter', note: 'pg.size.letterNote' },
}

export function PageSetup({ open, onClose, page, onChange, settings, onSettings }: PageProps) {
  const { t } = useT()
  const num = (label: string, key: keyof PageSettings) => (
    <Field label={label}>
      <input
        className="num-input"
        type="number"
        step={0.05}
        min={0.2}
        max={3}
        value={Number(page[key])}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!Number.isNaN(v)) onChange({ [key]: v } as Partial<PageSettings>)
        }}
      />
    </Field>
  )

  const sizeKey = SIZE_KEYS[page.size] ?? SIZE_KEYS.legal

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('pg.title')}
      subtitle={t('pg.sub')}
      wide
      footer={<Btn variant="primary" label={t('c.done')} onClick={onClose} />}
    >
      <div className="row2">
        <Field label={t('pg.size')}>
          <select className="input" value={page.size} onChange={(e) => onChange({ size: e.target.value as PageSize })}>
            {Object.keys(PAGE_SIZES).map((k) => (
              <option key={k} value={k}>{t(SIZE_KEYS[k]?.name ?? 'pg.size.legal')}</option>
            ))}
          </select>
          <div className="hint">{t(sizeKey.note)}</div>
        </Field>
        <Field label={t('pg.orientation')}>
          <select className="input" value={page.orientation} onChange={(e) => onChange({ orientation: e.target.value as 'portrait' | 'landscape' })}>
            <option value="portrait">{t('pg.portrait')}</option>
            <option value="landscape">{t('pg.landscape')}</option>
          </select>
        </Field>
      </div>

      <Field label={t('pg.marginPreset')}>
        <select
          className="input"
          onChange={(e) => {
            const p = MARGIN_PRESETS[Number(e.target.value)]
            if (p) onChange(p.v as Partial<PageSettings>)
          }}
          value={MARGIN_PRESETS.findIndex((m) => m.v.marginLeft === page.marginLeft && m.v.marginTop === page.marginTop)}
        >
          {MARGIN_PRESETS.map((m, i) => (
            <option key={m.label} value={i}>{PRESET_KEYS[i] ? t(PRESET_KEYS[i]) : m.label}</option>
          ))}
        </select>
      </Field>

      <div className="row2">
        {num(t('pg.top'), 'marginTop')}
        {num(t('pg.bottom'), 'marginBottom')}
        {num(t('pg.left'), 'marginLeft')}
        {num(t('pg.right'), 'marginRight')}
      </div>

      <div className="section-title"><span>{t('pg.headerFooterSection')}</span><span className="line" /></div>
      <Field label={t('pg.headerText')}>
        <input className="input" value={page.headerText} onChange={(e) => onChange({ headerText: e.target.value })} placeholder={t('pg.headerHint')} />
      </Field>
      <Field label={t('pg.footerText')}>
        <input className="input" value={page.footerText} onChange={(e) => onChange({ footerText: e.target.value })} placeholder={t('pg.footerHint')} />
      </Field>

      <SwitchRow label={t('pg.pageNumbers')} desc={t('pg.pageNumbersDesc')} on={page.pageNumbers} onChange={(v) => onChange({ pageNumbers: v })} />
      <SwitchRow label={t('pg.firstHeader')} on={page.firstPageHeader} onChange={(v) => onChange({ firstPageHeader: v })} />
      <SwitchRow label={t('pg.lineNumbers')} desc={t('pg.lineNumbersDesc')} on={page.lineNumbers} onChange={(v) => onChange({ lineNumbers: v })} />
      <SwitchRow label={t('pg.frame')} on={page.borderFrame} onChange={(v) => onChange({ borderFrame: v })} />
      <SwitchRow label={t('pg.guides')} on={page.showGuides} onChange={(v) => onChange({ showGuides: v })} />

      <div className="section-title"><span>{t('pg.watermark')}</span><span className="line" /></div>
      <div className="row2">
        <Field label={t('pg.type')}>
          <select className="input" value={page.watermark} onChange={(e) => onChange({ watermark: e.target.value as PageSettings['watermark'] })}>
            <option value="none">{t('pg.wm.none')}</option>
            <option value="DRAFT">DRAFT</option>
            <option value="अंतिम प्रारूप">{t('pg.wm.final')}</option>
            <option value="कॉपी">{t('pg.wm.copy')}</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="custom">{t('pg.wm.custom')}</option>
          </select>
        </Field>
        {page.watermark === 'custom' && (
          <Field label={t('pg.customWatermark')}>
            <input className="input" value={page.watermarkText} onChange={(e) => onChange({ watermarkText: e.target.value })} placeholder={t('pg.customWatermarkHint')} />
          </Field>
        )}
      </div>

      <div className="section-title"><span>{t('pg.defaultFont')}</span><span className="line" /></div>
      <div className="row3">
        <Field label={t('pg.font')}>
          <select className="input" value={settings.docFont} onChange={(e) => onSettings({ docFont: e.target.value })}>
            {FONTS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
          </select>
        </Field>
        <Field label={t('pg.fontSize')}>
          <select className="input" value={settings.docSize} onChange={(e) => onSettings({ docSize: e.target.value })}>
            {['10pt', '11pt', '12pt', '13pt', '14pt', '16pt'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label={t('pg.lineHeight')}>
          <select className="input" value={settings.docLh} onChange={(e) => onSettings({ docLh: e.target.value })}>
            {['1', '1.15', '1.35', '1.5', '1.75', '2'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
    </Sheet>
  )
}

/* -------------------------------- export ------------------------- */
interface ExportProps {
  open: boolean
  onClose: () => void
  html: string
  page: PageSettings
  css: TypeCSS
  title: string
}

export function ExportSheet({ open, onClose, html, page, css, title }: ExportProps) {
  const { t } = useT()
  const [busy, setBusy] = useState<null | 'pdf' | 'docx' | 'html' | 'txt'>(null)
  const [native, setNative] = useState(false)
  useEffect(() => { isNativeApp().then(setNative).catch(() => setNative(false)) }, [])
  const [name, setName] = useState(title || 'विधिक-मसौदा')

  const doExport = async (kind: 'pdf' | 'docx' | 'html' | 'txt', action: ExportAction = native ? 'share' : 'download') => {
    setBusy(kind)
    const filenameBase = (name.trim() || 'wordlegal').replace(/[\\/:*?"<>|]+/g, '-')
    try {
      let blob: Blob
      let ext = kind
      let mime = ''
      if (kind === 'pdf') {
        blob = await exportPDF(html, page, css, filenameBase)
        mime = 'application/pdf'
      } else if (kind === 'docx') {
        blob = await exportDOCX(html, page, filenameBase, css)
        mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      } else if (kind === 'html') {
        blob = exportHTML(html, page, filenameBase, css)
        mime = 'text/html'
      } else {
        blob = exportTXT(html)
        mime = 'text/plain'
        ext = 'txt' as typeof kind
      }
      const res = await saveOrShare(blob, `${filenameBase}.${ext}`, mime, action)
      toast(
        res === 'shared' ? t('ex.shared')
          : res === 'saved' ? t('ex.saved')
            : t('ex.downloaded'),
        'ok',
      )
      onClose()
    } catch (e) {
      console.error(e)
      toast(t('ex.failed'), 'err')
    } finally {
      setBusy(null)
    }
  }

  const Row = ({ icon, title: rt, desc, kind, badge }: { icon: string; title: string; desc: string; kind: 'pdf' | 'docx' | 'html' | 'txt'; badge?: string }) => (
    <div className="check-item">
      <button
        type="button"
        onClick={() => doExport(kind, native ? 'share' : 'download')}
        disabled={!!busy}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left' }}
      >
        <span style={{ color: 'var(--accent)' }}><Icon name={icon} size={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{rt} {badge && <span className="tag-mini">{badge}</span>}</div>
          <div className="ctx" style={{ margin: '2px 0 0' }}>{desc}</div>
        </div>
      </button>
      <div className="acts" style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {native ? (
          <>
            <Btn size="xs" variant="ghost" icon="download" label={t('ex.saveToDevice')} onClick={() => doExport(kind, 'save')} disabled={!!busy} />
            <Btn size="xs" variant="ghost" icon="share" label={t('ex.share')} onClick={() => doExport(kind, 'share')} disabled={!!busy} />
          </>
        ) : (
          <Btn size="xs" variant="ghost" icon="download" label={t('ex.download')} onClick={() => doExport(kind, 'download')} disabled={!!busy} />
        )}
        {busy === kind && <span style={{ fontSize: 11, color: 'var(--accent)', alignSelf: 'center' }}>{t('ex.building')}</span>}
      </div>
    </div>
  )

  const sizeLabel = page.size === 'legal'
    ? t('ex.sizeLegal')
    : t('ex.sizeOther')

  return (
    <Sheet open={open} onClose={onClose} title={t('ex.title')} subtitle={t('ex.sub')} tall>
      <Field label={t('ex.fileName')}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Row
          icon="fileText"
          kind="pdf"
          title={t('ex.pdf')}
          badge={`${page.size.toUpperCase()} · ${page.orientation === 'landscape' ? t('pg.landscape') : t('pg.portrait')}`}
          desc={t('ex.pdfDesc')}
        />
        <Row icon="doc" kind="docx" title={t('ex.docx')} desc={t('ex.docxDesc')} />
        <Row icon="page" kind="html" title={t('ex.html')} desc={t('ex.htmlDesc')} />
        <Row icon="type" kind="txt" title={t('ex.txt')} desc={t('ex.txtDesc')} />
      </div>
      <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--muted-2)', lineHeight: 1.55 }}>
        {t('ex.note', { size: sizeLabel })}
      </div>
    </Sheet>
  )
}

/* ------------------------------- settings ------------------------ */
interface SettingsProps {
  open: boolean
  onClose: () => void
  settings: Settings
  onSettings: (s: Partial<Settings>) => void
  onClearAll: () => void
}

export function SettingsSheet({ open, onClose, settings, onSettings, onClearAll }: SettingsProps) {
  const { t, lang, setLang } = useT()
  return (
    <Sheet open={open} onClose={onClose} title={t('set.title')} subtitle="WordLegal 1.0.0" footer={<Btn variant="primary" label={t('c.close')} onClick={onClose} />}>
      <div className="section-title" style={{ marginTop: 0 }}><span>{t('set.appearance')}</span><span className="line" /></div>
      <Field label={t('set.theme')}>
        <select className="input" value={settings.theme} onChange={(e) => onSettings({ theme: e.target.value as 'dark' | 'light' })}>
          <option value="dark">{t('set.dark')}</option>
          <option value="light">{t('set.light')}</option>
        </select>
      </Field>
      <Field label={t('set.language')} hint={t('set.langDesc')}>
        <select
          className="input"
          value={lang}
          onChange={(e) => {
            const next = e.target.value as 'en' | 'hi'
            setLang(next)
            onSettings({ lang: next })
          }}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
        </select>
      </Field>
      <div className="row2">
        <Field label={t('set.defaultFont')}>
          <select className="input" value={settings.docFont} onChange={(e) => onSettings({ docFont: e.target.value })}>
            {FONTS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
          </select>
        </Field>
        <Field label={t('set.defaultSize')}>
          <select className="input" value={settings.docSize} onChange={(e) => onSettings({ docSize: e.target.value })}>
            {['10pt', '11pt', '12pt', '13pt', '14pt', '16pt'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div className="section-title"><span>{t('set.editing')}</span><span className="line" /></div>
      <SwitchRow label={t('set.symbolStrip')} desc={t('set.symbolStripDesc')} on={settings.showKeyboardStrip} onChange={(v) => onSettings({ showKeyboardStrip: v })} />
      <SwitchRow label={t('set.autoFill')} desc={t('set.autoFillDesc')} on={settings.autoFill} onChange={(v) => onSettings({ autoFill: v })} />

      <div className="section-title"><span>{t('set.data')}</span><span className="line" /></div>
      <div className="row3">
        <Stat label={t('set.templates')} value={TEMPLATES.length} />
        <Stat label={t('set.dictionary')} value={DICT_STATS.total} />
        <Stat label={t('set.languageStat')} value={lang === 'en' ? 'English' : 'हिन्दी'} />
      </div>
      <div style={{ marginTop: 16 }}>
        <Btn wide variant="danger" icon="trash" label={t('set.clearAll')} onClick={() => {
          if (confirm(t('set.clearConfirm'))) onClearAll()
        }} />
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted-2)' }}>
        {t('set.privacy')}
      </div>
    </Sheet>
  )
}

/* --------------------------------- about ------------------------- */
export function AboutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT()
  return (
    <Sheet open={open} onClose={onClose} title={t('ab.title')} subtitle={t('ab.sub')}
      footer={<Btn variant="primary" label={t('c.close')} onClick={onClose} />}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <div className="brand-mark" style={{ width: 46, height: 46, fontSize: 22 }}>व</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>WordLegal — वर्डलीगल</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t('ab.brandSub')}</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>
        {t('ab.desc')}
      </p>
      <div className="dict-detail">
        <div className="block">
          <h5>{t('ab.features')}</h5>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.2, lineHeight: 1.8 }}>
            <li>{t('ab.f1')}</li>
            <li>{t('ab.f2')}</li>
            <li>{t('ab.f3')}</li>
            <li>{t('ab.f4', { n: TEMPLATES.length })}</li>
            <li>{t('ab.f5', { n: DICT_STATS.total })}</li>
            <li>{t('ab.f6')}</li>
            <li>{t('ab.f7')}</li>
            <li>{t('ab.f8')}</li>
            <li>{t('ab.f9')}</li>
          </ul>
        </div>
        <div className="block">
          <h5>{t('ab.notice')}</h5>
          <p style={{ fontSize: 12.6 }}>{t('ab.noticeText')}</p>
        </div>
        <div className="block">
          <h5>{t('ab.tech')}</h5>
          <p style={{ fontSize: 12.6 }}>{t('ab.techText')}</p>
        </div>
      </div>
    </Sheet>
  )
}
