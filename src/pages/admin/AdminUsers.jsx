import { useEffect, useMemo, useState } from 'react'
import { Loader2, Mail, Phone, Search, ShieldCheck, Trash2, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import usePageTitle from '../../components/usePageTitle'
import { Alert, Empty, PageHead, initials } from './ui'

export default function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  usePageTitle('Customers')

  const load = async () => {
    try {
      setUsers((await api.get('/admin/users')).users || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const setUserRole = async (user, nextRole) => {
    setError('')
    setMsg('')
    if (nextRole === 'admin' && !window.confirm(`Give ${user.email} full admin access?`)) return
    try {
      const data = await api.put(`/admin/users/${user.id}/role`, { role: nextRole })
      setUsers((list) => list.map((item) => (item.id === user.id ? { ...item, role: data.user.role } : item)))
      setMsg(`${user.email} is now ${nextRole}`)
    } catch (e) {
      setError(e.message)
    }
  }

  const remove = async (user) => {
    if (!window.confirm(`Delete user ${user.email}? This cannot be undone.`)) return
    setError('')
    setMsg('')
    try {
      await api.del(`/admin/users/${user.id}`)
      setUsers((list) => list.filter((item) => item.id !== user.id))
      setMsg(`Deleted ${user.email}`)
    } catch (e) {
      setError(e.message)
    }
  }

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return users.filter((user) => {
      if (role && user.role !== role) return false
      if (!term) return true
      return `${user.name} ${user.email} ${user.phone}`.toLowerCase().includes(term)
    })
  }, [users, q, role])

  const adminCount = users.filter((u) => u.role === 'admin').length

  return (
    <div>
      <PageHead eyebrow="People" title="Customers" sub="Everyone with an account on the shop. Give trusted people admin access here." />

      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="ok" onClose={() => setMsg('')}>{msg}</Alert>

      <div className="sb-toolbar">
        <div className="sb-search">
          <Search size={16} />
          <input type="search" placeholder="Search name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="sb-spacer" />
        <div className="sb-seg" role="group" aria-label="Filter by role">
          <button type="button" className={!role ? 'is-active' : ''} onClick={() => setRole('')}>All · {users.length}</button>
          <button type="button" className={role === 'user' ? 'is-active' : ''} onClick={() => setRole('user')}>Customers · {users.length - adminCount}</button>
          <button type="button" className={role === 'admin' ? 'is-active' : ''} onClick={() => setRole('admin')}>Admins · {adminCount}</button>
        </div>
      </div>

      {!loaded && <div className="sb-card"><Empty icon={Loader2} title="Loading people…" /></div>}
      {loaded && !shown.length && (
        <div className="sb-card"><Empty icon={Users} title="Nobody here">No accounts match your search.</Empty></div>
      )}

      <div className="sb-people">
        {shown.map((user) => {
          const isMe = user.id === me?.id
          return (
            <article key={user.id} className="sb-card sb-person-card">
              <header>
                <span className="sb-avatar sb-avatar--lg">{initials(user.name, user.email)}</span>
                <div>
                  <strong>{user.name || 'No name'} {isMe && <span className="sb-muted" style={{ fontWeight: 600 }}>(you)</span>}</strong>
                  <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                </div>
                {user.role === 'admin' && <span className="sb-pill sb-pill--admin sb-pill--plain">Admin</span>}
              </header>
              <div className="sb-contact">
                <a href={`mailto:${user.email}`}><Mail size={14} /> <span>{user.email}</span></a>
                {user.phone ? (
                  <a href={`tel:${user.phone}`}><Phone size={14} /> <span>{user.phone}</span></a>
                ) : (
                  <span className="sb-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} /> No phone</span>
                )}
                {user.verified && <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--sb-ok)', fontWeight: 700 }}><ShieldCheck size={14} /> Verified</span>}
              </div>
              <footer>
                <div className="sb-seg" role="group" aria-label={`Access for ${user.email}`}>
                  <button type="button" disabled={isMe} className={user.role === 'user' ? 'is-active' : ''} onClick={() => user.role !== 'user' && setUserRole(user, 'user')} title={isMe ? "You can't change your own access" : ''}>
                    Customer
                  </button>
                  <button type="button" disabled={isMe} className={user.role === 'admin' ? 'is-active' : ''} onClick={() => user.role !== 'admin' && setUserRole(user, 'admin')} title={isMe ? "You can't change your own access" : ''}>
                    Admin
                  </button>
                </div>
                {!isMe && (
                  <button type="button" className="sb-btn sb-btn--sm sb-btn--icon sb-btn--danger" onClick={() => remove(user)} aria-label={`Delete ${user.email}`} title="Delete account">
                    <Trash2 size={14} />
                  </button>
                )}
              </footer>
            </article>
          )
        })}
      </div>
    </div>
  )
}
