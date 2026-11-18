import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ShoppingBag, X } from 'lucide-react'
import { api } from '../../lib/api'

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

// Polls the admin order feed and shows a small toast for every new order.
// The first response only seeds the "seen" set, so the existing backlog
// never shows up as a notification.
export default function AdminOrderToasts({ onPendingCount }) {
  const navigate = useNavigate()
  const seen = useRef(null)
  const timers = useRef(new Map())
  const [toasts, setToasts] = useState([])
  const reportRef = useRef(onPendingCount)
  useEffect(() => {
    reportRef.current = onPendingCount
  })

  useEffect(() => {
    let cancelled = false
    const timerMap = timers.current

    const dismiss = (id) => {
      setToasts((list) => list.filter((t) => t.id !== id))
      const timer = timerMap.get(id)
      if (timer) clearTimeout(timer)
      timerMap.delete(id)
    }

    const check = async () => {
      try {
        const data = await api.get('/admin/orders')
        const orders = data.orders || []
        if (cancelled) return
        reportRef.current?.(orders.filter((o) => (o.status || 'pending') === 'pending').length)

        if (seen.current === null) {
          seen.current = new Set(orders.map((o) => o._id))
          return
        }

        const fresh = orders.filter((o) => !seen.current.has(o._id))
        for (const order of fresh) seen.current.add(order._id)
        if (!fresh.length) return

        setToasts((list) => {
          const next = [
            ...fresh.map((o) => ({
              id: o._id,
              ref: o.ref,
              name: o.customer?.name || 'Customer',
              total: o.total,
            })),
            ...list,
          ].slice(0, 3)
          return next
        })

        for (const order of fresh) {
          const timer = setTimeout(() => dismiss(order._id), 4000)
          timerMap.set(order._id, timer)
        }
      } catch {
        // Network hiccups are ignored — polling will try again.
      }
    }

    check()
    const interval = setInterval(check, 30000)
    // Orders page fires this after a status change so the nav badge updates at once
    window.addEventListener('sabun:orders-changed', check)
    return () => {
      cancelled = true
      window.removeEventListener('sabun:orders-changed', check)
      clearInterval(interval)
      for (const timer of timerMap.values()) clearTimeout(timer)
      timerMap.clear()
    }
  }, [])

  if (!toasts.length) return null

  return (
    <div className="sb-toasts" aria-live="polite" aria-label="New orders">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className="sb-toast"
          onClick={() => {
            navigate('/sabun-admin/orders', { state: { highlightId: toast.id } })
            setToasts((list) => list.filter((t) => t.id !== toast.id))
          }}
        >
          <span className="sb-toast-icon"><ShoppingBag size={17} /></span>
          <span className="sb-toast-body">
            <strong>New order {toast.ref}</strong>
            <span>{toast.name} · {inr(toast.total)}</span>
          </span>
          <span
            className="sb-toast-x"
            role="button"
            tabIndex={-1}
            aria-label="Dismiss"
            onClick={(event) => {
              event.stopPropagation()
              setToasts((list) => list.filter((t) => t.id !== toast.id))
            }}
          >
            <X size={14} />
          </span>
        </button>
      ))}
    </div>
  )
}
