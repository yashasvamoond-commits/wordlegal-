import { useEffect, useState } from 'react'
import { geomOf, paginate, preloadImages, type TypeCSS } from '../lib/paginate'
import { exportPDF, saveOrShare } from '../lib/exporters'
import { toast } from '../lib/toast'
import { watermarkOf } from '../lib/watermark'
import type { PageSettings } from '../types'
import { Btn, Loading, Sheet } from './ui'
import { Icon } from './icons'

interface Props {
  open: boolean
  onClose: () => void
  html: string
  page: PageSettings
  css: TypeCSS
  title: string
  onExportClick?: () => void
}

export function PreviewSheet({ open, onClose, html, page, css, title, onExportClick }: Props) {
  const [pages, setPages] = useState<string[] | null>(null)
  const [scale, setScale] = useState(0.8)
  const [busy, setBusy] = useState(false)

  const geom = geomOf(page)
  const W = geom.pageW * 96
  const H = geom.pageH * 96
  const innerW = (geom.pageW - geom.ml - geom.mr) * 96
  const innerH = (geom.pageH - geom.mt - geom.mb) * 96

  useEffect(() => {
    if (!open) return
    setPages(null)
    setScale(Math.min(0.92, (window.innerWidth - 56) / W))
    let alive = true
    ;(async () => {
      try {
        await preloadImages(html)
        await new Promise((r) => setTimeout(r, 30))
        const out = paginate(html, geom, css)
        if (alive) setPages(out)
      } catch (e) {
        console.error(e)
        if (alive) setPages([html])
      }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, html, page, css])

  const doPdf = async () => {
    setBusy(true)
    try {
      const blob = await exportPDF(html, page, css, title)
      const res = await saveOrShare(blob, `${(title || 'wordlegal').replace(/[\\/:*?"<>|]+/g, '-')}.pdf`, 'application/pdf')
      toast(res === 'shared' ? 'PDF तैयार — शेयर शीट खुली' : 'PDF डाउनलोड हो गई', 'ok')
    } catch (e) {
      console.error(e)
      toast('PDF निर्माण विफल', 'err')
    } finally {
      setBusy(false)
    }
  }

  const wm = watermarkOf(page)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      wide
      tall
      title="प्रिंट पूर्वावलोकन"
      subtitle={`${pages?.length ?? 0} पृष्ठ · ${page.size.toUpperCase()} · ${page.orientation === 'landscape' ? 'भूमि' : 'खड़ा'}`}
      footer={
        <>
          <div style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Btn icon="zoomOut" size="sm" onClick={() => setScale((s) => Math.max(0.28, s - 0.1))} title="छोटा" />
            <span style={{ fontSize: 12, minWidth: 40, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <Btn icon="zoomIn" size="sm" onClick={() => setScale((s) => Math.min(1.6, s + 0.1))} title="बड़ा" />
          </div>
          {onExportClick && <Btn icon="settings" label="विकल्प" variant="ghost" onClick={onExportClick} />}
          <Btn icon="download" label={busy ? 'बन रहा है…' : 'PDF साझा करें'} variant="primary" onClick={doPdf} disabled={busy} />
        </>
      }
    >
      {!pages ? (
        <Loading label="पृष्ठ बन रहे हैं…" />
      ) : (
        <div className="preview-wrap" style={{ margin: -14, borderRadius: 0 }}>
          {pages.map((content, i) => (
            <div key={i} className="preview-page" style={{ width: W * scale, height: H * scale }}>
              <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                {(page.headerText && (i > 0 || page.firstPageHeader)) && (
                  <div style={{ position: 'absolute', left: geom.ml * 96, right: geom.mr * 96, top: 0.34 * 96, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4b5563', fontFamily: "'Noto Serif Devanagari', serif" }}>
                    <span>{page.headerText}</span>
                    <span>{page.pageNumbers && i > 0 ? `पृष्ठ ${i + 1}` : ''}</span>
                  </div>
                )}

                <div style={{ position: 'absolute', left: geom.ml * 96, top: geom.mt * 96, width: innerW, height: innerH, overflow: 'hidden' }}>
                  <div
                    className="doc-content"
                    style={{ fontFamily: css.fontFamily, fontSize: css.fontSize, lineHeight: css.lineHeight }}
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>

                {wm && (
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', overflow: 'hidden', pointerEvents: 'none' }}>
                    <div style={{ transform: 'rotate(-30deg)', fontSize: 66, fontWeight: 800, letterSpacing: 8, color: 'rgba(0,0,0,.055)', whiteSpace: 'nowrap' }}>{wm}</div>
                  </div>
                )}

                {page.borderFrame && (
                  <div style={{ position: 'absolute', inset: 0.32 * 96, border: '2px double rgba(90,80,60,.6)' }} />
                )}

                {page.lineNumbers && (
                  <div style={{ position: 'absolute', left: geom.ml * 96 - 30, top: geom.mt * 96, width: 24, textAlign: 'right', fontSize: 8, color: '#555', fontFamily: 'monospace', lineHeight: `${(parseFloat(css.lineHeight) * parseFloat(css.fontSize) * 96) / 72}px` }}>
                    {Array.from({ length: Math.floor(innerH / ((parseFloat(css.lineHeight) * parseFloat(css.fontSize) * 96) / 72)) }).map((_, n) => (
                      <div key={n}>{n + 1}</div>
                    ))}
                  </div>
                )}

                {(page.footerText || page.pageNumbers) && (
                  <div style={{ position: 'absolute', left: geom.ml * 96, right: geom.mr * 96, bottom: 0.3 * 96, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4b5563', fontFamily: "'Noto Serif Devanagari', serif" }}>
                    <span>{page.footerText}</span>
                    <span>{page.pageNumbers ? `पृष्ठ ${i + 1} / ${pages.length}` : ''}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {pages.length === 0 && <div style={{ color: '#cbd5e1', padding: 24 }}>दस्तावेज़ खाली है</div>}
        </div>
      )}
    </Sheet>
  )
}

export function PreviewHint() {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11.5, color: 'var(--muted-2)' }}>
      <Icon name="info" size={14} /> पूर्वावलोकन वही है जो PDF में जाएगा
    </div>
  )
}
