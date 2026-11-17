import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { ExternalLink, LayoutGrid, List, Loader2, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useProducts } from '../../context/ProductsContext'
import usePageTitle from '../../components/usePageTitle'
import { Alert, Empty, PageHead, inr } from './ui'

const VIEW_KEY = 'sabun-admin-products-view'

function StockTag({ stock }) {
  const value = Number(stock) || 0
  if (value <= 0) return <span className="sb-stock is-out">Sold out</span>
  if (value <= 10) return <span className="sb-stock is-low">{value} left</span>
  return <span className="sb-stock is-ok">{value} in stock</span>
}

export default function AdminProducts() {
  const { refresh, collections } = useProducts()
  const location = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState(location.state?.message || '')
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem(VIEW_KEY) || 'grid'
    } catch {
      return 'grid'
    }
  })
  const category = params.get('category') || ''
  const lowOnly = params.get('stock') === 'low'
  usePageTitle('Products')

  const load = async () => {
    try {
      setProducts((await api.get('/admin/products')).products || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!location.state?.message) return
    setMsg(location.state.message)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location.state, location.pathname, location.search, navigate])

  const changeView = (next) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      /* ignore */
    }
  }

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const categories = useMemo(() => {
    const ids = new Set(collections.filter((c) => c.id !== 'all').map((c) => c.id))
    for (const product of products) if (product.tag) ids.add(product.tag)
    return [...ids].sort()
  }, [collections, products])

  const countBy = useMemo(() => {
    const c = {}
    for (const p of products) if (p.tag) c[p.tag] = (c[p.tag] || 0) + 1
    return c
  }, [products])
  const lowCount = products.filter((p) => (Number(p.stock) || 0) <= 10).length

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return products
      .filter((p) => {
        if (category && p.tag !== category) return false
        if (lowOnly && (Number(p.stock) || 0) > 10) return false
        if (!term) return true
        return `${p.name} ${p.variant} ${p.id} ${p.tag} ${p.desc}`.toLowerCase().includes(term)
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [products, q, category, lowOnly])

  const remove = async (product) => {
    if (!window.confirm(`Delete “${product.name}” (${product.id})? This cannot be undone.`)) return
    setError('')
    setMsg('')
    setBusyId(product.id)
    try {
      await api.del(`/admin/products/${encodeURIComponent(product.id)}`)
      setProducts((list) => list.filter((p) => p.id !== product.id))
      setMsg(`Deleted “${product.name}”`)
      refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const editHref = (p) => `/admin/edit-product/${encodeURIComponent(p.id)}`

  return (
    <div>
      <PageHead eyebrow="Catalogue" title="Products" sub={`${products.length} soap${products.length === 1 ? '' : 's'} in the shop. Changes go live the moment you save.`}>
        <Link to="/admin/add-product" className="sb-btn sb-btn--primary">
          <Plus size={16} /> Add product
        </Link>
      </PageHead>

      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="ok" onClose={() => setMsg('')}>{msg}</Alert>

      <div className="sb-toolbar">
        <div className="sb-search">
          <Search size={16} />
          <input type="search" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="sb-spacer" />
        <span className="sb-muted sb-small">{shown.length} shown</span>
        <div className="sb-seg" role="group" aria-label="View">
          <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => changeView('grid')} aria-pressed={view === 'grid'}>
            <LayoutGrid size={15} /> Grid
          </button>
          <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => changeView('list')} aria-pressed={view === 'list'}>
            <List size={15} /> List
          </button>
        </div>
      </div>

      <div className="sb-chips" style={{ marginBottom: 20 }}>
        <button type="button" className={`sb-chip${!category && !lowOnly ? ' is-active' : ''}`} onClick={() => setParams({}, { replace: true })}>
          All <b>{products.length}</b>
        </button>
        {categories.map((c) => (
          <button key={c} type="button" className={`sb-chip${category === c ? ' is-active' : ''}`} onClick={() => setFilter('category', category === c ? '' : c)}>
            {c} <b>{countBy[c] || 0}</b>
          </button>
        ))}
        <button
          type="button"
          className={`sb-chip${lowOnly ? ' is-active' : ''}`}
          style={{ '--c': '#e0a106' }}
          onClick={() => setFilter('stock', lowOnly ? '' : 'low')}
        >
          <i /> Low stock <b>{lowCount}</b>
        </button>
      </div>

      {!loaded && <div className="sb-card"><Empty icon={Loader2} title="Loading products…" /></div>}

      {loaded && !shown.length && (
        <div className="sb-card">
          <Empty icon={Package} title={products.length ? 'No matches' : 'No products yet'}>
            {products.length ? 'Try a different search or filter.' : 'Add your first soap to start selling.'}
            {!products.length && <Link to="/admin/add-product" className="sb-btn sb-btn--primary"><Plus size={16} /> Add product</Link>}
          </Empty>
        </div>
      )}

      {!!shown.length && view === 'grid' && (
        <div className="sb-pgrid">
          {shown.map((p) => (
            <article key={p.id} className="sb-pc">
              <div className="sb-pc-media" style={{ '--tint': p.tint || undefined }}>
                <Link to={editHref(p)} aria-label={`Edit ${p.name}`}>
                  {(p.thumb || p.img) ? (
                    <img src={p.thumb || p.img} alt={p.alt || p.name} loading="lazy" />
                  ) : (
                    <span className="sb-empty" style={{ height: '100%', justifyContent: 'center' }}><Package size={28} /></span>
                  )}
                </Link>
                {p.isNew && <span className="sb-pill sb-pill--new sb-pill--plain">New</span>}
                <div className="sb-pc-menu">
                  <Link to={editHref(p)} aria-label={`Edit ${p.name}`} title="Edit"><Pencil size={15} /></Link>
                  <a href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer" aria-label="View in shop" title="View in shop"><ExternalLink size={15} /></a>
                  <button type="button" className="is-danger" disabled={busyId === p.id} onClick={() => remove(p)} aria-label={`Delete ${p.name}`} title="Delete">
                    {busyId === p.id ? <Loader2 size={15} className="sb-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
              <div className="sb-pc-body">
                <div>
                  {p.tag && <div className="sb-pc-tag">{p.tag}</div>}
                  <Link to={editHref(p)} className="sb-pc-name" style={{ textDecoration: 'none', display: 'block' }}>{p.name}</Link>
                  {p.variant && <div className="sb-pc-variant">{p.variant}</div>}
                </div>
                <div className="sb-pc-foot">
                  <span className="sb-price sb-num">{inr(p.price)}</span>
                  <StockTag stock={p.stock} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!!shown.length && view === 'list' && (
        <div className="sb-card sb-scroll-x">
          <table className="sb-ptable">
            <thead>
              <tr><th>Product</th><th>Collection</th><th>Price</th><th>Stock</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={editHref(p)} className="sb-row">
                      {(p.thumb || p.img) ? <img className="sb-thumb" src={p.thumb || p.img} alt="" loading="lazy" /> : <span className="sb-thumb" />}
                      <span className="sb-row-main">
                        <strong>{p.name} {p.isNew && <span className="sb-pill sb-pill--new sb-pill--plain" style={{ height: 18, fontSize: 10 }}>New</span>}</strong>
                        <span>{p.variant || p.id}</span>
                      </span>
                    </Link>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{p.tag || <span className="sb-muted">—</span>}</td>
                  <td className="sb-num" style={{ fontWeight: 700 }}>{inr(p.price)}</td>
                  <td><StockTag stock={p.stock} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <Link to={editHref(p)} className="sb-btn sb-btn--sm"><Pencil size={14} /> Edit</Link>
                      <a href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer" className="sb-btn sb-btn--sm sb-btn--icon" aria-label="View in shop"><ExternalLink size={14} /></a>
                      <button type="button" className="sb-btn sb-btn--sm sb-btn--icon sb-btn--danger" disabled={busyId === p.id} onClick={() => remove(p)} aria-label={`Delete ${p.name}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
