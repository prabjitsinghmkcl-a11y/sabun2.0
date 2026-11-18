import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useProducts } from '../../context/ProductsContext'
import usePageTitle from '../../components/usePageTitle'
import ProductForm, { emptyProduct, formToPayload, validateProductForm } from './ProductForm'

export default function AddProduct() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { refresh } = useProducts()
  const [form, setForm] = useState({ ...emptyProduct })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  usePageTitle('Add product')

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const problem = validateProductForm(form)
    if (problem) return setError(problem)

    setBusy(true)
    try {
      await api.post('/admin/products', formToPayload(form))
      await refresh()
      navigate('/sabun-admin/products', { replace: true, state: { message: `Created “${form.name}”` } })
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

  return (
    <div>
      <ProductForm
        error={error}
        form={form}
        setForm={setForm}
        busy={busy}
        onSubmit={onSubmit}
        onCancel={() => navigate('/sabun-admin/products')}
      />
    </div>
  )
}
