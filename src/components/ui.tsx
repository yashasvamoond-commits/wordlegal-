import { useEffect, useState, type ReactNode } from 'react'
import { Icon, type IconName } from './icons'
import { subscribeToasts, type ToastMsg } from '../lib/toast'

/* ------------------------------- Toaster ------------------------- */
export function Toaster() {
  const [msgs, setMsgs] = useState<ToastMsg[]>([])
  useEffect(() => subscribeToasts(setMsgs), [])
  return (
    <div className="toaster">
      {msgs.map((m) => (
        <div key={m.id} className={`toast ${m.kind}`}>
          {m.text}
        </div>
      ))}
    </div>
  )
}

/* -------------------------------- Btn ---------------------------- */
interface BtnProps {
  icon?: IconName
  label?: string
  onClick?: () => void
  active?: boolean
  activeBlue?: boolean
  disabled?: boolean
  title?: string
  size?: 'sm' | 'xs' | 'md'
  variant?: 'ghost' | 'primary' | 'danger'
  wide?: boolean
  className?: string
  children?: ReactNode
}

export function Btn({
  icon, label, onClick, active, activeBlue, disabled, title, size, variant, wide, className = '', children,
}: BtnProps) {
  const cls = [
    'btn',
    size && size !== 'md' ? size : '',
    active ? 'on' : '',
    activeBlue ? 'on-blue' : '',
    variant ?? '',
    !label && icon ? 'icon' : '',
    wide ? 'wide' : '',
    className,
  ].filter(Boolean).join(' ')
  return (
    <button className={cls} onClick={onClick} disabled={disabled} title={title ?? label} aria-label={title ?? label} type="button">
      {icon && <Icon name={icon} size={size === 'xs' ? 15 : size === 'sm' ? 17 : 19} />}
      {label && <span>{label}</span>}
      {children}
    </button>
  )
}

/* -------------------------------- Sheet -------------------------- */
interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  tall?: boolean
  center?: boolean
  badge?: ReactNode
}

export function Sheet({ open, onClose, title, subtitle, children, footer, wide, tall, center, badge }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className={`backdrop ${center ? 'center' : ''}`} onClick={onClose}>
      <div
        className={`sheet ${wide ? 'wide' : ''} ${tall ? 'tall' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>{title}</h3>
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          {badge}
          <Btn icon="close" size="sm" onClick={onClose} title="बंद करें" />
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  )
}

/* -------------------------------- Field -------------------------- */
export function Field({
  label, hint, children,
}: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

/* -------------------------------- Switch ------------------------- */
export function SwitchRow({
  label, desc, on, onChange,
}: { label: string; desc?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="switch-row">
      <div style={{ flex: 1 }}>
        <div className="lbl">{label}</div>
        {desc && <div className="desc">{desc}</div>}
      </div>
      <button type="button" className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on} aria-label={label} />
    </div>
  )
}

/* ------------------------------- Chips --------------------------- */
export function Chips<T extends string>({
  items, value, onChange,
}: { items: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="chipbar no-sb">
      {items.map((it) => (
        <button key={it} type="button" className={`chip ${it === value ? 'on' : ''}`} onClick={() => onChange(it)}>
          {it}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------- Colors -------------------------- */
export const TEXT_COLORS = [
  '#000000', '#1f2937', '#374151', '#6b7280', '#9ca3af', '#ffffff', '#7f1d1d', '#991b1b',
  '#b91c1c', '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a', '#059669',
  '#0d9488', '#0891b2', '#0284c7', '#1d4ed8', '#4338ca', '#6d28d9', '#7e22ce', '#a21caf',
]

export const HIGHLIGHT_COLORS = [
  '#fef08a', '#fde68a', '#fcd34d', '#fdba74', '#fecaca', '#e9d5ff', '#bfdbfe', '#bbf7d0',
  '#d9f99d', '#e5e7eb', '#ffffff', 'transparent',
]

export function ColorGrid({
  colors, value, onPick, allowCustom,
}: { colors: string[]; value?: string; onPick: (c: string) => void; allowCustom?: boolean }) {
  const [custom, setCustom] = useState(value ?? '#000000')
  return (
    <div>
      <div className="swatches">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            className="swatch"
            style={{
              background: c === 'transparent' ? 'repeating-conic-gradient(#bbb 0% 25%, #fff 0% 50%) 50%/10px 10px' : c,
              outline: value === c ? '2px solid var(--accent)' : 'none',
              outlineOffset: 2,
            }}
            onClick={() => onPick(c)}
            aria-label={c}
          />
        ))}
      </div>
      {allowCustom && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <input
            type="color"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            style={{ width: 46, height: 38, background: 'none', border: '1px solid var(--line)', borderRadius: 9 }}
          />
          <Btn size="sm" variant="ghost" label="लागू करें" onClick={() => onPick(custom)} />
        </div>
      )}
    </div>
  )
}

/* ------------------------------ misc ---------------------------- */
export function Empty({ title, hint, icon = 'search' }: { title: string; hint?: string; icon?: IconName }) {
  return (
    <div className="empty">
      <div className="big"><Icon name={icon} size={30} /></div>
      <div style={{ fontWeight: 600, color: 'var(--muted)' }}>{title}</div>
      {hint && <div style={{ fontSize: 12, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

export function Loading({ label = 'तैयार हो रहा है…' }: { label?: string }) {
  return (
    <div className="empty">
      <div className="big" style={{ animation: 'spin 1s linear infinite' }}>
        <Icon name="refresh" size={30} />
      </div>
      <div>{label}</div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

export function Menu({ items, onClose }: {
  items: ({ label: string; icon?: IconName; onClick: () => void; danger?: boolean; key?: string; sep?: boolean } | null)[]
  onClose: () => void
}) {
  useEffect(() => {
    const h = () => onClose()
    const t = setTimeout(() => window.addEventListener('click', h), 30)
    return () => { clearTimeout(t); window.removeEventListener('click', h) }
  }, [onClose])
  return (
    <div className="menu" onClick={(e) => e.stopPropagation()}>
      {items.filter(Boolean).map((it, i) => {
        const item = it!
        if (item.sep) return <div key={'sep' + i} className="menu-sep" />
        return (
          <button
            key={item.key ?? item.label}
            type="button"
            className={`menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => { onClose(); item.onClick() }}
          >
            {item.icon && <Icon name={item.icon} size={17} />}
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ padding: '10px 12px', background: 'var(--panel-2)', borderRadius: 10, border: '1px solid var(--line-soft)' }}>
      <div style={{ fontSize: 10.5, color: 'var(--muted-2)', letterSpacing: '.4px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  )
}
