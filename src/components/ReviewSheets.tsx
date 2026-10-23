import { useEffect, useMemo, useState } from 'react'
import { checkText, KIND_LABEL, type Issue, type IssueKind } from '../lib/terminology'
import { htmlToText } from '../lib/storage'
import { fmtDate } from '../lib/storage'
import { toast } from '../lib/toast'
import { useT } from '../lib/useT'
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
  const { t } = useT()
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
      title={t('fr.title')}
      subtitle={find ? t('fr.results', { n: count }) : t('fr.subtitle')}
      footer={
        <>
          <Btn variant="ghost" label={t('c.close')} onClick={onClose} />
          <Btn
            variant="primary"
            icon="refresh"
            label={t('fr.replaceAll')}
            disabled={!find || count === 0}
            onClick={() => {
              const n = replaceAll(find, rep, cs)
              toast(t('fr.replaced', { n }), 'ok')
              onClose()
            }}
          />
        </>
      }
    >
      <Field label={t('fr.find')}>
        <input className="input" value={find} onChange={(e) => setFind(e.target.value)} placeholder={t('fr.findPlaceholder')} autoFocus />
      </Field>
      <Field label={t('fr.replace')}>
        <input className="input" value={rep} onChange={(e) => setRep(e.target.value)} placeholder={t('fr.replacePlaceholder')} />
      </Field>
      <SwitchRow label={t('fr.caseSensitive')} desc={t('fr.caseSensitiveDesc')} on={cs} onChange={setCs} />
      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--muted-2)', lineHeight: 1.6 }}>
        {t('fr.tip')}
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
  const { t } = useT()
  const kindLabel = (k: IssueKind) => t(`ck.kind.${k}` as never)
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
    setText((prev) => prev.split(i.word).join(i.suggestion))
    toast(t('ck.applied', { w: i.suggestion, n }), 'ok', 1800)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      wide
      tall
      title={t('ck.title')}
      subtitle={t('ck.sub', { n: issues.length })}
      footer={
        <>
          <Btn variant="ghost" icon="refresh" label={t('ck.recheck')} onClick={() => setText(getText())} />
          <Btn variant="primary" label={t('c.close')} onClick={onClose} />
        </>
      }
    >
      <div className="chipbar no-sb" style={{ marginBottom: 12 }}>
        <button type="button" className={`chip ${kind === 'all' ? 'on' : ''}`} onClick={() => setKind('all')}>{t('c.all')} ({issues.length})</button>
        {(Object.keys(KIND_LABEL) as IssueKind[]).map((k) => (
          <button key={k} type="button" className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>
            {kindLabel(k)} ({counts[k] ?? 0})
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <Btn size="xs" variant="ghost" label={t('ck.optFormal')} active={english ? true : undefined} onClick={() => setEnglish((v) => !v)} />
        <Btn size="xs" variant="ghost" label={t('ck.optNear')}  active={nearMiss} onClick={() => setNearMiss((v) => !v)} />
        <Btn size="xs" variant="ghost" label={t('ck.optPunct')}  active={punct} onClick={() => setPunct((v) => !v)} />
      </div>

      {shown.length === 0 ? (
        <Empty title={t('ck.noIssues')} hint={t('ck.noIssuesHint')} icon="check" />
      ) : (
        <div>
          {shown.map((i) => (
            <div key={i.id} className="check-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="tag-mini">{kindLabel(i.kind)}</span>
                <span style={{ fontWeight: 600 }}>{i.word}</span>
                <Icon name="arrowRight" size={14} />
                <span className="sugg">{i.suggestion}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <Btn size="xs" variant="ghost" icon="check" label={t('c.apply')}  onClick={() => apply(i)} />
                  <Btn size="xs" variant="ghost" icon="close" onClick={() => setIgnored((x) => [...x, i.id])} title={t('c.ignore')}  />
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
  const { t } = useT()
  const versions = [...(doc.versions ?? [])].reverse()
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('ver.title')}
      subtitle={t('ver.sub', { n: versions.length })}
      footer={
        <>
          <Btn variant="ghost" label={t('c.close')} onClick={onClose} />
          <Btn variant="primary" icon="history" label={t('ver.snapshot')} onClick={() => { onSnapshot(); toast(t('ver.saved'), 'ok') }} />
        </>
      }
    >
      {versions.length === 0 && (
        <Empty title={t('ver.empty')} hint={t('ver.emptyHint')} icon="history" />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {versions.map((v, i) => (
          <div key={v.at} className="check-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>{v.label}</span>
              <span className="tag-mini">{fmtDate(v.at)}</span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <Btn size="xs" variant="ghost" icon="eye" label={t('ver.restore')} onClick={() => {
                  if (confirm(t('ver.restoreConfirm'))) {
                    onRestore(v.html)
                    toast(t('ver.restored'), 'ok')
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
