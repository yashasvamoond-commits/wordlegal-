import type { Editor } from '@tiptap/react'
import type { Node as PMNode } from '@tiptap/pm/model'

export interface Match {
  from: number
  to: number
  text: string
  context: string
}

/** दस्तावेज़ के सभी टेक्स्ट-नोड की स्थिति-सूची (बहु-नोड मिलान हेतु) */
function flatText(doc: PMNode) {
  const parts: { pos: number; len: number }[] = []
  let text = ''
  doc.descendants((node, pos) => {
    if (!node.isText) return
    const t = node.text ?? ''
    if (!t) return
    parts.push({ pos, len: t.length })
    text += t
  })
  return { text, parts }
}

function posOf(parts: { pos: number; len: number }[], index: number) {
  let left = index
  for (const p of parts) {
    if (left < p.len) return p.pos + left
    if (left === p.len) return p.pos + p.len
    left -= p.len
  }
  const last = parts[parts.length - 1]
  return last ? last.pos + last.len : 0
}

/** पूरे दस्तावेज़ में खोज — टोकन टूटे हुए हों (mark सीमा) तो भी मिले */
export function findMatches(ed: Editor, find: string, caseSensitive = false): Match[] {
  if (!find) return []
  const { text, parts } = flatText(ed.state.doc)
  const hay = caseSensitive ? text : text.toLowerCase()
  const needle = caseSensitive ? find : find.toLowerCase()
  const out: Match[] = []
  let i = 0
  while (out.length < 500) {
    const at = hay.indexOf(needle, i)
    if (at < 0) break
    out.push({
      from: posOf(parts, at),
      to: posOf(parts, at + needle.length),
      text: text.slice(at, at + needle.length),
      context: text.slice(Math.max(0, at - 28), at + needle.length + 28),
    })
    i = at + Math.max(1, needle.length)
  }
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
