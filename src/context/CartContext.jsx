import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useProducts } from './ProductsContext'
import { useSite } from './SiteContext'
import { MAX_QTY as DEFAULT_MAX_QTY } from '../data/site'

const STORAGE_KEY = 'sabun-cart-v1'
const CartContext = createContext(null)

// A personalised item ("AISH") is its own cart line, separate from "RAHI"
const lineKey = (id, custom) => (custom ? `${id}::${custom}` : id)

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Products can come from the database (added in admin), so we don't drop
    // unknown ids here — missing products are simply skipped when rendering.
    return parsed
      .filter((line) => line && typeof line.id === 'string')
      .map((line) => {
        const custom = typeof line.custom === 'string' ? line.custom.slice(0, 40) : ''
        return {
          key: lineKey(line.id, custom),
          id: line.id,
          custom,
          qty: Math.min(999, Math.max(1, Number(line.qty) || 1)),
        }
      })
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const { getProduct } = useProducts()
  const { MAX_QTY: siteMax } = useSite()
  const MAX_QTY = Number(siteMax) > 0 ? Number(siteMax) : DEFAULT_MAX_QTY
  const [lines, setLines] = useState(readStoredCart)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* storage unavailable — cart still works for this visit */
    }
  }, [lines])

  // Keep several open tabs in sync
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) setLines(readStoredCart())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const addItem = useCallback((id, qty = 1, { silent = false, custom = '' } = {}) => {
    const product = getProduct(id)
    if (!product) return
    const key = lineKey(id, custom)
    setLines((current) => {
      const existing = current.find((line) => line.key === key)
      if (existing) {
        return current.map((line) =>
          line.key === key ? { ...line, qty: Math.min(MAX_QTY, line.qty + qty) } : line,
        )
      }
      return [...current, { key, id, custom, qty: Math.min(MAX_QTY, qty) }]
    })
    if (!silent) setToast({ product, qty, custom, key: Date.now() })
  }, [getProduct, MAX_QTY])

  // setQty / removeItem take the line key (same as id for normal products)
  const setQty = useCallback((key, qty) => {
    setLines((current) =>
      qty <= 0
        ? current.filter((line) => line.key !== key)
        : current.map((line) =>
            line.key === key ? { ...line, qty: Math.min(MAX_QTY, qty) } : line,
          ),
    )
  }, [MAX_QTY])

  const removeItem = useCallback((key) => {
    setLines((current) => current.filter((line) => line.key !== key))
  }, [])

  const clearCart = useCallback(() => setLines([]), [])

  const value = useMemo(() => {
    const items = lines
      .map((line) => {
        const product = getProduct(line.id)
        if (!product) return null
        const qty = Math.min(MAX_QTY, line.qty)
        return { ...line, qty, product, lineTotal: product.price * qty }
      })
      .filter(Boolean)
    const count = items.reduce((sum, item) => sum + item.qty, 0)
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    return {
      items,
      count,
      subtotal,
      addItem,
      setQty,
      removeItem,
      clearCart,
      toast,
      dismissToast: () => setToast(null),
    }
  }, [lines, toast, addItem, setQty, removeItem, clearCart, getProduct, MAX_QTY])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
