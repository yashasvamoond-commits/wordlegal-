import { useEffect, useMemo, useState } from 'react'
import { checkText, KIND_LABEL, type Issue, type IssueKind } from '../lib/terminology'
import { htmlToText } from '../lib/storage'
import { fmtDate } from '../lib/storage'
import { toast } from '../lib/toast'
import type { DocRecord } from '../types'
import { Icon } from './icons'
import { Btn, Chips, Empty, Field, Sheet, SwitchRow } from './ui'

/* ---------------------------- खोजें / बदलें ---------------------- */
interface FindProps {
  open: boolean
  onClose: () => void
  getText: () => string
  replaceAll: (a: string, b: string, cs?: boolean) => number
}

export function FindReplaceSheet({ open, onClose, getText, replaceAll }: FindProps) {
  const [find, setFind] = useState('')
  const [rep, setRep] = useState('')
  const [cs, setCs] = useState(false)

  const count = useMemo(() => {
    if (!open || !find) return 0
    const text = getText()
    const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), cs ? 'g' : 'gi')
    return (text.match(re) ?? []).length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [find, cs, open])

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="खोजें एवं बदलें"
      subtitle={find ? `${count} परिणाम मिले` : 'शब्द या वाक्यांश खोजें'}
      footer={
        <>
          <Btn variant="ghost" label="बंद" onClick={onClose} />
          <Btn
            variant="primary"
            icon="refresh"
            label="सभी बदलें"
            disabled={!find || count === 0}
            onClick={() => {
              const n = replaceAll(find, rep, cs)
              toast(`${n} स्थानों पर बदला गया`, 'ok')
              onClose()
            }}
          />
        </>
      }
    >
      <Field label="खोजें">
        <input className="input" value={find} onChange={(e) => setFind(e.target.value)} placeholder="जैसे: न्यायालय" autoFocus />
      </Field>
      <Field label="इससे बदलें">
        <input className="input" value={rep} onChange={(e) => setRep(e.target.value)} placeholder="जैसे: माननीय न्यायालय" />
      </Field>
      <SwitchRow label="वर्ण-संवेदी खोज" desc="छोटे/बड़े अक्षर का भेद" on={cs} onChange={setCs} />
      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--muted-2)', lineHeight: 1.6 }}>
        सुझाव: न्यायालयीन दस्तावेज़ों में “कोर्ट” → “न्यायालय”, “वकील” → “अधिवक्ता”, “केस” → “प्रकरण”
        जैसे प्रतिस्थापन एक क्लिक में करें।
      </div>
    </Sheet>
  )
}

/* ------------------------------ भाषा जाँच ------------------------ */
interface CheckProps {
  open: boolean
  onClose: () => void
  getText: () => string
  replaceAll: (a: string, b: string, cs?: boolean) => number
}

export function CheckerSheet({ open, onClose, getText, replaceAll }: CheckProps) {
  const [nearMiss, setNearMiss] = useState(true)
  const [english, setEnglish] = useState(true)
  const [punct, setPunct] = useState(true)
  const [text, setText] = useState('')
  const [ignored, setIgnored] = useState<string[]>([])
  const [kind, setKind] = useState<'all' | IssueKind>('all')

  useEffect(() => {
    if (open) {
      setText(getText())
      setIgnored([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const issues = useMemo(
    () => checkText(text, { nearMiss, english, punctuation: punct }).filter((i) => !ignored.includes(i.id)),
    [text, nearMiss, english, punct, ignored],
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const i of issues) c[i.kind] = (c[i.kind] ?? 0) + 1
    return c
  }, [issues])

  const shown = kind === 'all' ? issues : issues.filter((i) => i.kind === kind)

  const apply = (i: Issue) => {
    const n = replaceAll(i.word, i.suggestion)
    setIgnored((x) => [...x, i.id])
    setText((t) => t.split(i.word).join(i.suggestion))
    toast(`${n} स्थानों पर “${i.suggestion}” लागू`, 'ok', 1800)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      wide
      tall
      title="भाषा एवं वर्तनी जाँच"
      subtitle={`${issues.length} सुझाव — विधिक शब्दावली एवं टंकण`}
      footer={
        <>
          <Btn variant="ghost" icon="refresh" label="पुनः जाँचें" onClick={() => setText(getText())} />
          <Btn variant="primary" label="बंद" onClick={onClose} />
        </>
      }
    >
      <div className="chipbar no-sb" style={{ marginBottom: 12 }}>
        <button type="button" className={`chip ${kind === 'all' ? 'on' : ''}`} onClick={() => setKind('all')}>सभी ({issues.length})</button>
        {(Object.keys(KIND_LABEL) as IssueKind[]).map((k) => (
          <button key={k} type="button" className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>
            {KIND_LABEL[k]} ({counts[k] ?? 0})
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <Btn size="xs" variant="ghost" label="विधिक शब्दावली" active={english ? true : undefined} onClick={() => setEnglish((v) => !v)} />
        <Btn size="xs" variant="ghost" label="निकट वर्तनी" active={nearMiss} onClick={() => setNearMiss((v) => !v)} />
        <Btn size="xs" variant="ghost" label="विराम-चिह्न" active={punct} onClick={() => setPunct((v) => !v)} />
      </div>

      {shown.length === 0 ? (
        <Empty title="कोई सुधार आवश्यक नहीं" hint="दस्तावेज़ की भाषा विधिक मानकों के अनुरूप है" icon="check" />
      ) : (
        <div>
          {shown.map((i) => (
            <div key={i.id} className="check-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="tag-mini">{KIND_LABEL[i.kind]}</span>
                <span style={{ fontWeight: 600 }}>{i.word}</span>
                <Icon name="arrowRight" size={14} />
                <span className="sugg">{i.suggestion}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <Btn size="xs" variant="ghost" icon="check" label="लागू" onClick={() => apply(i)} />
                  <Btn size="xs" variant="ghost" icon="close" onClick={() => setIgnored((x) => [...x, i.id])} title="अनदेखा करें" />
                </span>
              </div>
              <div className="ctx">{i.reason}</div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  )
}

/* ------------------------------ संस्करण -------------------------- */
interface VersionProps {
  open: boolean
  onClose: () => void
  doc: DocRecord
  onSnapshot: () => void
  onRestore: (html: string) => void
}

export function VersionsSheet({ open, onClose, doc, onSnapshot, onRestore }: VersionProps) {
  const versions = [...(doc.versions ?? [])].reverse()
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="संस्करण इतिहास"
      subtitle={`${versions.length} सहेजे गए संस्करण`}
      footer={
        <>
          <Btn variant="ghost" label="बंद" onClick={onClose} />
          <Btn variant="primary" icon="history" label="अभी स्नैपशॉट लें" onClick={() => { onSnapshot(); toast('संस्करण सहेजा गया', 'ok') }} />
        </>
      }
    >
      {versions.length === 0 && (
        <Empty title="अभी कोई संस्करण नहीं" hint="महत्वपूर्ण परिवर्तन से पहले स्नैपशॉट लें" icon="history" />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {versions.map((v, i) => (
          <div key={v.at} className="check-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>{v.label}</span>
              <span className="tag-mini">{fmtDate(v.at)}</span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <Btn size="xs" variant="ghost" icon="eye" label="बहाल करें" onClick={() => {
                  if (confirm('इस संस्करण को बहाल करें? वर्तमान सामग्री बदल जाएगी।')) {
                    onRestore(v.html)
                    toast('संस्करण बहाल किया गया', 'ok')
                    onClose()
                  }
                }} />
              </span>
            </div>
            <div className="ctx">{htmlToText(v.html).slice(0, 160)}…</div>
          </div>
        ))}
      </div>
    </Sheet>
  )
}
