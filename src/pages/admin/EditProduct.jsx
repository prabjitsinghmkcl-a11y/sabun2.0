import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useProducts } from '../../context/ProductsContext'
import usePageTitle from '../../components/usePageTitle'
import { Loader2 } from 'lucide-react'
import { Alert, Empty } from './ui'
import ProductForm, { emptyProduct, formToPayload, productToForm, validateProductForm } from './ProductForm'

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { refresh } = useProducts()
  const [form, setForm] = useState({ ...emptyProduct })
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  usePageTitle('Edit product')

  useEffect(() => {
    let cancelled = false
    api
      .get(`/products/${encodeURIComponent(id)}`)
      .then((data) => {
        if (!cancelled && data?.product) setForm(productToForm(data.product))
      })
      .catch((err) => {
        if (!cancelled) setError(err.status === 404 ? 'Product not found.' : err.message)
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const problem = validateProductForm(form, { editing: true })
    if (problem) return setError(problem)

    setBusy(true)
    try {
      await api.put(`/admin/products/${encodeURIComponent(id)}`, formToPayload(form))
      await refresh()
      navigate('/sabun-admin/products', { replace: true, state: { message: `Updated “${form.name}”` } })
    } catch (err) {
      if (err?.name === 'SessionExpiredError' || err?.status === 401) {
        logout()
        navigate('/sabun-admin/login', { replace: true })
        return
      }
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!loaded) {
    return <div className="sb-card"><Empty icon={Loader2} title="Loading product…" /></div>
  }

  if (error && !form.name) {
    return (
      <div className="sb-card sb-pad">
        <Alert>{error}</Alert>
        <Link to="/sabun-admin/products" className="sb-btn">← Back to products</Link>
      </div>
    )
  }

  return (
    <div>
      <ProductForm
        error={error}
        form={form}
        setForm={setForm}
        editing
        busy={busy}
        onSubmit={onSubmit}
        onCancel={() => navigate('/sabun-admin/products')}
      />
    </div>
  )
}
