import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, TOKEN_KEY } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((data) => setUser(data.user || null))
      .catch((err) => {
        // Only forget the token if the server actually rejected it (not on network errors)
        if (err.status === 401) localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // Any API call that returns 401 (expired token) logs the admin out
  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
    window.addEventListener('sabun:unauthorized', onUnauthorized)
    return () => window.removeEventListener('sabun:unauthorized', onUnauthorized)
  }, [])

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user || null)
    return data.user
  }

  // Customers log in only with a 6-digit OTP sent to their mobile number.
  // Passing a name creates the account when the number is new.
  const sendOtp = async (phone) => api.post('/auth/otp/send', { phone })

  const loginWithOtp = async (phone, otp, details = {}) => {
    const data = await api.post('/auth/otp/verify', { phone, otp, ...details })
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user || null)
    return data.user
  }

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const updateUser = useCallback((next) => setUser(next || null), [])

  const value = useMemo(
    () => ({ user, loading, login, sendOtp, loginWithOtp, logout, updateUser, isAdmin: user?.role === 'admin' }),
    [user, loading, logout, updateUser],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
