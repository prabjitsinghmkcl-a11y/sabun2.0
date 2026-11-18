import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import usePageTitle from '../../components/usePageTitle'
import { Alert } from './ui'
import './admin.css'

export default function AdminLogin() {
  const { user, login, logout, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  usePageTitle('Admin login')

  if (!loading && user?.role === 'admin') return <Navigate to="/sabun-admin" replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const u = await login(email.trim(), password)
      if (u?.role !== 'admin') {
        logout()
        setError('This account does not have admin access.')
        return
      }
      navigate('/sabun-admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sb sb-login">
      <div className="sb-login-box">
        <div className="sb-logo">
          <span className="sb-logo-mark">S</span>
          <span>
            <b>SaBun</b>
            <span>Shop admin</span>
          </span>
        </div>

        <form onSubmit={onSubmit} className="sb-card sb-login-card">
          <h2>Sign in to admin</h2>
          <p className="sb-muted" style={{ marginBottom: 22 }}>Manage products, orders, customers and site settings.</p>

          <label className="sb-field">
            <span className="sb-label">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              required
              autoFocus
            />
          </label>
          <label className="sb-field">
            <span className="sb-label">Password</span>
            <span className="sb-pass">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>

          <Alert>{error}</Alert>

          <button disabled={busy} type="submit" className="sb-btn sb-btn--primary sb-btn--block" style={{ height: 40, marginTop: 4 }}>
            {busy ? <Loader2 size={16} className="sb-spin" /> : <Lock size={15} />}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="sb-login-foot">
          <Link to="/" className="sb-link">
            <ArrowLeft size={14} /> Back to the shop
          </Link>
        </div>
      </div>
    </div>
  )
}
