import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  IndianRupee,
  Package,
  PackageX,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import usePageTitle from '../../components/usePageTitle'
import { Alert, Empty, STATUS_COLOR, StatusPill, inr, timeAgo } from './ui'

const STATUSES = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled']

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function Kpi({ tone, label, value, sub, icon: Icon, to }) {
  const body = (
    <>
      <div className="sb-kpi-top">
        <span>{label}</span>
        <span><Icon size={16} /></span>
      </div>
      <div className="sb-kpi-value sb-num">{value}</div>
      {sub && <div className="sb-kpi-sub">{sub}</div>}
    </>
  )
  return to ? (
    <Link to={to} className={`sb-kpi sb-kpi--${tone}`}>{body}</Link>
  ) : (
    <div className={`sb-kpi sb-kpi--${tone}`}>{body}</div>
  )
}

function Todo({ count, label, to }) {
  return (
    <Link to={to} className={`sb-todo${count ? '' : ' is-calm'}`}>
      <b className="sb-num">{count}</b>
      <span>{label}</span>
      <ArrowRight size={16} />
    </Link>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  usePageTitle('Overview')

  useEffect(() => {
    api.get('/admin/analytics').then(setData).catch((e) => setError(e.message))
  }, [])

  const counts = data?.orderStatusCounts || {}
  const totalStatus = STATUSES.reduce((sum, s) => sum + (counts[s] || 0), 0)
  const months = data?.monthlyRevenue || []
  const maxMonth = Math.max(1, ...months.map((m) => m.total || 0))
  const thisMonth = months[months.length - 1]
  const lowStock = data?.lowStockProducts || []
  const firstName = (user?.name || 'there').split(' ')[0]
  const attention = (counts.pending || 0) + (counts.paid || 0)
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div>
      <section className="sb-hero">
        <div>
          <div className="sb-eyebrow"><Sparkles size={13} /> {today}</div>
          <h1>
            {greeting()}, <em>{firstName}</em>
          </h1>
          <p>
            {!data
              ? 'Getting today’s numbers ready…'
              : attention
                ? `${attention} order${attention === 1 ? '' : 's'} need${attention === 1 ? 's' : ''} your attention today.`
                : 'All caught up — no orders are waiting on you.'}
          </p>
        </div>
        <div className="sb-hero-actions">
          <Todo count={counts.pending || 0} label="New orders to confirm" to="/sabun-admin/orders?status=pending" />
          <Todo count={counts.paid || 0} label="Paid — ready to ship" to="/sabun-admin/orders?status=paid" />
          <Todo count={lowStock.length} label="Products running low" to="/sabun-admin/products?stock=low" />
        </div>
      </section>

      <Alert>{error}</Alert>

      <div className="sb-kpis">
        <Kpi tone="bloom" label="Revenue" icon={IndianRupee} value={data ? inr(data.totalRevenue) : '—'} sub="Paid, shipped & delivered" />
        <Kpi
          tone="butter"
          label="Orders"
          icon={ShoppingBag}
          to="/sabun-admin/orders"
          value={data ? data.totalOrders : '—'}
          sub={thisMonth ? `${thisMonth.orders || 0} paid this month` : ' '}
        />
        <Kpi
          tone="sage"
          label="Products"
          icon={Package}
          to="/sabun-admin/products"
          value={data ? data.totalProducts : '—'}
          sub={data ? (lowStock.length ? `${lowStock.length} low on stock` : 'Stock looks healthy') : ' '}
        />
        <Kpi tone="sky" label="Customers" icon={Users} to="/sabun-admin/users" value={data ? data.totalUsers : '—'} sub="Registered accounts" />
      </div>

      <div className="sb-dash">
        <div className="sb-stack">
          <section className="sb-card sb-pad">
            <div className="sb-card-head">
              <div>
                <h2>Revenue</h2>
                <p>Last 6 months · paid, shipped and delivered orders</p>
              </div>
              {thisMonth && <span className="sb-price sb-num">{inr(thisMonth.total)}</span>}
            </div>
            {!data && <div className="sb-chart" aria-hidden="true" />}
            {data && (
              <div className="sb-chart" role="img" aria-label="Revenue per month">
                {months.map((m, i) => (
                  <div key={m.label} className={`sb-chart-col${i === months.length - 1 ? ' is-now' : ''}`} title={`${m.label}: ${inr(m.total)}`}>
                    <span className="sb-chart-val sb-num">{m.total ? inr(m.total) : '—'}</span>
                    <span className="sb-chart-bar" style={{ height: `${Math.max(3, (m.total / maxMonth) * 100)}%` }} />
                    <span className="sb-chart-label">{m.label.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="sb-card sb-pad">
            <div className="sb-card-head">
              <div>
                <h2>Latest orders</h2>
                <p>The five most recent orders from the shop</p>
              </div>
              <Link to="/sabun-admin/orders" className="sb-link">All orders <ArrowUpRight size={15} /></Link>
            </div>
            {data && !data.recentOrders?.length && (
              <Empty icon={ShoppingBag} title="No orders yet">Orders placed at checkout will show up here.</Empty>
            )}
            <ul className="sb-list">
              {(data?.recentOrders || []).map((order) => (
                <li key={order._id}>
                  <Link to="/sabun-admin/orders" state={{ highlightId: order._id }} className="sb-row">
                    <span className="sb-ref">#{String(order.ref || '').slice(-3)}</span>
                    <span className="sb-row-main">
                      <strong>{order.customer?.name || 'Customer'}</strong>
                      <span>{order.ref} · {timeAgo(order.createdAt)} · {(order.items || []).map((i) => i.name).join(', ')}</span>
                    </span>
                    <span className="sb-row-end">
                      <strong className="sb-num">{inr(order.total)}</strong>
                      <StatusPill status={order.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="sb-stack">
          <section className="sb-card sb-pad">
            <div className="sb-card-head">
              <div>
                <h2>Order pipeline</h2>
                <p>{totalStatus} order{totalStatus === 1 ? '' : 's'} in total</p>
              </div>
            </div>
            <div className="sb-pipe" aria-hidden="true">
              {STATUSES.map((s) =>
                counts[s] ? <span key={s} style={{ '--c': STATUS_COLOR[s], flex: counts[s] }} /> : null,
              )}
            </div>
            <div className="sb-legend">
              {STATUSES.map((s) => (
                <Link key={s} to={`/sabun-admin/orders?status=${s}`} style={{ '--c': STATUS_COLOR[s] }}>
                  <i /> {s} <b className="sb-num">{counts[s] || 0}</b>
                </Link>
              ))}
            </div>
          </section>

          <section className="sb-card sb-pad">
            <div className="sb-card-head">
              <div>
                <h2>Running low</h2>
                <p>10 or fewer left in stock</p>
              </div>
              <Link to="/sabun-admin/products" className="sb-link">Products <ArrowUpRight size={15} /></Link>
            </div>
            {data && !lowStock.length && (
              <Empty icon={CheckCircle2} title="All stocked up">Nothing is running low right now.</Empty>
            )}
            <ul className="sb-list">
              {lowStock.map((p) => {
                const left = Number(p.stock) || 0
                return (
                  <li key={p.id}>
                    <Link to={`/sabun-admin/edit-product/${encodeURIComponent(p.id)}`} className="sb-row">
                      {(p.thumb || p.img) ? <img className="sb-thumb" src={p.thumb || p.img} alt="" /> : <span className="sb-thumb" />}
                      <span className="sb-row-main">
                        <strong>{p.name}</strong>
                        <span>{p.variant || p.id}</span>
                      </span>
                      <span className="sb-row-end">
                        <span className={`sb-stock ${left <= 0 ? 'is-out' : 'is-low'}`}>
                          {left <= 0 ? <><PackageX size={12} style={{ verticalAlign: -2 }} /> Sold out</> : `${left} left`}
                        </span>
                        <span className={`sb-stockbar${left <= 0 ? ' is-out' : ''}`}>
                          <span style={{ width: `${Math.max(6, (left / 10) * 100)}%` }} />
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
