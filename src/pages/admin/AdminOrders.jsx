import { useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  Ban,
  Check,
  CreditCard,
  Gift,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  PackageCheck,
} from 'lucide-react'
import { api } from '../../lib/api'
import usePageTitle from '../../components/usePageTitle'
import { Alert, Empty, ORDER_FLOW, PageHead, STATUS_COLOR, StatusPill, fullDate, inr, initials, timeAgo } from './ui'

const FALLBACK_STATUSES = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled']
const digits = (s) => String(s || '').replace(/\D/g, '')

const ACTIONS = {
  confirmed: { label: 'Confirm order', icon: Check },
  paid: { label: 'Mark as paid', icon: CreditCard },
  shipped: { label: 'Mark shipped', icon: Truck },
  delivered: { label: 'Mark delivered', icon: PackageCheck },
  pending: { label: 'Move back to pending', icon: RefreshCw },
  cancelled: { label: 'Cancel order', icon: Ban },
}

function waCustomer(order) {
  let num = digits(order.customer?.phone)
  if (num.length === 10) num = `91${num}`
  const first = (order.customer?.name || '').split(' ')[0]
  const text = `Hi ${first}! This is SaBun about your order ${order.ref}.`
  return num ? `https://wa.me/${num}?text=${encodeURIComponent(text)}` : null
}

function itemCount(order) {
  return (order.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
}

function OrderDetail({ order, allowed, saving, onStatus, onDelete, onClose }) {
  const customer = order.customer || {}
  const current = order.status || 'pending'
  const wa = waCustomer(order)
  const stepIndex = ORDER_FLOW.indexOf(current)
  const address = [customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ')

  return (
    <article className="sb-card sb-detail" aria-label={`Order ${order.ref}`}>
      <header className="sb-detail-head">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <button type="button" className="sb-btn sb-btn--icon sb-btn--sm sb-back" onClick={onClose} aria-label="Back to orders">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="sb-muted sb-small">{fullDate(order.createdAt)}</div>
            <h2>{order.ref}</h2>
          </div>
        </div>
        <StatusPill status={current} />
      </header>

      <div className="sb-detail-body">
        <section>
          <div className="sb-section-title">Progress</div>
          {current === 'cancelled' ? (
            <div className="sb-cancelled-note"><Ban size={16} /> This order was cancelled.</div>
          ) : (
            <div className="sb-steps">
              {ORDER_FLOW.map((s, i) => (
                <div key={s} className={`sb-step${i <= stepIndex ? ' is-done' : ''}${i === stepIndex ? ' is-current' : ''}`}>
                  <i />
                  {s}
                </div>
              ))}
            </div>
          )}
          {!!allowed.length && (
            <div className="sb-next">
              {allowed.map((next) => {
                const action = ACTIONS[next] || { label: next, icon: Check }
                const Icon = action.icon
                const isCancel = next === 'cancelled'
                const isPrimary = !isCancel && next !== 'pending' && next === allowed.find((a) => a !== 'cancelled' && a !== 'pending')
                return (
                  <button
                    key={next}
                    type="button"
                    disabled={saving}
                    className={`sb-btn ${isCancel ? 'sb-btn--danger' : isPrimary ? 'sb-btn--primary' : ''}`}
                    onClick={() => {
                      if (isCancel && !window.confirm(`Cancel order ${order.ref}?`)) return
                      onStatus(next)
                    }}
                  >
                    {saving === next ? <Loader2 size={15} className="sb-spin" /> : <Icon size={15} />}
                    {action.label}
                  </button>
                )
              })}
            </div>
          )}
          {!allowed.length && current !== 'cancelled' && (
            <p className="sb-muted sb-small" style={{ marginTop: 12 }}>This order is complete — no further steps.</p>
          )}
        </section>

        <section>
          <div className="sb-section-title">Customer</div>
          <div className="sb-person">
            <span className="sb-avatar sb-avatar--lg">{initials(customer.name, customer.email)}</span>
            <div style={{ minWidth: 0 }}>
              <strong>{customer.name || 'Customer'}</strong>
              <span>{customer.phone || 'No phone'}</span>
            </div>
            <div className="sb-person-actions">
              {wa && (
                <a className="sb-btn sb-btn--wa sb-btn--sm" href={wa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={15} /> WhatsApp
                </a>
              )}
              {customer.phone && (
                <a className="sb-btn sb-btn--sm sb-btn--icon" href={`tel:${customer.phone}`} aria-label="Call customer"><Phone size={15} /></a>
              )}
              {customer.email && (
                <a className="sb-btn sb-btn--sm sb-btn--icon" href={`mailto:${customer.email}`} aria-label="Email customer"><Mail size={15} /></a>
              )}
            </div>
          </div>
          <dl className="sb-kv" style={{ marginTop: 14 }}>
            <dt>Deliver to</dt><dd>{address || '—'}</dd>
            {customer.email && (<><dt>Email</dt><dd>{customer.email}</dd></>)}
            <dt>Payment</dt><dd style={{ textTransform: 'capitalize' }}>{order.paymentMethod || order.channel || 'WhatsApp'}{order.paymentRef ? ` · ${order.paymentRef}` : ''}</dd>
            {customer.gift && (<><dt>Gift wrap</dt><dd><Gift size={14} style={{ verticalAlign: -2, color: 'var(--sb-rose)' }} /> Yes{customer.giftNote ? ` — “${customer.giftNote}”` : ''}</dd></>)}
            {customer.notes && (<><dt>Notes</dt><dd>{customer.notes}</dd></>)}
          </dl>
        </section>

        <section>
          <div className="sb-section-title">Items · {itemCount(order)}</div>
          <ul className="sb-items">
            {(order.items || []).map((item, index) => (
              <li key={index}>
                <span className="sb-qty">{item.qty}×</span>
                <span className="sb-row-main">
                  <strong>{item.name}</strong>
                  <span>
                    {[item.variant, item.custom ? `Name: “${item.custom}”` : ''].filter(Boolean).join(' · ') || `${inr(item.price)} each`}
                  </span>
                </span>
                <strong className="sb-num">{inr(item.lineTotal ?? item.price * item.qty)}</strong>
              </li>
            ))}
          </ul>
          <div className="sb-totals">
            <div><span className="sb-muted">Subtotal</span><span className="sb-num">{inr(order.subtotal)}</span></div>
            <div><span className="sb-muted">Delivery</span><span className="sb-num">{order.deliveryKnown ? inr(order.deliveryFee) : 'To be confirmed'}</span></div>
            <div className="is-grand"><span>Total</span><span className="sb-num">{inr(order.total)}</span></div>
          </div>
        </section>

        <div className="sb-danger-zone">
          <span>Deleting removes the order permanently.</span>
          <button type="button" className="sb-btn sb-btn--sm sb-btn--danger" onClick={onDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </article>
  )
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [transitions, setTransitions] = useState(null)
  const [statuses, setStatuses] = useState(FALLBACK_STATUSES)
  const [loaded, setLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const [q, setQ] = useState('')
  const status = statuses.includes(params.get('status')) ? params.get('status') : ''
  usePageTitle('Orders')

  const load = async () => {
    setRefreshing(true)
    try {
      const data = await api.get('/admin/orders')
      setOrders(data.orders || [])
      if (data.statuses?.length) setStatuses(data.statuses)
      if (data.transitions) setTransitions(data.transitions)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoaded(true)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Open the order a toast / dashboard link points to
  useEffect(() => {
    if (location.state?.highlightId) setSelectedId(location.state.highlightId)
  }, [location.state])

  const counts = useMemo(() => {
    const result = {}
    for (const order of orders) {
      const key = order.status || 'pending'
      result[key] = (result[key] || 0) + 1
    }
    return result
  }, [orders])

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return orders.filter((order) => {
      if (status && (order.status || 'pending') !== status) return false
      if (!term) return true
      const customer = order.customer || {}
      const itemNames = (order.items || []).map((item) => item.name).join(' ')
      return `${order.ref} ${customer.name} ${customer.phone} ${customer.email} ${customer.city} ${itemNames}`
        .toLowerCase()
        .includes(term)
    })
  }, [orders, status, q])

  const selected = orders.find((o) => o._id === selectedId) || shown[0] || null
  const allowedFor = (order) => {
    const current = order.status || 'pending'
    if (transitions) return transitions[current] || []
    return statuses.filter((s) => s !== current)
  }

  const updateStatus = async (order, next) => {
    setError('')
    setSaving({ id: order._id, to: next })
    try {
      const data = await api.put(`/admin/orders/${order._id}/status`, { status: next })
      setOrders((list) => list.map((o) => (o._id === order._id ? { ...o, ...data.order } : o)))
      window.dispatchEvent(new CustomEvent('sabun:orders-changed'))
    } catch (e) {
      setError(`Could not update ${order.ref}: ${e.message}`)
      await load()
    } finally {
      setSaving(null)
    }
  }

  const remove = async (order) => {
    if (!window.confirm(`Delete order ${order.ref}? This cannot be undone.`)) return
    setError('')
    try {
      await api.del(`/admin/orders/${order._id}`)
      setOrders((list) => list.filter((o) => o._id !== order._id))
      setSelectedId(null)
      window.dispatchEvent(new CustomEvent('sabun:orders-changed'))
    } catch (e) {
      setError(e.message)
    }
  }

  const setTab = (next) => {
    setSelectedId(null)
    setParams(next ? { status: next } : {})
  }

  return (
    <div>
      <PageHead eyebrow="Orders" title="Order inbox" sub="Confirm, take payment and ship every WhatsApp order — step by step.">
        <button type="button" className="sb-btn" onClick={load} disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? 'sb-spin' : undefined} /> Refresh
        </button>
      </PageHead>

      <Alert onClose={() => setError('')}>{error}</Alert>

      <div className="sb-toolbar">
        <div className="sb-search">
          <Search size={16} />
          <input type="search" placeholder="Search ref, name, phone, item…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="sb-chips" role="tablist" aria-label="Filter by status" style={{ marginBottom: 18 }}>
        <button type="button" role="tab" aria-selected={!status} className={`sb-chip${!status ? ' is-active' : ''}`} onClick={() => setTab('')}>
          All <b>{orders.length}</b>
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={status === s}
            className={`sb-chip${status === s ? ' is-active' : ''}`}
            onClick={() => setTab(s)}
            style={{ '--c': STATUS_COLOR[s] }}
          >
            <i /> {s} <b>{counts[s] || 0}</b>
          </button>
        ))}
      </div>

      {!loaded && <div className="sb-card"><Empty icon={Loader2} title="Loading orders…" /></div>}

      {loaded && !shown.length && (
        <div className="sb-card">
          <Empty icon={ShoppingBag} title={orders.length ? 'Nothing here' : 'No orders yet'}>
            {orders.length ? 'No orders match this filter or search.' : 'Orders placed at checkout will land here.'}
          </Empty>
        </div>
      )}

      {loaded && !!shown.length && (
        <div className="sb-inbox">
          <div className="sb-inbox-list">
            {shown.map((order) => {
              const current = order.status || 'pending'
              const names = (order.items || []).map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(', ')
              return (
                <button
                  key={order._id}
                  type="button"
                  className={`sb-oc${selected?._id === order._id ? ' is-active' : ''}`}
                  onClick={() => setSelectedId(order._id)}
                  style={{ '--c': STATUS_COLOR[current] }}
                >
                  <span className="sb-oc-status" aria-hidden="true" />
                  <span className="sb-oc-main">
                    <span className="sb-oc-top">
                      <strong>{order.customer?.name || 'Customer'}</strong>
                      <span className="sb-oc-ref">{order.ref}</span>
                    </span>
                    <span className="sb-oc-items" style={{ display: 'block' }}>{names || '—'}</span>
                  </span>
                  <span className="sb-oc-end">
                    <strong>{inr(order.total)}</strong>
                    <time dateTime={order.createdAt}>{timeAgo(order.createdAt)}</time>
                  </span>
                </button>
              )
            })}
          </div>

          <div className={`sb-detail-wrap${selectedId && selected ? ' is-open' : ''}`} onClick={(e) => e.target === e.currentTarget && setSelectedId(null)}>
            {selected && (
              <OrderDetail
                key={selected._id}
                order={selected}
                allowed={allowedFor(selected)}
                saving={saving?.id === selected._id ? saving.to : null}
                onStatus={(next) => updateStatus(selected, next)}
                onDelete={() => remove(selected)}
                onClose={() => setSelectedId(null)}
              />
            )}
          </div>
        </div>
      )}

      {saving && (
        <div className="sb-saving" role="status">
          <Loader2 size={15} className="sb-spin" /> Updating to {saving.to}…
        </div>
      )}
    </div>
  )
}
