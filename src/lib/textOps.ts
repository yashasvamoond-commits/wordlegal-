import type { Editor } from '@tiptap/react'

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export interface Match {
  from: number
  to: number
  text: string
  context: string
}

export function findMatches(ed: Editor, find: string, caseSensitive = false): Match[] {
  if (!find) return []
  const out: Match[] = []
  const re = new RegExp(escapeRe(find), caseSensitive ? 'g' : 'gi')
  ed.state.doc.descendants((node, pos) => {
    if (!node.isText) return
    const text = node.text ?? ''
    let m: RegExpExecArray | null
    re.lastIndex = 0
    while ((m = re.exec(text))) {
      const from = pos + m.index
      const to = from + m[0].length
      out.push({ from, to, text: m[0], context: text.slice(Math.max(0, m.index - 24), m.index + m[0].length + 24) })
      if (m[0].length === 0) re.lastIndex++
    }
  })
  return out
}

/** पूरे दस्तावेज़ में बदलें — क्रम उलटकर लागू (स्थितियाँ स्थिर रहें) */
export function replaceAllInDoc(ed: Editor, find: string, rep: string, caseSensitive = false): number {
  if (!find) return 0
  const matches = findMatches(ed, find, caseSensitive)
  if (!matches.length) return 0
  const tr = ed.state.tr
  for (let i = matches.length - 1; i >= 0; i--) {
    tr.insertText(rep, matches[i].from, matches[i].to)
  }
  ed.view.dispatch(tr)
  return matches.length
}

export function replaceOne(ed: Editor, from: number, to: number, rep: string) {
  const tr = ed.state.tr.insertText(rep, from, to)
  ed.view.dispatch(tr)
}

export function selectionText(ed: Editor): string {
  const { from, to } = ed.state.selection
  if (from === to) return ''
  return ed.state.doc.textBetween(from, to, ' ')
}

/** चयन या कर्सर का शब्द (शब्दकोश हेतु) */
export function currentWord(ed: Editor): string {
  const sel = selectionText(ed)
  if (sel.trim()) return sel.trim()
  const { $from } = ed.state.selection
  const text = $from.parent.textContent
  const offset = $from.parentOffset
  const left = text.slice(0, offset).match(/[\u0900-\u097F\w]+$/)?.[0] ?? ''
  const right = text.slice(offset).match(/^[\u0900-\u097F\w]+/)?.[0] ?? ''
  return (left + right).trim()
}
