import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import {
  ChevronRight,
  CornerDownLeft,
  ExternalLink,
  Home,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import usePageTitle from './usePageTitle'
import AdminOrderToasts from '../pages/admin/AdminOrderToasts'
import { initials } from '../pages/admin/ui'
import '../pages/admin/admin.css'

const nav = [
  { to: '/sabun-admin', label: 'Overview', icon: Home, end: true },
  { to: '/sabun-admin/orders', label: 'Orders', icon: ShoppingBag, badge: true },
  { to: '/sabun-admin/products', label: 'Products', icon: Package },
  { to: '/sabun-admin/users', label: 'Customers', icon: Users },
  { to: '/sabun-admin/settings', label: 'Settings', icon: Settings },
]

function pageName(pathname) {
  if (pathname.startsWith('/sabun-admin/add-product')) return ['Products', 'New product']
  if (pathname.startsWith('/sabun-admin/edit-product')) return ['Products', 'Edit product']
  const hit = [...nav].reverse().find((n) => (n.end ? pathname === n.to || pathname === `${n.to}/` : pathname.startsWith(n.to)))
  return [hit?.label || 'Overview']
}

/* ---------- Ctrl/⌘ K command palette ---------- */
function CommandPalette({ open, onClose, logout }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  const commands = useMemo(
    () => [
      ...nav.map((n) => ({ group: 'Go to', label: n.label, icon: n.icon, run: () => navigate(n.to) })),
      { group: 'Go to', label: 'Pending orders', icon: ShoppingBag, run: () => navigate('/sabun-admin/orders?status=pending') },
      { group: 'Go to', label: 'Paid orders (ready to ship)', icon: ShoppingBag, run: () => navigate('/sabun-admin/orders?status=paid') },
      { group: 'Actions', label: 'Add a new product', icon: Plus, run: () => navigate('/sabun-admin/add-product') },
      { group: 'Actions', label: 'Open the shop', icon: ExternalLink, run: () => window.open('/', '_blank', 'noopener') },
      { group: 'Actions', label: 'Sign out', icon: LogOut, run: logout },
    ],
    [navigate, logout],
  )

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    return term ? commands.filter((c) => c.label.toLowerCase().includes(term)) : commands
  }, [q, commands])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])
  useEffect(() => setActive(0), [q])

  if (!open) return null

  const run = (cmd) => {
    onClose()
    cmd?.run()
  }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results[active])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  let lastGroup = null
  return (
    <div className="sb-cmdk" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="Quick search">
      <div className="sb-cmdk-box">
        <div className="sb-cmdk-input">
          <Search size={18} />
          <input ref={inputRef} type="text" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Jump to a page or action…" aria-label="Search commands" />
          <kbd>Esc</kbd>
        </div>
        <ul className="sb-cmdk-list" role="listbox">
          {!results.length && <li className="sb-cmdk-empty">Nothing matches “{q}”.</li>}
          {results.map((c, i) => {
            const Icon = c.icon
            const header = c.group !== lastGroup ? <li className="sb-cmdk-group" role="presentation">{c.group}</li> : null
            lastGroup = c.group
            return [
              header,
              <li
                key={c.label}
                role="option"
                aria-selected={i === active}
                className={`sb-cmdk-item${i === active ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(c)}
              >
                <Icon size={16} />
                {c.label}
                {i === active && <small><CornerDownLeft size={13} /></small>}
              </li>,
            ]
          })}
        </ul>
        <div className="sb-cmdk-foot">
          <span><kbd>↑</kbd> <kbd>↓</kbd> move</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

/* ---------- Account card + menu (bottom of sidebar) ---------- */
function MeMenu({ user, logout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="sb-me" ref={ref}>
      {open && (
        <div className="sb-menu" role="menu">
          <div className="sb-menu-head">
            <strong>{user?.name || 'Admin'}</strong>
            <span>{user?.email}</span>
          </div>
          <a href="/" target="_blank" rel="noopener noreferrer" role="menuitem">
            <ExternalLink size={15} /> Open the shop
          </a>
          <Link to="/sabun-admin/settings" role="menuitem">
            <Settings size={15} /> Site settings
          </Link>
          <button type="button" className="is-danger" onClick={logout} role="menuitem">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
      <button
        type="button"
        className="sb-side-card"
        style={{ width: '100%', font: 'inherit', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="sb-avatar">{initials(user?.name, user?.email)}</span>
        <div>
          <strong>{user?.name || 'Admin'}</strong>
          <span>{user?.email}</span>
        </div>
      </button>
    </div>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [pending, setPending] = useState(0)
  const [drawer, setDrawer] = useState(false)
  const [cmdk, setCmdk] = useState(false)
  usePageTitle('Admin')

  useEffect(() => setDrawer(false), [location.pathname, location.search])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdk((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const crumbs = pageName(location.pathname)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '')

  return (
    <div className={`sb sb-shell${drawer ? ' is-drawer' : ''}`}>
      <aside className="sb-side" aria-label="Admin navigation">
        <Link to="/sabun-admin" className="sb-logo" aria-label="SaBun admin home">
          <span className="sb-logo-mark">S</span>
          <span>
            <b>SaBun</b>
            <span>Shop admin</span>
          </span>
        </Link>

        <Link to="/sabun-admin/add-product" className="sb-btn sb-btn--primary sb-btn--new">
          <Plus size={16} /> New product
        </Link>

        <div>
          <div className="sb-side-label">Manage</div>
          <nav className="sb-nav">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
                  <Icon size={17} />
                  {item.label}
                  {item.badge && pending > 0 && <span className="sb-count">{pending > 99 ? '99+' : pending}</span>}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="sb-side-foot">
          <nav className="sb-nav">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink size={17} /> View shop
            </a>
          </nav>
          <MeMenu user={user} logout={logout} />
        </div>
      </aside>
      <div className="sb-scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header className="sb-topbar">
          <button type="button" className="sb-btn sb-btn--ghost sb-btn--icon sb-menu-btn" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="sb-crumbs">
            <span>Admin</span>
            {crumbs.map((c, i) => (
              <span key={c} style={{ display: 'contents' }}>
                <ChevronRight size={14} />
                {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
              </span>
            ))}
          </div>
          <button type="button" className="sb-cmdk-btn" onClick={() => setCmdk(true)} aria-label="Quick search">
            <Search size={16} />
            <span>Search or jump to…</span>
            <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
          </button>
        </header>

        <main className="sb-main">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={cmdk} onClose={() => setCmdk(false)} logout={logout} />
      <AdminOrderToasts onPendingCount={setPending} />
    </div>
  )
}
