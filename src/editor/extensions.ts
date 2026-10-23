/* ------------------------------------------------------------------
   TipTap कस्टम एक्सटेंशन — फ़ॉन्ट आकार, पंक्ति-अंतर, इंडेंट,
   विधिक ब्लॉक शैली, पृष्ठ-विच्छेद
   ------------------------------------------------------------------ */
import { Extension, Node } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as PMNode } from '@tiptap/pm/model'

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
            renderHTML: (attrs) =>
              attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {},
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }: any) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    } as any
  },
})

export const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() {
    return { types: ['paragraph', 'heading'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.lineHeight || null,
            renderHTML: (attrs) =>
              attrs.lineHeight ? { style: `line-height:${attrs.lineHeight}` } : {},
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setLineHeight:
        (value: string) =>
        ({ commands }: any) => {
          let ok = false
          this.options.types.forEach((t: string) => {
            ok = commands.updateAttributes(t, { lineHeight: value }) || ok
          })
          return ok
        },
    } as any
  },
})

export const Indent = Extension.create({
  name: 'indent',
  addOptions() {
    return { types: ['paragraph', 'heading'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => parseFloat((el as HTMLElement).style.marginLeft || '0') || 0,
            renderHTML: (attrs) =>
              attrs.indent ? { style: `margin-left:${attrs.indent}px` } : {},
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      indent:
        () =>
        ({ commands, editor }: any) => {
          const cur = editor.getAttributes('paragraph').indent || 0
          let ok = false
          this.options.types.forEach((t: string) => {
            ok = commands.updateAttributes(t, { indent: Math.min(cur + 36, 360) }) || ok
          })
          return ok
        },
      outdent:
        () =>
        ({ commands, editor }: any) => {
          const cur = editor.getAttributes('paragraph').indent || 0
          let ok = false
          this.options.types.forEach((t: string) => {
            ok = commands.updateAttributes(t, { indent: Math.max(cur - 36, 0) }) || ok
          })
          return ok
        },
    } as any
  },
})

/** विधिक ब्लॉक शैली — doc-court, doc-body, doc-prayer… */
export const BlockStyle = Extension.create({
  name: 'blockStyle',
  addOptions() {
    return { types: ['paragraph', 'heading'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          blockClass: {
            default: null,
            parseHTML: (el) => {
              const c = (el as HTMLElement).getAttribute('class') || ''
              const keep = c
                .split(/\s+/)
                .filter((x) =>
                  /^doc-(court|caseno|party|subject|body|prayer|sign|verify|note|center|right|quote)$/.test(x),
                )
                .join(' ')
              return keep || null
            },
            renderHTML: (attrs) => (attrs.blockClass ? { class: attrs.blockClass } : {}),
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setBlockStyle:
        (cls: string | null) =>
        ({ commands }: any) => {
          let ok = false
          this.options.types.forEach((t: string) => {
            ok = commands.updateAttributes(t, { blockClass: cls }) || ok
          })
          return ok
        },
    } as any
  },
})

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'div[data-page-break]' }]
  },
  renderHTML() {
    return ['div', { 'data-page-break': 'true', class: 'page-break' }]
  },
  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }: any) =>
          chain().insertContent({ type: 'pageBreak' }).run(),
    } as any
  },
})


/* ------------------------------------------------------------------
   {{फ़ील्ड}} टोकन — संपादक में रंगीन दिखें, निर्यात से पहले स्वतः भरें
   ------------------------------------------------------------------ */
const TOKEN_RE = /\{\{\s*[A-Z_]+\s*\}\}/g

function buildTokenDecos(doc: PMNode): DecorationSet {
  const decos: Decoration[] = []
  doc.descendants((node, pos) => {
    if (!node.isText) return
    const text = node.text ?? ''
    TOKEN_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = TOKEN_RE.exec(text))) {
      decos.push(
        Decoration.inline(pos + m.index, pos + m.index + m[0].length, { class: 'doc-token' }),
      )
    }
  })
  return DecorationSet.create(doc, decos)
}

export const FieldTokens = Extension.create({
  name: 'fieldTokens',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('fieldTokens'),
        state: {
          init: (_cfg, { doc }) => buildTokenDecos(doc),
          apply: (tr, old) => (tr.docChanged ? buildTokenDecos(tr.doc) : old),
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})
