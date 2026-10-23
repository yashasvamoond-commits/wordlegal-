/* ------------------------------------------------------------------
   निर्यात — PDF (पिक्सेल-सटीक लीगल पृष्ठ), DOCX, HTML, TXT, साझा करें
   ------------------------------------------------------------------ */
import { geomOf, preloadImages, renderPages, pageDimsLocal, DEFAULT_TYPECSS, type TypeCSS } from './paginate'
import { htmlToText } from './storage'
import type { CaseDetails, PageSettings } from '../types'

const MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  html: 'text/html',
  txt: 'text/plain;charset=utf-8',
}

/* ------------------------------- helpers ------------------------- */
function safeName(name: string) {
  return (name || 'wordlegal-document').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80)
}

export async function isNativeApp(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result).split(',')[1] ?? '')
    fr.onerror = () => reject(fr.error)
    fr.readAsDataURL(blob)
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
    a.remove()
  }, 1500)
}

interface NativeBridge {
  share(opts: { data: string; fileName: string; mimeType: string }): Promise<unknown>
  save(opts: { data: string; fileName: string; mimeType: string }): Promise<unknown>
}

let nativeExport: NativeBridge | null = null

async function getNativeBridge(): Promise<NativeBridge | null> {
  if (nativeExport) return nativeExport
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return null
    nativeExport = registerPlugin<NativeBridge>('WordExport')
    return nativeExport
  } catch {
    return null
  }
}

export type ExportAction = 'share' | 'save' | 'download'

/** APK में: डिवाइस में सहेजें (SAF) अथवा Android शेयर शीट */
export async function saveOrShare(
  blob: Blob,
  filename: string,
  mime: string,
  action: ExportAction = 'share',
): Promise<'shared' | 'saved' | 'downloaded'> {
  const bridge = await getNativeBridge()
  if (bridge) {
    const data = await blobToBase64(blob)
    if (action === 'save') {
      await bridge.save({ data, fileName: filename, mimeType: mime })
      return 'saved'
    }
    if (action === 'share') {
      await bridge.share({ data, fileName: filename, mimeType: mime })
      return 'shared'
    }
  }
  if (await isNativeApp()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const { Share } = await import('@capacitor/share')
      const base64 = await blobToBase64(blob)
      const res = await Filesystem.writeFile({
        path: `WordLegal/${filename}`,
        data: base64,
        directory: Directory.Cache,
        recursive: true,
      })
      await Share.share({
        title: filename,
        text: 'वर्डलीगल — हिन्दी विधिक मसौदा',
        url: res.uri,
        dialogTitle: 'साझा करें',
      })
      return 'shared'
    } catch (e) {
      console.warn('native filesystem share failed, falling back to web download', e)
    }
  }
  downloadBlob(blob, filename)
  return 'downloaded'
}

/* -------------------------------- PDF ---------------------------- */
export async function exportPDF(
  html: string,
  page: PageSettings,
  css: TypeCSS = DEFAULT_TYPECSS,
  name = 'document',
): Promise<Blob> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  await preloadImages(html)

  const host = document.createElement('div')
  host.style.cssText =
    'position:fixed;left:-100000px;top:0;z-index:-1;background:#fff;pointer-events:none;'
  document.body.appendChild(host)

  const pages = renderPages(html, { page, css })
  pages.forEach((p) => host.appendChild(p))

  const dims = pageDimsLocal(page)
  const pdf = new jsPDF({
    unit: 'in',
    format: [dims.w, dims.h],
    orientation: dims.w > dims.h ? 'landscape' : 'portrait',
    compress: true,
  })

  try {
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        backgroundColor: '#fffdf8',
        useCORS: true,
        logging: false,
        windowWidth: Math.round(dims.w * 96),
        windowHeight: Math.round(dims.h * 96),
      })
      const img = canvas.toDataURL('image/jpeg', 0.94)
      if (i > 0) pdf.addPage([dims.w, dims.h], dims.w > dims.h ? 'landscape' : 'portrait')
      pdf.addImage(img, 'JPEG', 0, 0, dims.w, dims.h, undefined, 'FAST')
    }
    pdf.setProperties({ title: name, creator: 'WordLegal', subject: 'हिन्दी विधिक मसौदा' })
    return pdf.output('blob')
  } finally {
    host.remove()
  }
}

/* -------------------------------- DOCX --------------------------- */
type DocxNS = typeof import('docx')

const PT_TO_HALF = 2

function colorOf(el: HTMLElement): string | undefined {
  const c = el.style?.color
  if (!c) return undefined
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) {
    const hex = [1, 2, 3]
      .map((i) => Number(m[i]).toString(16).padStart(2, '0'))
      .join('')
    return hex.toUpperCase()
  }
  if (c.startsWith('#')) return c.slice(1).toUpperCase()
  return undefined
}

function alignOf(el: HTMLElement, D: DocxNS) {
  const t = (el.style?.textAlign || '').toLowerCase()
  const cls = el.className || ''
  if (t === 'center' || /doc-court|doc-party|doc-prayer|doc-center/.test(cls)) return D.AlignmentType.CENTER
  if (t === 'right' || /doc-caseno|doc-sign|doc-right/.test(cls)) return D.AlignmentType.RIGHT
  if (t === 'justify' || /doc-body|doc-verify|doc-note/.test(cls)) return D.AlignmentType.JUSTIFIED
  return D.AlignmentType.LEFT
}

function runsOf(node: Node, D: DocxNS, base: { bold?: boolean; italics?: boolean; underline?: boolean; strike?: boolean; size?: number; color?: string; font?: string } = {}): InstanceType<DocxNS['TextRun']>[] {
  const out: InstanceType<DocxNS['TextRun']>[] = []
  const walk = (n: Node, st: typeof base) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const text = n.nodeValue ?? ''
      if (!text) return
      out.push(
        new D.TextRun({
          text,
          bold: st.bold,
          italics: st.italics,
          underline: st.underline ? {} : undefined,
          strike: st.strike,
          size: st.size,
          color: st.color,
          font: st.font,
        }),
      )
      return
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return
    const el = n as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (tag === 'br') {
      out.push(new D.TextRun({ break: 1 }))
      return
    }
    const next = { ...st }
    if (tag === 'strong' || tag === 'b') next.bold = true
    if (tag === 'em' || tag === 'i') next.italics = true
    if (tag === 'u') next.underline = true
    if (tag === 's' || tag === 'strike' || tag === 'del') next.strike = true
    const fs = el.style?.fontSize
    if (fs && fs.endsWith('pt')) next.size = Math.round(parseFloat(fs) * PT_TO_HALF)
    if (fs && fs.endsWith('em')) next.size = Math.round((st.size ?? 24) * parseFloat(fs))
    const col = colorOf(el)
    if (col) next.color = col
    const ff = el.style?.fontFamily
    if (ff) next.font = ff.replace(/["']/g, '').split(',')[0].trim()
    el.childNodes.forEach((c) => walk(c, next))
  }
  node.childNodes.forEach((c) => walk(c, base))
  if (!out.length) out.push(new D.TextRun({ text: '' }))
  return out
}

function tableOf(el: HTMLElement, D: DocxNS) {
  const rows = Array.from(el.querySelectorAll('tr'))
  const maxCols = rows.reduce((m, r) => Math.max(m, r.children.length), 1)
  return new D.Table({
    width: { size: 100, type: D.WidthType.PERCENTAGE },
    rows: rows.map(
      (r) =>
        new D.TableRow({
          children: Array.from(r.children).map((cell) => {
            const c = cell as HTMLElement
            return new D.TableCell({
              children: [
                new D.Paragraph({
                  children: runsOf(c, D, { bold: c.tagName === 'TH', size: 22 }),
                }),
              ],
            })
          }),
          tableHeader: r.children[0]?.tagName === 'TH',
        }),
    ),
  })
}

export async function exportDOCX(
  html: string,
  page: PageSettings,
  title = 'विधिक मसौदा',
  css: TypeCSS = DEFAULT_TYPECSS,
): Promise<Blob> {
  const D = await import('docx')
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, Footer, Header, PageNumber,
    HeadingLevel, BorderStyle, convertInchesToTwip,
  } = D

  const dims = pageDimsLocal(page)
  const src = document.createElement('div')
  src.className = 'doc-content'
  src.innerHTML = html

  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof D.Table>)[] = []

  const fontDefault = css.fontFamily.replace(/["']/g, '').split(',')[0].trim() || 'Noto Serif Devanagari'
  const baseSize = Math.round(parseFloat(css.fontSize) * 2)

  const blockStyle = (el: HTMLElement) => ({
    alignment: alignOf(el, D),
    spacing: { after: 110, line: Math.round(240 * parseFloat(css.lineHeight)) },
    indent: el.style?.marginLeft ? { left: convertInchesToTwip(parseFloat(el.style.marginLeft) / 96) } : undefined,
  })

  const walkBlock = (el: HTMLElement) => {
    const tag = el.tagName.toLowerCase()
    if (tag === 'table') {
      children.push(tableOf(el, D))
      children.push(new Paragraph({ text: '' }))
      return
    }
    if (tag === 'ul' || tag === 'ol') {
      let i = 1
      Array.from(el.children).forEach((li) => {
        const prefix = tag === 'ol' ? `${i++}. ` : '• '
        children.push(
          new Paragraph({
            children: [new TextRun({ text: prefix, bold: false }), ...runsOf(li, D, { size: baseSize, font: fontDefault })],
            spacing: { after: 60, line: Math.round(240 * parseFloat(css.lineHeight)) },
            indent: { left: 360 },
          }),
        )
      })
      return
    }
    if (tag === 'hr') {
      children.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' } },
          text: '',
        }),
      )
      return
    }
    if (tag === 'img') {
      children.push(new Paragraph({ children: [new TextRun({ text: '[चित्र]', italics: true, color: '888888' })] }))
      return
    }
    const isHeading = /^h[1-3]$/.test(tag)
    children.push(
      new Paragraph({
        ...blockStyle(el),
        heading: isHeading ? (tag === 'h1' ? HeadingLevel.HEADING_1 : tag === 'h2' ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3) : undefined,
        children: runsOf(el, D, { size: baseSize, font: fontDefault, bold: isHeading }),
      }),
    )
  }

  Array.from(src.children).forEach((c) => {
    if (c.nodeType === Node.ELEMENT_NODE) walkBlock(c as HTMLElement)
  })
  if (!children.length) children.push(new Paragraph({ text: '' }))

  const headerPara = page.headerText
    ? new Header({
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: page.headerText, size: 18, color: '555555' })] })],
      })
    : undefined

  const footerPara =
    page.footerText || page.pageNumbers
      ? new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `${page.footerText ?? ''}  `, size: 18, color: '555555' }),
                ...(page.pageNumbers
                  ? [new TextRun({ children: ['पृष्ठ ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], size: 18, color: '555555' })]
                  : []),
              ],
            }),
          ],
        })
      : undefined

  const doc = new Document({
    creator: 'WordLegal',
    title,
    description: 'हिन्दी विधिक मसौदा — वर्डलीगल',
    styles: {
      default: {
        document: {
          run: { font: fontDefault, size: baseSize },
          paragraph: { spacing: { line: Math.round(240 * parseFloat(css.lineHeight)) } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: Math.round(dims.w * 1440), height: Math.round(dims.h * 1440) },
            margin: {
              top: Math.round(page.marginTop * 1440),
              bottom: Math.round(page.marginBottom * 1440),
              left: Math.round(page.marginLeft * 1440),
              right: Math.round(page.marginRight * 1440),
              header: Math.round(0.3 * 1440),
              footer: Math.round(0.3 * 1440),
            },
          },
        },
        headers: headerPara ? { default: headerPara } : undefined,
        footers: footerPara ? { default: footerPara } : undefined,
        children,
      },
    ],
  })

  return Packer.toBlob(doc)
}

/* -------------------------------- HTML / TXT --------------------- */
export function exportHTML(html: string, page: PageSettings, title: string, css: TypeCSS = DEFAULT_TYPECSS): Blob {
  const dims = pageDimsLocal(page)
  const doc = `<!doctype html>
<html lang="hi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/</g, '&lt;')}</title>
<style>
  @page { size: ${dims.w}in ${dims.h}in; margin: 0; }
  html,body{margin:0;background:#e9edf4;font-family:'Noto Serif Devanagari',serif}
  .page{width:${dims.w}in;min-height:${dims.h}in;margin:0 auto 12px;background:#fffdf8;
    padding:${page.marginTop}in ${page.marginRight}in ${page.marginBottom}in ${page.marginLeft}in;
    box-sizing:border-box;font-size:${css.fontSize};line-height:${css.lineHeight};color:#10151d}
  .doc-content p{margin:0 0 .5em;text-align:justify}
  .doc-court{text-align:center;font-weight:700;font-size:1.05em}
  .doc-caseno{text-align:right}
  .doc-party{text-align:center}
  .doc-prayer{text-align:center;font-weight:700}
  .doc-sign{text-align:right}
  .doc-verify{font-size:.95em;text-align:justify;border-top:1px dashed #999;padding-top:.5em}
  .doc-note{font-size:.88em;color:#444}
  table{border-collapse:collapse;width:100%}
  td,th{border:1px solid #999;padding:5px}
  @media print{ html,body{background:#fff} .page{box-shadow:none;margin:0;page-break-after:always} }
</style></head>
<body><div class="page doc-content">${html}</div></body></html>`
  return new Blob([doc], { type: MIME.html })
}

export function exportTXT(html: string): Blob {
  return new Blob([htmlToText(html)], { type: MIME.txt })
}

export const MIME_TYPES = MIME
export { geomOf }
