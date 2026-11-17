import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { products as staticProducts, collections as staticCollections, getProduct as getStaticProduct } from '../data/products'

const ProductsContext = createContext(null)

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(staticProducts)
  const [collections, setCollections] = useState(staticCollections)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const [p, s] = await Promise.all([
        api.get('/products').catch(() => null),
        api.get('/settings').catch(() => null),
      ])
      if (p?.products?.length) setProducts(p.products)
      if (s?.settings?.collections?.length) setCollections(s.settings.collections)
    } catch {
      // keep static fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const value = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]))
    return {
      products,
      collections,
      loading,
      refresh,
      getProduct: (id) => byId.get(id) || getStaticProduct(id),
    }
  }, [products, collections, loading])

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts must be used inside <ProductsProvider>')
  return ctx
}
