/* ------------------------------------------------------------------
   पृष्ठ-विभाजन इंजन (pagination engine)
   लीगल साइज़ (8.5 × 14 इंच) पर पिक्सेल-सटीक पृष्ठ बनाता है।
   ब्लॉक स्तर पर विभाजन + लंबे पैराग्राफ का पंक्ति-स्तरीय विभाजन
   (Range.cloneContents से स्वरूपण सुरक्षित रहता है)।
   ------------------------------------------------------------------ */
import type { CaseDetails, PageSettings } from '../types'

export const PX_PER_IN = 96

export interface Geom {
  pageW: number
  pageH: number
  mt: number
  mr: number
  mb: number
  ml: number
}

export interface TypeCSS {
  fontFamily: string
  fontSize: string
  lineHeight: string
}

export const DEFAULT_TYPECSS: TypeCSS = {
  fontFamily: "'Noto Serif Devanagari', serif",
  fontSize: '12pt',
  lineHeight: '1.5',
}

export function geomOf(page: PageSettings): Geom {
  const { w, h } = pageDimsLocal(page)
  return {
    pageW: w,
    pageH: h,
    mt: page.marginTop,
    mr: page.marginRight,
    mb: page.marginBottom,
    ml: page.marginLeft,
  }
}

export function pageDimsLocal(page: PageSettings) {
  const sizes: Record<string, { w: number; h: number }> = {
    legal: { w: 8.5, h: 14 },
    legal13: { w: 8.5, h: 13 },
    a4: { w: 8.27, h: 11.69 },
    letter: { w: 8.5, h: 11 },
  }
  const s = sizes[page.size] ?? sizes.legal
  return page.orientation === 'landscape' ? { w: s.h, h: s.w } : s
}

const inch = (n: number) => `${n}in`

function makeHost(widthIn: number, css: TypeCSS): HTMLElement {
  const host = document.createElement('div')
  host.className = 'doc-content measure-layer'
  host.style.cssText = [
    'position:fixed',
    'left:-30000px',
    'top:0',
    `width:${inch(widthIn)}`,
    'display:flow-root',
    'visibility:hidden',
    'pointer-events:none',
    'z-index:-1',
    `font-family:${css.fontFamily}`,
    `font-size:${css.fontSize}`,
    `line-height:${css.lineHeight}`,
  ].join(';')
  document.body.appendChild(host)
  return host
}

function measureBlock(host: HTMLElement, html: string): number {
  host.innerHTML = html
  const h = host.getBoundingClientRect().height
  return h
}

function textNodesOf(el: Node): Text[] {
  const out: Text[] = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let n: Node | null
  while ((n = walker.nextNode())) {
    const t = n as Text
    if (t.nodeValue && t.nodeValue.length) out.push(t)
  }
  return out
}

function pointAt(nodes: Text[], k: number): { node: Text; offset: number } | null {
  let left = k
  for (const n of nodes) {
    const len = n.nodeValue?.length ?? 0
    if (left <= len) return { node: n, offset: left }
    left -= len
  }
  const last = nodes[nodes.length - 1]
  return last ? { node: last, offset: last.nodeValue?.length ?? 0 } : null
}

/** elके [from,to) अक्षरों का HTML — मूल टैग व गुण सुरक्षित */
function sliceHtml(el: HTMLElement, from: number, to: number): string {
  const nodes = textNodesOf(el)
  const a = pointAt(nodes, from)
  const b = pointAt(nodes, to)
  if (!a || !b) return el.outerHTML
  const r = document.createRange()
  try {
    r.setStart(a.node, a.offset)
    r.setEnd(b.node, b.offset)
  } catch {
    return el.outerHTML
  }
  const frag = r.cloneContents()
  const wrap = el.cloneNode(false) as HTMLElement
  wrap.appendChild(frag)
  return wrap.outerHTML
}

/** सूची/तालिका को उनके बच्चों के अनुसार दो भागों में बाँटें */
function splitChildren(
  el: HTMLElement,
  avail: number,
  host: HTMLElement,
): [string, string | null] | null {
  const tag = el.tagName
  if (!['UL', 'OL', 'TABLE', 'TBODY', 'THEAD'].includes(tag)) return null
  const kids = Array.from(el.children)
  if (kids.length < 2) return null
  const wrap = el.cloneNode(false) as HTMLElement
  let used = 0
  let cut = -1
  for (let i = 0; i < kids.length; i++) {
    const probe = wrap.cloneNode(false) as HTMLElement
    for (let j = 0; j <= i; j++) probe.appendChild(kids[j].cloneNode(true))
    const h = measureBlock(host, probe.outerHTML)
    if (h <= avail) {
      used = h
      cut = i
    } else break
  }
  if (cut < 0) return null
  const first = el.cloneNode(false) as HTMLElement
  const rest = el.cloneNode(false) as HTMLElement
  kids.forEach((k, i) => {
    if (i <= cut) first.appendChild(k.cloneNode(true))
    else rest.appendChild(k.cloneNode(true))
  })
  const restHtml = rest.children.length ? rest.outerHTML : null
  return [first.outerHTML, restHtml]
}

/**
 * एक ब्लॉक को उपलब्ध ऊँचाई में बाँटें।
 * लौटाता है: [पहला भाग HTML, शेष HTML या null]
 */
export function splitBlock(
  el: HTMLElement,
  avail: number,
  host: HTMLElement,
  pageH: number,
): [string, string | null] {
  const whole = el.outerHTML

  const childSplit = splitChildren(el, avail, host)
  if (childSplit) return childSplit

  const nodes = textNodesOf(el)
  const total = nodes.reduce((n, t) => n + (t.nodeValue?.length ?? 0), 0)
  if (!total || avail < 24) return [whole, null]

  /* द्विआधारी खोज — सबसे बड़ा k जो उपलब्ध ऊँचाई में आ जाए */
  let lo = 1
  let hi = total
  let best = 0
  let guard = 0
  while (lo <= hi && guard++ < 40) {
    const mid = Math.floor((lo + hi) / 2)
    const h = measureBlock(host, sliceHtml(el, 0, mid))
    if (h <= avail - 1) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  if (!best) return [whole, null]

  /* शब्द-सीमा पर समायोजित करें (शब्द बीच से न कटे) */
  const full = nodes.map((t) => t.nodeValue ?? '').join('')
  let cut = best
  const at = full.slice(best - 1, best)
  if (at && at.trim() && best < total) {
    const prevSpace = full.lastIndexOf(' ', best - 1)
    if (prevSpace > best * 0.5) cut = prevSpace + 1
  }

  const firstHtml = sliceHtml(el, 0, cut)
  let restHtml: string | null = sliceHtml(el, cut, total)

  /* शेष भाग खाली दिखता है तो छोड़ें */
  const probe = document.createElement('div')
  probe.innerHTML = restHtml
  if (!(probe.textContent ?? '').trim() && !probe.querySelector('img,table')) restHtml = null

  if (restHtml) {
    const rh = measureBlock(host, restHtml)
    if (rh > pageH) {
      /* अगली पंक्ति में पुनः विभाजन (recursion सुरक्षित) */
      // caller loops
    }
  }
  return [firstHtml, restHtml]
}

/**
 * मुख्य API — HTML को पृष्ठों में बाँटें। प्रत्येक पृष्ठ का आंतरिक HTML लौटाता है।
 */
export function paginate(html: string, geom: Geom, css: TypeCSS = DEFAULT_TYPECSS): string[] {
  const contentW = geom.pageW - geom.ml - geom.mr
  const contentH = (geom.pageH - geom.mt - geom.mb) * PX_PER_IN
  const host = makeHost(contentW, css)

  const src = document.createElement('div')
  src.className = 'doc-content'
  src.style.cssText = `font-family:${css.fontFamily};font-size:${css.fontSize};line-height:${css.lineHeight}`
  src.innerHTML = html

  const pages: string[] = []
  let current: string[] = []
  let used = 0

  const flush = () => {
    pages.push(current.join(''))
    current = []
    used = 0
  }

  const nodes = Array.from(src.childNodes)
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.nodeValue ?? ''
      if (!txt.trim()) continue
      const p = document.createElement('p')
      p.textContent = txt
      nodes.splice(i + 1, 0, p)
      continue
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue
    const el = node as HTMLElement
    if (el.hasAttribute('data-page-break')) {
      if (current.length) flush()
      continue
    }
    const html0 = el.outerHTML
    const h = measureBlock(host, html0)

    if (used + h <= contentH + 0.6) {
      current.push(html0)
      used += h
      continue
    }

    if (h <= contentH) {
      if (current.length) flush()
      current.push(html0)
      used = h
      continue
    }

    /* ब्लॉक एक पृष्ठ से बड़ा — तोड़ें */
    let remaining: HTMLElement | null = el
    let avail = contentH - used
    let guard = 0
    while (remaining && guard++ < 60) {
      const probeHost = document.createElement('div')
      probeHost.innerHTML = remaining.outerHTML
      const cur = probeHost.firstElementChild as HTMLElement | null
      if (!cur) break
      const [firstHtml, restHtml] = splitBlock(cur, avail, host, contentH)
      if (firstHtml && firstHtml !== remaining.outerHTML) {
        current.push(firstHtml)
        flush()
      } else {
        /* और नहीं टूट सकता — इसी पृष्ठ पर रखें */
        current.push(remaining.outerHTML)
        flush()
        remaining = null
        break
      }
      if (!restHtml) {
        remaining = null
        break
      }
      const box = document.createElement('div')
      box.innerHTML = restHtml
      remaining = box.firstElementChild as HTMLElement | null
      if (!remaining) break
      const rh = measureBlock(host, remaining.outerHTML)
      if (rh <= contentH) {
        current.push(remaining.outerHTML)
        used = rh
        remaining = null
      } else {
        avail = contentH
      }
    }
  }
  if (current.length || !pages.length) flush()

  host.remove()
  return pages
}

/* ------------------------------------------------------------------
   पृष्ठ DOM निर्माण — पूर्वावलोकन / PDF हेतु
   ------------------------------------------------------------------ */
export interface RenderOptions {
  page: PageSettings
  caseDetails?: CaseDetails
  css?: TypeCSS
  scale?: number
  forPrint?: boolean
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function watermarkText(page: PageSettings): string {
  if (!page.watermark || page.watermark === 'none') return ''
  if (page.watermark === 'custom') return page.watermarkText || ''
  return page.watermark
}

/** पूर्वावलोकन हेतु पृष्ठ तत्व बनाएँ */
export function renderPages(html: string, opts: RenderOptions): HTMLElement[] {
  const { page, css = DEFAULT_TYPECSS } = opts
  const geom = geomOf(page)
  const contentW = geom.pageW - geom.ml - geom.mr
  const contentH = geom.pageH - geom.mt - geom.mb
  const bgs = paginate(html, geom, css)

  const wrap = document.createElement('div')
  const pages = bgs.map((body, idx) => {
    const el = document.createElement('div')
    el.className = 'preview-page'
    el.style.cssText = [
      `width:${geom.pageW}in`,
      `height:${geom.pageH}in`,
      `--ml:${geom.ml}in`,
      `--mr:${geom.mr}in`,
      `--mt:${geom.mt}in`,
      `--mb:${geom.mb}in`,
    ].join(';')

    const hdr = document.createElement('div')
    hdr.className = 'pp-header'
    if (page.headerText && (idx > 0 || page.firstPageHeader)) {
      const pgLabel = page.pageNumbers && idx > 0 ? `पृष्ठ ${idx + 1}` : ''
      hdr.innerHTML = `<span>${esc(page.headerText)}</span><span>${pgLabel}</span>`
    }
    if (hdr.innerHTML) el.appendChild(hdr)

    const bodyEl = document.createElement('div')
    bodyEl.className = 'pp-body'
    bodyEl.style.cssText = [
      `left:${geom.ml}in`,
      `top:${geom.mt}in`,
      `width:${contentW}in`,
      `height:${contentH}in`,
    ].join(';')
    const inner = document.createElement('div')
    inner.className = 'doc-content'
    inner.style.cssText = `font-family:${css.fontFamily};font-size:${css.fontSize};line-height:${css.lineHeight}`
    inner.innerHTML = body
    bodyEl.appendChild(inner)
    el.appendChild(bodyEl)

    const wm = watermarkText(page)
    if (wm) {
      const w = document.createElement('div')
      w.className = 'pp-mark'
      w.textContent = wm
      el.appendChild(w)
    }

    if (page.borderFrame) {
      const f = document.createElement('div')
      f.className = 'pp-frame'
      el.appendChild(f)
    }

    if (page.lineNumbers) {
      const lh = parseFloat(css.lineHeight) * (parseFloat(css.fontSize) * (css.fontSize.includes('pt') ? 96 / 72 : 1))
      let n = 1
      let y = geom.mt
      const perPage = Math.floor(contentH / (lh / PX_PER_IN))
      while (y < geom.pageH - geom.mb && n <= perPage) {
        const d = document.createElement('div')
        d.className = 'pp-lineno'
        d.textContent = String(n)
        d.style.top = `${y}in`
        d.style.left = `${Math.max(0.08, geom.ml - 0.3)}in`
        el.appendChild(d)
        y += lh / PX_PER_IN
        n++
      }
    }

    const ftr = document.createElement('div')
    ftr.className = 'pp-footer'
    const left = page.footerText ? esc(page.footerText) : ''
    const right = page.pageNumbers ? `पृष्ठ ${idx + 1} / ${bgs.length}` : ''
    ftr.innerHTML = `<span>${left}</span><span>${right}</span>`
    if (left || right) el.appendChild(ftr)

    wrap.appendChild(el)
    return el
  })
  return pages
}

/** पृष्ठों की संख्या (संपादक में गाइड हेतु) */
export function pageCount(html: string, geom: Geom, css: TypeCSS = DEFAULT_TYPECSS): number {
  try {
    return paginate(html, geom, css).length
  } catch {
    return 1
  }
}

/** छवियाँ लोड होने की प्रतीक्षा (मापन सही हो) */
export async function preloadImages(html: string): Promise<void> {
  const div = document.createElement('div')
  div.innerHTML = html
  const srcs = Array.from(div.querySelectorAll('img')).map((i) => i.getAttribute('src'))
  await Promise.all(
    srcs.filter((s): s is string => !!s).map(
      (src) =>
        new Promise<void>((res) => {
          const im = new Image()
          im.onload = () => res()
          im.onerror = () => res()
          im.src = src
          if (im.complete) res()
        }),
    ),
  )
}
