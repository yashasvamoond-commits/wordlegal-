import { useMemo, useState } from 'react'
import { COURTS, courtByKey } from '../data/courts'
import { LAW_MAP, LAW_NOTES, lookupSection } from '../data/lawmap'
import { CASE_FIELDS, remainingFields } from '../lib/fields'
import type { CaseDetails, CourtKey, RuleRef } from '../types'
import { Icon } from './icons'
import { Btn, Chips, Field, Sheet } from './ui'

interface CaseProps {
  open: boolean
  onClose: () => void
  cd: CaseDetails
  onChange: (patch: Partial<CaseDetails>) => void
  onFill: () => void
  docHtml: string
}

export function CasePanel({ open, onClose, cd, onChange, onFill, docHtml }: CaseProps) {
  const remaining = useMemo(() => remainingFields(docHtml), [docHtml])
  const court = courtByKey(cd.court)
  const groups = useMemo(() => {
    const g: Record<string, typeof CASE_FIELDS> = {}
    for (const f of CASE_FIELDS) {
      if (f.key === 'customCourt' && cd.court !== 'custom') continue
      g[f.group] = [...(g[f.group] ?? []), f]
    }
    return g
  }, [cd.court])

  return (
    <Sheet
      open={open}
      onClose={onClose}
      wide
      tall
      title="केस विवरण"
      subtitle="यहाँ भरा विवरण दस्तावेज़ के {{फ़ील्ड}} में स्वतः जुड़ जाता है"
      footer={
        <>
          <Btn variant="ghost" label="बंद करें" onClick={onClose} />
          <Btn variant="primary" icon="sparkle" label="सभी फ़ील्ड भरें" onClick={onFill} />
        </>
      }
    >
      {remaining.length > 0 && (
        <div
          style={{
            padding: '10px 12px', borderRadius: 10, marginBottom: 14,
            background: 'rgba(255,179,73,.08)', border: '1px solid rgba(255,179,73,.25)',
            fontSize: 12.5, color: 'var(--muted)',
          }}
        >
          <strong style={{ color: 'var(--accent)' }}>{remaining.length} फ़ील्ड शेष हैं:</strong>{' '}
          {remaining.slice(0, 12).map((r) => `{{${r}}}`).join(' ')}
        </div>
      )}

      <Field label="न्यायालय">
        <select
          className="input"
          value={cd.court}
          onChange={(e) => onChange({ court: e.target.value as CourtKey })}
        >
          {COURTS.map((c) => (
            <option key={c.key} value={c.key}>{c.hi}</option>
          ))}
        </select>
        <div className="hint">{court.power}</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
          {court.competent.map((c) => <span key={c} className="tag-mini">{c}</span>)}
        </div>
      </Field>

      {Object.entries(groups).map(([g, fields]) => (
        <div key={g} style={{ marginTop: 16 }}>
          <div className="section-title" style={{ margin: '0 0 8px' }}>
            <span>{g}</span><span className="line" />
          </div>
          <div className="row2">
            {fields.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                {f.key === 'court' ? null : (
                  <input
                    className="input"
                    value={String(cd[f.key] ?? '')}
                    onChange={(e) => onChange({ [f.key]: e.target.value } as Partial<CaseDetails>)}
                    placeholder={f.label}
                  />
                )}
              </Field>
            ))}
          </div>
        </div>
      ))}
    </Sheet>
  )
}

/* ------------------------------ धारा मैपिंग ---------------------- */
export function LawSheet({ open, onClose, onInsert }: { open: boolean; onClose: () => void; onInsert?: (t: string) => void }) {
  const [q, setQ] = useState('')
  const [act, setAct] = useState<'all' | 'IPC' | 'CrPC' | 'IEA'>('all')
  const list = useMemo(() => {
    const out = lookupSection(q)
    return (act === 'all' ? out : out.filter((r) => r.oldAct === act)).slice(0, 200)
  }, [q, act])

  const legal = (r: RuleRef) => `${r.oldAct} धारा ${r.oldSec} → ${r.newAct} धारा ${r.newSec}`

  return (
    <Sheet open={open} onClose={onClose} wide tall title="धारा मैपिंग — पुरानी संहिता → नई संहिता"
      subtitle={`IPC → BNS · CrPC → BNSS · साक्ष्य अधिनियम → BSA (01.07.2024 से लागू) · कुल ${LAW_MAP.length} प्रविष्टियाँ`}>
      <div className="search-wrap">
        <span className="ico"><Icon name="search" size={18} /></span>
        <input className="search" placeholder="धारा खोजें… (जैसे 302, 167, 65B, हत्या)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div style={{ marginTop: 10 }}>
        <Chips items={['all', 'IPC', 'CrPC', 'IEA']} value={act} onChange={(v) => setAct(v as typeof act)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
        {list.map((r, i) => (
          <div key={i} className="check-item">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="tag-mini">{r.oldAct} {r.oldSec}</span>
              <Icon name="arrowRight" size={14} />
              <span className="tag-mini" style={{ color: 'var(--accent)' }}>{r.newAct} {r.newSec}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{r.hi}</span>
            </div>
            <div className="ctx">{r.en}{r.note ? ` — ${r.note}` : ''}</div>
            {onInsert && (
              <div className="acts">
                <Btn size="xs" variant="ghost" icon="plus" label="मसौदे में जोड़ें" onClick={() => { onInsert(legal(r)); onClose() }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 22 }}><span>महत्वपूर्ण टिप्पणियाँ</span><span className="line" /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {LAW_NOTES.map((n) => (
          <div key={n.t} className="block" style={{ marginTop: 0 }}>
            <h5>{n.t}</h5>
            <p style={{ fontSize: 13, lineHeight: 1.6 }}>{n.d}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--muted-2)' }}>
        सूची सांकेतिक है — अंतिम प्रारूप से पूर्व राजपत्र/इण्डिया कोड से मिलान करें।
      </div>
    </Sheet>
  )
}
