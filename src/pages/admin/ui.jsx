import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export const ORDER_FLOW = ['pending', 'confirmed', 'paid', 'shipped', 'delivered']
export const STATUS_COLOR = {
  pending: '#e0a106',
  confirmed: '#6b55d6',
  paid: '#3d82e0',
  shipped: '#b250d3',
  delivered: '#2ea36f',
  cancelled: '#d9485f',
}

export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export const initials = (name, email) => {
  const source = (name || email || '?').trim()
  const parts = source.split(/\s+/)
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export function timeAgo(date) {
  if (!date) return ''
  const d = new Date(date)
  const s = Math.round((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const fullDate = (date) =>
  date ? new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''

export function PageHead({ eyebrow, title, sub, children }) {
  return (
    <div className="sb-head">
      <div>
        {eyebrow && <div className="sb-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="sb-head-actions">{children}</div>}
    </div>
  )
}

export function Alert({ type = 'error', children, onClose }) {
  if (!children) return null
  const Icon = type === 'ok' ? CheckCircle2 : AlertCircle
  return (
    <div className={`sb-alert sb-alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={17} />
      <div>{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss">
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export function StatusPill({ status }) {
  const s = status || 'pending'
  return <span className={`sb-pill sb-pill--${s}`}>{s}</span>
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="sb-empty">
      {Icon && <span className="sb-empty-icon"><Icon size={24} /></span>}
      {title && <strong>{title}</strong>}
      {children}
    </div>
  )
}

export function Switch({ checked, onChange, title, hint }) {
  return (
    <label className="sb-switch">
      <span>
        <strong>{title}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  )
}
