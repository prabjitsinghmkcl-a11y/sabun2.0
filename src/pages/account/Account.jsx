import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router'
import usePageTitle from '../../components/usePageTitle'
import { BagIcon, BoxIcon, LockIcon, LogoutIcon, PinIcon, UserIcon, WhatsAppIcon } from '../../components/Icons'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useSite } from '../../context/SiteContext'
import { INDIAN_STATES as STATIC_STATES } from '../../data/site'
import { api } from '../../lib/api'
import OtpBox, { useCountdown } from './OtpBox'
import './account.css'

const FLOW = ['pending', 'confirmed', 'paid', 'shipped', 'delivered']
const STATUS_TEXT = {
  pending: 'We’ve got your order and will confirm it on WhatsApp soon.',
  confirmed: 'Confirmed! We’ll share payment details on WhatsApp.',
  paid: 'Payment received — your soaps are being packed.',
  shipped: 'On its way to you.',
  delivered: 'Delivered. We hope you love it!',
  cancelled: 'This order was cancelled.',
}

const fmtDate = (d, withTime = false) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
      })
    : ''

const firstName = (name) => (name || '').trim().split(/\s+/)[0] || 'there'

function useAccount() {
  return useOutletContext()
}

function Status({ status }) {
  const s = status || 'pending'
  return <span className={`acc-status acc-status--${s}`}>{s}</span>
}

function Progress({ status }) {
  const s = status || 'pending'
  if (s === 'cancelled') return null
  const at = FLOW.indexOf(s)
  return (
    <ol className="acc-progress" aria-label={`Order status: ${s}`}>
      {FLOW.map((step, i) => (
        <li key={step} className={`${i <= at ? 'is-done' : ''}${i === at ? ' is-current' : ''}`}>
          <i />
          <span>{step}</span>
        </li>
      ))}
    </ol>
  )
}

function Notice({ type = 'ok', children, onClose }) {
  if (!children) return null
  return (
    <div className={`acc-notice acc-notice--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss">×</button>
      )}
    </div>
  )
}

/* =========================================================
   Shell — sidebar + content
   ========================================================= */
export default function Account() {
  const { user, loading, logout, updateUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')

  const loadAll = useCallback(async () => {
    try {
      const [a, o] = await Promise.all([api.get('/account'), api.get('/account/orders')])
      setStats(a.stats)
      if (a.user) updateUser(a.user)
      setOrders(o.orders || [])
    } catch (e) {
      setError(e.message)
      setOrders((cur) => cur || [])
    }
  }, [updateUser])

  useEffect(() => {
    if (user) loadAll()
    // only on first load / when the logged-in person changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  if (loading) return <section className="section section--tight"><div className="container acc-loading">Loading your account…</div></section>
  if (!user) return <Navigate to={`/account/login?next=${encodeURIComponent(location.pathname)}`} replace />

  const onLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const links = [
    { to: '/account', label: 'Overview', icon: UserIcon, end: true },
    { to: '/account/orders', label: 'My orders', icon: BoxIcon, count: orders?.length },
    { to: '/account/addresses', label: 'Addresses', icon: PinIcon, count: user.addresses?.length },
    { to: '/account/profile', label: 'Profile & security', icon: LockIcon },
  ]

  return (
    <section className="section section--tight acc-page">
      <div className="container">
        <header className="acc-head">
          <div className="acc-avatar" aria-hidden="true">{firstName(user.name).slice(0, 1).toUpperCase()}</div>
          <div>
            <p className="eyebrow">My account</p>
            <h1 className="page-title">
              Hi, <em>{firstName(user.name)}</em>
            </h1>
            <p className="acc-head-sub">
              {[user.phone ? `+91 ${user.phone}` : '', user.email].filter(Boolean).join(' · ')} · Member since {fmtDate(user.createdAt) || 'today'}
            </p>
          </div>
        </header>

        <div className="acc-layout">
          <nav className="acc-nav" aria-label="Account">
            {links.map((l) => {
              const Icon = l.icon
              return (
                <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
                  <Icon />
                  <span>{l.label}</span>
                  {l.count > 0 && <b>{l.count}</b>}
                </NavLink>
              )
            })}
            <button type="button" onClick={onLogout}>
              <LogoutIcon />
              <span>Log out</span>
            </button>
          </nav>

          <div className="acc-content">
            <Notice type="error" onClose={() => setError('')}>{error}</Notice>
            <Outlet context={{ user, stats, orders, setOrders, reload: loadAll, updateUser }} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* =========================================================
   Overview
   ========================================================= */
export function AccountOverview() {
  const { user, stats, orders } = useAccount()
  const { formatINR } = useSite()
  usePageTitle('My account')
  const latest = orders?.[0]
  const def = user.addresses?.find((a) => a.isDefault)

  return (
    <div className="acc-stack">
      <div className="acc-stats">
        <div className="acc-stat">
          <span>Orders</span>
          <strong>{stats ? stats.orders : '—'}</strong>
        </div>
        <div className="acc-stat">
          <span>In progress</span>
          <strong>{stats ? stats.activeOrders : '—'}</strong>
        </div>
        <div className="acc-stat">
          <span>Total spent</span>
          <strong>{stats ? formatINR(stats.totalSpent) : '—'}</strong>
        </div>
        <div className="acc-stat">
          <span>Soaps bought</span>
          <strong>{stats ? stats.soapsBought : '—'}</strong>
        </div>
      </div>

      <div className="acc-card">
        <div className="acc-card-head">
          <h2>Latest order</h2>
          {orders?.length > 0 && <Link to="/account/orders">All orders →</Link>}
        </div>
        {!orders && <p className="acc-muted">Loading…</p>}
        {orders && !latest && (
          <div className="acc-empty">
            <BagIcon />
            <p>You haven’t ordered anything yet.</p>
            <Link className="btn btn--primary" to="/shop">Browse soaps</Link>
          </div>
        )}
        {latest && (
          <div>
            <div className="acc-order-top">
              <div>
                <strong>{latest.ref}</strong>
                <span>{fmtDate(latest.createdAt, true)} · {latest.items.reduce((s, i) => s + i.qty, 0)} item(s) · {formatINR(latest.total)}</span>
              </div>
              <Status status={latest.status} />
            </div>
            <Progress status={latest.status} />
            <p className="acc-status-text">{STATUS_TEXT[latest.status || 'pending']}</p>
          </div>
        )}
      </div>

      <div className="acc-grid-2">
        <div className="acc-card">
          <div className="acc-card-head">
            <h2>Default address</h2>
            <Link to="/account/addresses">{def ? 'Manage' : 'Add'} →</Link>
          </div>
          {def ? (
            <address className="acc-address">
              <strong>{def.name}</strong>
              {def.address}
              <br />
              {def.city}, {def.state} – {def.pincode}
              <br />
              +91 {def.phone}
            </address>
          ) : (
            <p className="acc-muted">Save an address and checkout will fill it in for you.</p>
          )}
        </div>
        <div className="acc-card">
          <div className="acc-card-head">
            <h2>Your details</h2>
            <Link to="/account/profile">Edit →</Link>
          </div>
          <dl className="acc-dl">
            <dt>Name</dt><dd>{user.name}</dd>
            <dt>Email</dt><dd>{user.email || <span className="acc-muted">Not added</span>}</dd>
            <dt>Mobile</dt>
            <dd>{user.phone ? `+91 ${user.phone}` : <span className="acc-muted">Not added</span>}</dd>
            <dt>Birthday</dt><dd>{user.birthday ? fmtDate(user.birthday) : <span className="acc-muted">Not added</span>}</dd>
          </dl>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Orders
   ========================================================= */
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'In progress', match: (s) => ['pending', 'confirmed', 'paid', 'shipped'].includes(s) },
  { id: 'delivered', label: 'Delivered', match: (s) => s === 'delivered' },
  { id: 'cancelled', label: 'Cancelled', match: (s) => s === 'cancelled' },
]

export function AccountOrders() {
  const { orders, setOrders, reload } = useAccount()
  const { formatINR, waLink } = useSite()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)
  const [msg, setMsg] = useState({ type: 'ok', text: '' })
  const [busy, setBusy] = useState(null)
  usePageTitle('My orders')

  const shown = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)
    return (orders || []).filter((o) => !f?.match || f.match(o.status || 'pending'))
  }, [orders, filter])

  const reorder = (order) => {
    let added = 0
    for (const i of order.items) {
      if (!i.productId) continue
      addItem(i.productId, i.qty, { custom: i.custom || '', silent: true })
      added += 1
    }
    if (added) navigate('/cart')
    else setMsg({ type: 'error', text: 'These products are no longer available.' })
  }

  const cancel = async (order) => {
    if (!window.confirm(`Cancel order ${order.ref}?`)) return
    setBusy(order.id)
    setMsg({ type: 'ok', text: '' })
    try {
      const d = await api.post(`/account/orders/${order.id}/cancel`)
      setOrders((list) => list.map((o) => (o.id === order.id ? d.order : o)))
      setMsg({ type: 'ok', text: `Order ${order.ref} was cancelled.` })
      reload()
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="acc-stack">
      <div className="acc-card-head acc-card-head--page">
        <h2>My orders</h2>
        <div className="acc-filters" role="tablist">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'is-active' : ''} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Notice type={msg.type} onClose={() => setMsg({ type: 'ok', text: '' })}>{msg.text}</Notice>

      {!orders && <p className="acc-muted">Loading your orders…</p>}
      {orders && !shown.length && (
        <div className="acc-card acc-empty">
          <BoxIcon />
          <p>{orders.length ? 'No orders in this list.' : 'No orders yet — your orders will show up here once you check out while logged in.'}</p>
          {!orders.length && <Link className="btn btn--primary" to="/shop">Start shopping</Link>}
        </div>
      )}

      {shown.map((o) => {
        const isOpen = open === o.id
        const c = o.customer || {}
        const count = o.items.reduce((s, i) => s + i.qty, 0)
        const help = waLink(`Hi SaBun! I have a question about my order ${o.ref}.`)
        return (
          <article key={o.id} className={`acc-card acc-order${isOpen ? ' is-open' : ''}`}>
            <button type="button" className="acc-order-top acc-order-toggle" onClick={() => setOpen(isOpen ? null : o.id)} aria-expanded={isOpen}>
              <div>
                <strong>{o.ref}</strong>
                <span>{fmtDate(o.createdAt, true)} · {count} item{count === 1 ? '' : 's'}</span>
              </div>
              <div className="acc-order-right">
                <strong>{formatINR(o.total)}</strong>
                <Status status={o.status} />
              </div>
            </button>

            <ul className="acc-items-mini">
              {o.items.map((i, idx) => (
                <li key={idx}>{i.name}{i.custom ? ` “${i.custom}”` : ''} × {i.qty}</li>
              ))}
            </ul>

            {isOpen && (
              <div className="acc-order-body">
                <Progress status={o.status} />
                <p className="acc-status-text">{STATUS_TEXT[o.status || 'pending']}</p>

                <div className="acc-grid-2">
                  <div>
                    <h3>Items</h3>
                    <ul className="acc-lines">
                      {o.items.map((i, idx) => (
                        <li key={idx}>
                          <span>
                            {i.name}
                            <small>{[i.variant, i.custom && `Name: ${i.custom}`].filter(Boolean).join(' · ')}</small>
                          </span>
                          <span>{i.qty} × {formatINR(i.price)}</span>
                          <strong>{formatINR(i.lineTotal)}</strong>
                        </li>
                      ))}
                    </ul>
                    <dl className="acc-totals">
                      <dt>Subtotal</dt><dd>{formatINR(o.subtotal)}</dd>
                      <dt>Delivery</dt><dd>{o.deliveryKnown ? (o.deliveryFee ? formatINR(o.deliveryFee) : 'Free') : 'Confirmed on WhatsApp'}</dd>
                      <dt className="is-total">Total</dt><dd className="is-total">{formatINR(o.total)}</dd>
                    </dl>
                  </div>
                  <div>
                    <h3>Delivering to</h3>
                    <address className="acc-address">
                      <strong>{c.name}</strong>
                      {c.address}
                      <br />
                      {[c.city, c.state].filter(Boolean).join(', ')}{c.pincode ? ` – ${c.pincode}` : ''}
                      <br />
                      {c.phone}
                    </address>
                    {c.gift && <p className="acc-muted" style={{ marginTop: 10 }}>🎁 Gift wrapped{c.giftNote ? ` — “${c.giftNote}”` : ''}</p>}
                    {c.notes && <p className="acc-muted" style={{ marginTop: 6 }}>Note: {c.notes}</p>}
                  </div>
                </div>

                <div className="acc-actions">
                  <button type="button" className="btn btn--primary" onClick={() => reorder(o)}>
                    <BagIcon /> Order again
                  </button>
                  <a className="btn btn--ghost" href={help} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon /> Help with this order
                  </a>
                  {(o.status || 'pending') === 'pending' && (
                    <button type="button" className="acc-link-danger" disabled={busy === o.id} onClick={() => cancel(o)}>
                      {busy === o.id ? 'Cancelling…' : 'Cancel order'}
                    </button>
                  )}
                </div>
              </div>
            )}
            {!isOpen && (
              <button type="button" className="acc-more" onClick={() => setOpen(o.id)}>View details</button>
            )}
          </article>
        )
      })}
    </div>
  )
}

/* =========================================================
   Addresses
   ========================================================= */
const blankAddress = { label: 'Home', name: '', phone: '', address: '', city: '', state: '', pincode: '', isDefault: false }

function AddressForm({ initial, onCancel, onSave, busy }) {
  const { states } = useSite()
  const STATES = states?.length ? states : STATIC_STATES
  const [f, setF] = useState(initial)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  return (
    <form
      className="acc-card acc-form"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(f)
      }}
    >
      <h3>{initial.id ? 'Edit address' : 'New address'}</h3>
      <div className="acc-labels">
        {['Home', 'Work', 'Other'].map((l) => (
          <button key={l} type="button" className={f.label === l ? 'is-active' : ''} onClick={() => setF((x) => ({ ...x, label: l }))}>{l}</button>
        ))}
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="ad-name">Full name</label>
          <input id="ad-name" value={f.name} onChange={set('name')} autoComplete="name" required />
        </div>
        <div className="field">
          <label htmlFor="ad-phone">Mobile number</label>
          <div className="input-prefix">
            <span>+91</span>
            <input id="ad-phone" type="tel" inputMode="numeric" value={f.phone} onChange={set('phone')} autoComplete="tel-national" required />
          </div>
        </div>
      </div>
      <div className="field">
        <label htmlFor="ad-address">House no., street, area</label>
        <textarea id="ad-address" rows={2} value={f.address} onChange={set('address')} autoComplete="street-address" required />
      </div>
      <div className="field-row field-row--3">
        <div className="field">
          <label htmlFor="ad-city">City</label>
          <input id="ad-city" value={f.city} onChange={set('city')} autoComplete="address-level2" required />
        </div>
        <div className="field">
          <label htmlFor="ad-state">State</label>
          <select id="ad-state" value={f.state} onChange={set('state')} required>
            <option value="">Choose…</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ad-pin">Pincode</label>
          <input id="ad-pin" inputMode="numeric" maxLength={6} value={f.pincode} onChange={set('pincode')} autoComplete="postal-code" required />
        </div>
      </div>
      <label className="acc-check">
        <input type="checkbox" checked={f.isDefault} onChange={set('isDefault')} /> Use as my default address
      </label>
      <div className="acc-actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

export function AccountAddresses() {
  const { user, updateUser } = useAccount()
  const [editing, setEditing] = useState(null) // null | 'new' | address
  const [msg, setMsg] = useState({ type: 'ok', text: '' })
  const [busy, setBusy] = useState(false)
  usePageTitle('My addresses')
  const list = user.addresses || []

  const run = async (fn, ok) => {
    setBusy(true)
    setMsg({ type: 'ok', text: '' })
    try {
      const d = await fn()
      updateUser(d.user)
      setMsg({ type: 'ok', text: ok })
      return true
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
      return false
    } finally {
      setBusy(false)
    }
  }

  const save = async (f) => {
    const body = { ...f, phone: f.phone.replace(/\D/g, '').slice(-10) }
    const done = await run(
      () => (f.id ? api.put(`/account/addresses/${f.id}`, body) : api.post('/account/addresses', body)),
      f.id ? 'Address updated.' : 'Address saved.',
    )
    if (done) setEditing(null)
  }

  return (
    <div className="acc-stack">
      <div className="acc-card-head acc-card-head--page">
        <h2>Saved addresses</h2>
        {!editing && list.length < 10 && (
          <button type="button" className="btn btn--primary" onClick={() => setEditing({ ...blankAddress, name: user.name, phone: user.phone || '', isDefault: !list.length })}>
            + Add address
          </button>
        )}
      </div>
      <Notice type={msg.type} onClose={() => setMsg({ type: 'ok', text: '' })}>{msg.text}</Notice>

      {editing && <AddressForm initial={editing} busy={busy} onCancel={() => setEditing(null)} onSave={save} />}

      {!list.length && !editing && (
        <div className="acc-card acc-empty">
          <PinIcon />
          <p>No saved addresses yet. Add one and checkout will fill it in automatically.</p>
        </div>
      )}

      <div className="acc-addresses">
        {list.map((a) => (
          <div key={a.id} className={`acc-card acc-addr${a.isDefault ? ' is-default' : ''}`}>
            <div className="acc-addr-top">
              <span className="acc-tag">{a.label}</span>
              {a.isDefault && <span className="acc-tag acc-tag--dark">Default</span>}
            </div>
            <address className="acc-address">
              <strong>{a.name}</strong>
              {a.address}
              <br />
              {a.city}, {a.state} – {a.pincode}
              <br />
              +91 {a.phone}
            </address>
            <div className="acc-addr-actions">
              <button type="button" onClick={() => setEditing(a)} disabled={busy}>Edit</button>
              {!a.isDefault && (
                <button type="button" onClick={() => run(() => api.post(`/account/addresses/${a.id}/default`), 'Default address updated.')} disabled={busy}>
                  Make default
                </button>
              )}
              <button
                type="button"
                className="is-danger"
                disabled={busy}
                onClick={() => window.confirm('Delete this address?') && run(() => api.del(`/account/addresses/${a.id}`), 'Address deleted.')}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* =========================================================
   Profile & security
   ========================================================= */
function PhoneVerify({ user, updateUser }) {
  const [phone, setPhone] = useState(user.phone || '')
  const [otpSentTo, setOtpSentTo] = useState('')
  const [otp, setOtp] = useState('')
  const [left, setLeft] = useCountdown()
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState({ type: 'ok', text: '' })

  const phoneNow = phone.replace(/\D/g, '').slice(-10)
  const otpActive = Boolean(otpSentTo) && otpSentTo === phoneNow

  const send = async () => {
    setMsg({ type: 'ok', text: '' })
    if (!/^[6-9]\d{9}$/.test(phoneNow)) {
      return setMsg({ type: 'error', text: 'Enter a valid 10-digit mobile number.' })
    }
    if (phoneNow === user.phone && user.phoneVerified) {
      return setMsg({ type: 'ok', text: 'This is your verified login number.' })
    }

    setBusy('send')
    try {
      const d = await api.post('/account/phone/send-otp', { phone: phoneNow })
      setOtpSentTo(phoneNow)
      setOtp('')
      setLeft(d.retryAfter || 60)
      setMsg({
        type: 'ok',
        text: d.devCode
          ? `OTP sent to +91 ${phoneNow}. Dev OTP: ${d.devCode}`
          : `OTP sent to +91 ${phoneNow}. It is valid for 5 minutes.`,
      })
    } catch (e) {
      if (e.data?.retryAfter) setLeft(e.data.retryAfter)
      setMsg({ type: 'error', text: e.message })
    } finally {
      setBusy('')
    }
  }

  const save = async () => {
    setMsg({ type: 'ok', text: '' })
    if (!otpActive) return setMsg({ type: 'error', text: 'Send an OTP to the new number first.' })
    if (otp.length !== 6) return setMsg({ type: 'error', text: 'Enter the 6-digit OTP.' })

    setBusy('verify')
    try {
      const d = await api.post('/account/phone/verify', { phone: phoneNow, otp })
      updateUser(d.user)
      setPhone(d.user.phone || phoneNow)
      setOtpSentTo('')
      setLeft(0)
      setOtp('')
      setMsg({ type: 'ok', text: 'Mobile number verified — ab isi number se OTP login hoga.' })
    } catch (e) {
      if (e.data?.retryAfter) setLeft(e.data.retryAfter)
      setMsg({ type: 'error', text: e.message })
    } finally {
      setBusy('')
    }
  }

  const changeNumber = () => {
    setOtpSentTo('')
    setLeft(0)
    setOtp('')
    setMsg({ type: 'ok', text: '' })
  }

  return (
    <div className="field">
      <label htmlFor="pf-phone">
        Mobile number <span className="optional">(login)</span>
      </label>
      <div className="acc-phone-row">
        <div className="input-prefix" style={{ flex: 1 }}>
          <span>+91</span>
          <input
            id="pf-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              if (msg.text) setMsg({ type: 'ok', text: '' })
            }}
            autoComplete="tel-national"
            placeholder="98765 43210"
            disabled={otpActive || busy === 'send' || busy === 'verify'}
          />
        </div>
        {!otpActive && (
          <button type="button" className="btn btn--ghost acc-btn-sm" onClick={send} disabled={busy === 'send'}>
            {busy === 'send' ? 'Sending…' : 'Send OTP'}
          </button>
        )}
      </div>

      {otpActive && (
        <>
          <OtpBox
            id="pf-otp"
            value={otp}
            onChange={setOtp}
            phone={otpSentTo}
            left={left}
            onResend={send}
            sending={busy === 'send'}
            autoFocus
          />
          <div className="acc-phone-row">
            <button type="button" className="btn btn--primary acc-btn-sm" onClick={save} disabled={busy === 'verify' || otp.length !== 6}>
              {busy === 'verify' ? 'Verifying…' : 'Verify & save'}
            </button>
            <button type="button" className="acc-inline-btn" onClick={changeNumber}>
              Use another number
            </button>
          </div>
        </>
      )}

      {msg.text && <span className={msg.type === 'error' ? 'acc-field-error' : 'acc-field-ok'}>{msg.text}</span>}
    </div>
  )
}
export function AccountProfile() {
  const { user, updateUser } = useAccount()
  const { logout } = useAuth()
  const navigate = useNavigate()
  usePageTitle('Profile & security')

  const [p, setP] = useState({ name: user.name || '', birthday: user.birthday || '', whatsappUpdates: user.whatsappUpdates !== false })
  const [pMsg, setPMsg] = useState({ type: 'ok', text: '' })
  const [delPhone, setDelPhone] = useState('')
  const [delMsg, setDelMsg] = useState('')
  const [busy, setBusy] = useState('')

  const saveProfile = async (e) => {
    e.preventDefault()
    setBusy('profile')
    setPMsg({ type: 'ok', text: '' })
    try {
      const d = await api.put('/account/profile', { name: p.name, birthday: p.birthday, whatsappUpdates: p.whatsappUpdates })
      updateUser(d.user)
      setPMsg({ type: 'ok', text: 'Profile saved.' })
    } catch (err) {
      setPMsg({ type: 'error', text: err.message })
    } finally {
      setBusy('')
    }
  }

  const deleteAccount = async (e) => {
    e.preventDefault()
    if (!window.confirm('Delete your account permanently? Your saved addresses will be removed.')) return
    setBusy('del')
    setDelMsg('')
    try {
      await api.del('/account', { phone: delPhone })
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      setDelMsg(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="acc-stack">
      <form className="acc-card acc-form" onSubmit={saveProfile}>
        <div className="acc-card-head"><h2>Personal details</h2></div>
        <Notice type={pMsg.type}>{pMsg.text}</Notice>
        <div className="field-row">
          <div className="field">
            <label htmlFor="pf-name">Full name</label>
            <input id="pf-name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="pf-email">Email</label>
            <input id="pf-email" value={user.email} disabled placeholder="Not added" />
            <span className="field-hint">Optional — your mobile number is your login.</span>
          </div>
        </div>
        <div className="field-row">
          <PhoneVerify user={user} updateUser={updateUser} />
          <div className="field">
            <label htmlFor="pf-bday">Birthday <span className="optional">(optional)</span></label>
            <input id="pf-bday" type="date" value={p.birthday} onChange={(e) => setP({ ...p, birthday: e.target.value })} />
            <span className="field-hint">So we can send you a little birthday surprise.</span>
          </div>
        </div>
        <label className="acc-check">
          <input type="checkbox" checked={p.whatsappUpdates} onChange={(e) => setP({ ...p, whatsappUpdates: e.target.checked })} />
          Send me new launches and offers on WhatsApp
        </label>
        <div className="acc-actions">
          <button type="submit" className="btn btn--primary" disabled={busy === 'profile'}>{busy === 'profile' ? 'Saving…' : 'Save details'}</button>
        </div>
      </form>

      {user.role !== 'admin' && (
        <form className="acc-card acc-form acc-danger" onSubmit={deleteAccount}>
          <div className="acc-card-head"><h2>Delete account</h2></div>
          <p className="acc-muted">This removes your login and saved addresses. Past orders stay with the shop for our records.</p>
          {delMsg && <Notice type="error">{delMsg}</Notice>}
          <div className="field" style={{ maxWidth: 360 }}>
            <label htmlFor="del-phone">Type your mobile number to confirm</label>
            <input id="del-phone" type="tel" inputMode="numeric" value={delPhone} onChange={(e) => setDelPhone(e.target.value)} autoComplete="tel-national" required />
          </div>
          <div className="acc-actions">
            <button type="submit" className="acc-link-danger" disabled={busy === 'del' || !delPhone}>{busy === 'del' ? 'Deleting…' : 'Delete my account'}</button>
          </div>
        </form>
      )}
    </div>
  )
}
