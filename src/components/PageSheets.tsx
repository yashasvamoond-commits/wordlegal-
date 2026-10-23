import { useEffect, useState } from 'react'
import { PAGE_SIZES } from '../data/courts'
import { DICT_STATS } from '../data/dictionary'
import { TEMPLATES } from '../data/templates'
import { MARGIN_PRESETS } from '../lib/pageHelpers'
import { exportDOCX, exportHTML, exportPDF, exportTXT, isNativeApp, saveOrShare, type ExportAction } from '../lib/exporters'
import type { TypeCSS } from '../lib/paginate'
import { toast } from '../lib/toast'
import type { PageSettings, PageSize } from '../types'
import type { Settings } from '../lib/storage'
import { Btn, Field, Sheet, Stat, SwitchRow } from './ui'
import { Icon } from './icons'
import { FONTS } from './Ribbon'

interface PageProps {
  open: boolean
  onClose: () => void
  page: PageSettings
  onChange: (p: Partial<PageSettings>) => void
  settings: Settings
  onSettings: (s: Partial<Settings>) => void
}

export function PageSetup({ open, onClose, page, onChange, settings, onSettings }: PageProps) {
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

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="पृष्ठ सेटिंग"
      subtitle="लीगल साइज़ एवं न्यायालयीन हाशिया"
      wide
      footer={<Btn variant="primary" label="तैयार" onClick={onClose} />}
    >
      <div className="row2">
        <Field label="पृष्ठ आकार">
          <select className="input" value={page.size} onChange={(e) => onChange({ size: e.target.value as PageSize })}>
            {Object.entries(PAGE_SIZES).map(([k, v]) => (
              <option key={k} value={k}>{v.hi}</option>
            ))}
          </select>
          <div className="hint">{PAGE_SIZES[page.size].note}</div>
        </Field>
        <Field label="अभिमुखता">
          <select className="input" value={page.orientation} onChange={(e) => onChange({ orientation: e.target.value as 'portrait' | 'landscape' })}>
            <option value="portrait">खड़ा (Portrait)</option>
            <option value="landscape">भूमि (Landscape)</option>
          </select>
        </Field>
      </div>

      <Field label="हाशिया प्रीसेट">
        <select
          className="input"
          onChange={(e) => {
            const p = MARGIN_PRESETS[Number(e.target.value)]
            if (p) onChange(p.v as Partial<PageSettings>)
          }}
          value={MARGIN_PRESETS.findIndex((m) => m.v.marginLeft === page.marginLeft && m.v.marginTop === page.marginTop)}
        >
          {MARGIN_PRESETS.map((m, i) => (
            <option key={m.label} value={i}>{m.label}</option>
          ))}
        </select>
      </Field>

      <div className="row2">
        {num('ऊपर (इंच)', 'marginTop')}
        {num('नीचे (इंच)', 'marginBottom')}
        {num('बायाँ (इंच)', 'marginLeft')}
        {num('दायाँ (इंच)', 'marginRight')}
      </div>

      <div className="section-title"><span>शीर्षक एवं पाद लेख</span><span className="line" /></div>
      <Field label="शीर्षक पाठ (Header)">
        <input className="input" value={page.headerText} onChange={(e) => onChange({ headerText: e.target.value })} placeholder="जैसे: आपराधिक प्रकरण संख्या 123/2025" />
      </Field>
      <Field label="पाद लेख (Footer)">
        <input className="input" value={page.footerText} onChange={(e) => onChange({ footerText: e.target.value })} placeholder="जैसे: प्रार्थी अधिवक्ता — श्री …" />
      </Field>

      <SwitchRow label="पृष्ठ संख्या" desc="प्रत्येक पृष्ठ पर 'पृष्ठ 1 / 8'" on={page.pageNumbers} onChange={(v) => onChange({ pageNumbers: v })} />
      <SwitchRow label="प्रथम पृष्ठ पर भी शीर्षक" on={page.firstPageHeader} onChange={(v) => onChange({ firstPageHeader: v })} />
      <SwitchRow label="पंक्ति क्रमांक" desc="बाएँ हाशिये में पंक्ति संख्या (न्यायालयीन प्रथा)" on={page.lineNumbers} onChange={(v) => onChange({ lineNumbers: v })} />
      <SwitchRow label="सीमा रेखा (Frame)" on={page.borderFrame} onChange={(v) => onChange({ borderFrame: v })} />
      <SwitchRow label="संपादक में पृष्ठ गाइड" on={page.showGuides} onChange={(v) => onChange({ showGuides: v })} />

      <div className="section-title"><span>वॉटरमार्क</span><span className="line" /></div>
      <div className="row2">
        <Field label="प्रकार">
          <select className="input" value={page.watermark} onChange={(e) => onChange({ watermark: e.target.value as PageSettings['watermark'] })}>
            <option value="none">कोई नहीं</option>
            <option value="DRAFT">DRAFT</option>
            <option value="अंतिम प्रारूप">अंतिम प्रारूप</option>
            <option value="कॉपी">कॉपी</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="custom">अपना पाठ</option>
          </select>
        </Field>
        {page.watermark === 'custom' && (
          <Field label="वॉटरमार्क पाठ">
            <input className="input" value={page.watermarkText} onChange={(e) => onChange({ watermarkText: e.target.value })} placeholder="जैसे: केवल कार्यालय उपयोग हेतु" />
          </Field>
        )}
      </div>

      <div className="section-title"><span>दस्तावेज़ का डिफ़ॉल्ट फ़ॉन्ट</span><span className="line" /></div>
      <div className="row3">
        <Field label="फ़ॉन्ट">
          <select className="input" value={settings.docFont} onChange={(e) => onSettings({ docFont: e.target.value })}>
            {FONTS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="आकार">
          <select className="input" value={settings.docSize} onChange={(e) => onSettings({ docSize: e.target.value })}>
            {['10pt', '11pt', '12pt', '13pt', '14pt', '16pt'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="पंक्ति अंतर">
          <select className="input" value={settings.docLh} onChange={(e) => onSettings({ docLh: e.target.value })}>
            {['1', '1.15', '1.35', '1.5', '1.75', '2'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
    </Sheet>
  )
}

/* -------------------------------- निर्यात ------------------------- */
interface ExportProps {
  open: boolean
  onClose: () => void
  html: string
  page: PageSettings
  css: TypeCSS
  title: string
}

export function ExportSheet({ open, onClose, html, page, css, title }: ExportProps) {
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
        res === 'shared' ? 'फ़ाइल तैयार — शेयर शीट खुल गई'
          : res === 'saved' ? 'फ़ाइल सहेज दी गई'
            : 'फ़ाइल डाउनलोड हो गई',
        'ok',
      )
      onClose()
    } catch (e) {
      console.error(e)
      toast('निर्यात विफल — पुनः प्रयास करें', 'err')
    } finally {
      setBusy(null)
    }
  }

  const Row = ({ icon, title: t, desc, kind, badge }: { icon: string; title: string; desc: string; kind: 'pdf' | 'docx' | 'html' | 'txt'; badge?: string }) => (
    <div className="check-item">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--accent)' }}><Icon name={icon} size={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{t} {badge && <span className="tag-mini">{badge}</span>}</div>
          <div className="ctx" style={{ margin: '2px 0 0' }}>{desc}</div>
        </div>
      </div>
      <div className="acts" style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {native ? (
          <>
            <Btn size="xs" variant="ghost" icon="download" label="डिवाइस में सहेजें" onClick={() => doExport(kind, 'save')} disabled={!!busy} />
            <Btn size="xs" variant="ghost" icon="share" label="साझा करें" onClick={() => doExport(kind, 'share')} disabled={!!busy} />
          </>
        ) : (
          <Btn size="xs" variant="ghost" icon="download" label="डाउनलोड" onClick={() => doExport(kind, 'download')} disabled={!!busy} />
        )}
        {busy === kind && <span style={{ fontSize: 11, color: 'var(--accent)', alignSelf: 'center' }}>बन रहा है…</span>}
      </div>
    </div>
  )

  return (
    <Sheet open={open} onClose={onClose} title="निर्यात एवं साझा" subtitle="न्यायालय में जमा करने योग्य फ़ाइल बनाएँ" tall>
      <Field label="फ़ाइल का नाम">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Row icon="fileText" kind="pdf" title="PDF" badge={`${page.size.toUpperCase()} · ${page.orientation === 'landscape' ? 'भूमि' : 'खड़ा'}`} desc="पिक्सेल-सटीक पृष्ठ, हाशिया एवं पृष्ठ संख्या सहित — प्रिंट/ई-फाइलिंग हेतु" />
        <Row icon="doc" kind="docx" title="Word (DOCX)" desc="MS Word में खुलने योग्य, संपादन योग्य फ़ाइल — लीगल पेज साइज़ सहित" />
        <Row icon="page" kind="html" title="HTML" desc="वेब/ईमेल हेतु, प्रिंट-तैयार पृष्ठ शैली" />
        <Row icon="type" kind="txt" title="सादा पाठ (TXT)" desc="केवल पाठ — त्वरित प्रतिलिपि हेतु" />
      </div>
      <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--muted-2)', lineHeight: 1.55 }}>
        APK में फ़ाइल बनने के बाद Android की शेयर शीट खुलती है — वहाँ से WhatsApp, ईमेल, Drive या
        “फ़ाइल में सहेजें” चुनें। PDF का आकार ठीक {page.size === 'legal' ? '8.5 × 14 इंच (लीगल)' : 'चयनित पृष्ठ आकार'} ही रहेगा।
      </div>
    </Sheet>
  )
}

/* -------------------------------- सेटिंग्स ----------------------- */
interface SettingsProps {
  open: boolean
  onClose: () => void
  settings: Settings
  onSettings: (s: Partial<Settings>) => void
  onClearAll: () => void
}

export function SettingsSheet({ open, onClose, settings, onSettings, onClearAll }: SettingsProps) {
  return (
    <Sheet open={open} onClose={onClose} title="सेटिंग्स" subtitle="वर्डलीगल 1.0.0" footer={<Btn variant="primary" label="बंद करें" onClick={onClose} />}>
      <div className="section-title" style={{ marginTop: 0 }}><span>रूप-रंग</span><span className="line" /></div>
      <Field label="थीम">
        <select className="input" value={settings.theme} onChange={(e) => onSettings({ theme: e.target.value as 'dark' | 'light' })}>
          <option value="dark">गहरा (Dark)</option>
          <option value="light">हल्का (Light)</option>
        </select>
      </Field>
      <div className="row2">
        <Field label="डिफ़ॉल्ट फ़ॉन्ट">
          <select className="input" value={settings.docFont} onChange={(e) => onSettings({ docFont: e.target.value })}>
            {FONTS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="डिफ़ॉल्ट आकार">
          <select className="input" value={settings.docSize} onChange={(e) => onSettings({ docSize: e.target.value })}>
            {['10pt', '11pt', '12pt', '13pt', '14pt', '16pt'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div className="section-title"><span>संपादन</span><span className="line" /></div>
      <SwitchRow label="विधिक चिह्न पट्टी" desc="कीबोर्ड के ऊपर । ॥ ₹ § — जैसे चिह्न" on={settings.showKeyboardStrip} onChange={(v) => onSettings({ showKeyboardStrip: v })} />
      <SwitchRow label="केस फ़ील्ड स्वतः भरें" desc="केस विवरण में परिवर्तन पर {{फ़ील्ड}} अपडेट" on={settings.autoFill} onChange={(v) => onSettings({ autoFill: v })} />

      <div className="section-title"><span>संग्रह</span><span className="line" /></div>
      <div className="row3">
        <Stat label="प्रारूप" value={TEMPLATES.length} />
        <Stat label="शब्दकोश" value={DICT_STATS.total} />
        <Stat label="भाषा" value="हिन्दी" />
      </div>
      <div style={{ marginTop: 16 }}>
        <Btn wide variant="danger" icon="trash" label="सारा डेटा मिटाएँ (सभी दस्तावेज़)" onClick={() => {
          if (confirm('सभी दस्तावेज़ एवं सेटिंग्स स्थायी रूप से मिट जाएँगे। क्या आप निश्चित हैं?')) onClearAll()
        }} />
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted-2)' }}>
        सारा डेटा आपके डिवाइस पर ही संग्रहित होता है। कोई क्लाउड/सर्वर उपयोग नहीं होता।
      </div>
    </Sheet>
  )
}

/* --------------------------------- परिचय ------------------------ */
export function AboutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="वर्डलीगल के बारे में" subtitle="हिन्दी विधिक मसौदा स्टूडियो — संस्करण 1.0.0"
      footer={<Btn variant="primary" label="बंद करें" onClick={onClose} />}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <div className="brand-mark" style={{ width: 46, height: 46, fontSize: 22 }}>व</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>वर्डलीगल — WordLegal</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>भारतीय अधीनस्थ न्यायालयों हेतु हिन्दी मसौदा-स्टूडियो</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>
        वर्डलीगल एक पूर्ण हिन्दी विधिक लेखन-अनुप्रयोग है — लीगल पेपर (8.5 × 14 इंच) पर न्यायालय में
        प्रस्तुत करने योग्य मसौदे बनाने, विधिक शब्दावली खोजने तथा PDF/DOCX निर्यात करने हेतु।
      </p>
      <div className="dict-detail">
        <div className="block">
          <h5>प्रमुख विशेषताएँ</h5>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.2, lineHeight: 1.8 }}>
            <li>लीगल साइज़ पर पिक्सेल-सटीक पृष्ठ एवं वास्तविक पृष्ठ-विभाजन</li>
            <li>रिबन आधारित संपूर्ण वर्ड-प्रोसेसर — फ़ॉन्ट, रंग, संरेखण, सूची, तालिका, चित्र</li>
            <li>विधिक ब्लॉक शैलियाँ — न्यायालय शीर्षक, पक्षकार, प्रार्थना, सत्यापन, हस्ताक्षर</li>
            <li>{TEMPLATES.length} न्यायालयीन प्रारूप — ज़मानत, परिवाद, स्थगन, साक्ष्य, अपील, दस्तावेज़</li>
            <li>{DICT_STATS.total} शब्दों का विधिक शब्दकोश — अर्थ, प्रयोग एवं दुर्लभ/लैटिन सूत्र</li>
            <li>भाषा-शोधन — अनौपचारिक शब्दों को विधिक पारिभाषिक शब्दों में बदलने के सुझाव</li>
            <li>धारा मैपिंग — IPC → BNS, CrPC → BNSS, साक्ष्य अधिनियम → BSA</li>
            <li>PDF / DOCX / HTML / TXT निर्यात एवं Android शेयर</li>
          </ul>
        </div>
        <div className="block">
          <h5>महत्वपूर्ण सूचना</h5>
          <p style={{ fontSize: 12.6 }}>
            यह अनुप्रयोग मसौदा-सहायता हेतु है, विधिक परामर्श नहीं। किसी भी मसौदे को न्यायालय में
            प्रस्तुत करने से पूर्व तथ्यों, लागू धाराओं (01.07.2024 से बी.एन.एस./बी.एन.एस.एस./बी.एस.ए.)
            एवं संलग्नकों का मिलान योग्य अधिवक्ता द्वारा अवश्य कराएँ।
          </p>
        </div>
        <div className="block">
          <h5>तकनीकी</h5>
          <p style={{ fontSize: 12.6 }}>
            Android (Capacitor) · React + TypeScript · TipTap संपादक · स्थानीय भंडारण · पूर्णतः ऑफ़लाइन।
            योग टैब प्लस 2026 एवं नवीनतम Android हेतु अनुकूलित (Android 10+)।
          </p>
        </div>
      </div>
    </Sheet>
  )
}
