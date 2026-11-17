import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import ProductCard from '../components/ProductCard'
import usePageTitle from '../components/usePageTitle'
import { WhatsAppIcon } from '../components/Icons'
import { useProducts } from '../context/ProductsContext'
import { useSite } from '../context/SiteContext'

const sorts = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'name', label: 'Name: A–Z' },
]

export default function Shop() {
  const { products, collections } = useProducts()
  const { waLink, copy } = useSite()
  const shopCopy = copy?.shop || {}
  const [params, setParams] = useSearchParams()
  const active = collections.some((c) => c.id === params.get('c')) ? params.get('c') : 'all'
  const sort = sorts.some((s) => s.id === params.get('sort')) ? params.get('sort') : 'featured'

  usePageTitle('Shop all soaps')

  const update = (key, value, fallback) => {
    const next = new URLSearchParams(params)
    if (value === fallback) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true, preventScrollReset: true })
  }

  const visible = useMemo(() => {
    const list = products.filter((p) => active === 'all' || p.tag === active)
    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'name')
      return [...list].sort((a, b) => `${a.name} ${a.variant}`.localeCompare(`${b.name} ${b.variant}`))
    return list
  }, [active, sort, products])

  const countFor = (id) => (id === 'all' ? products.length : products.filter((p) => p.tag === id).length)

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">{shopCopy.eyebrow || 'The shop'}</p>
          <h1 className="page-title">{shopCopy.title || 'Every little joy, in one place.'}</h1>
          <p className="page-lede">{shopCopy.lede}</p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="shop-toolbar">
            <div className="chips" role="group" aria-label="Filter by collection">
              {collections.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`chip${active === c.id ? ' is-active' : ''}`}
                  aria-pressed={active === c.id}
                  onClick={() => update('c', c.id, 'all')}
                >
                  {c.label}
                  <span className="chip-count">{countFor(c.id)}</span>
                </button>
              ))}
            </div>

            <label className="sort">
              <span>Sort</span>
              <select value={sort} onChange={(e) => update('sort', e.target.value, 'featured')}>
                {sorts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="shop-count" aria-live="polite">
            Showing {visible.length} {visible.length === 1 ? 'soap' : 'soaps'}
          </p>

          <div className="product-grid product-grid--shop" key={`${active}-${sort}`}>
            {visible.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} eager={index < 3} />
            ))}
          </div>

          <div className="custom-band" data-reveal>
            <div>
              <h2>{shopCopy.customTitle || 'Looking for something custom?'}</h2>
              <p>{shopCopy.customText}</p>
            </div>
            <a
              className="btn btn--primary"
              href={waLink("Hi SaBun! I'm interested in a custom / bulk order. Here's what I have in mind:")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon /> {shopCopy.customCta || 'Ask about custom orders'}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
