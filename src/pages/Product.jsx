import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import ProductCard from '../components/ProductCard'
import QtyStepper from '../components/QtyStepper'
import usePageTitle from '../components/usePageTitle'
import { BagIcon, GiftIcon, PlusIcon, PromiseIcon, WhatsAppIcon } from '../components/Icons'
import { useCart } from '../context/CartContext'
import { useProducts } from '../context/ProductsContext'
import { useSite } from '../context/SiteContext'
import NotFound from './NotFound'

const infoBlocks = (product) => [
  {
    title: 'About this piece',
    text: product.longDesc || product.desc || 'Hand-sculpted soap, made in small batches.',
  },
  {
    title: 'Details',
    body: [
      'Hand-sculpted and finished by hand — every piece is slightly unique.',
      '100% natural, pure ingredients. Always palm-oil free.',
      'Want the full ingredient list? Message us and we will share it.',
    ],
  },
  {
    title: 'Care',
    body: [
      'Keep it on a draining soap dish, away from standing water between uses.',
      'Store display pieces in a cool, dry spot out of direct sunlight.',
    ],
  },
  {
    title: 'Delivery & payment',
    body: [
      'Send your order on WhatsApp from the cart — nothing is charged on the website.',
      'We confirm availability, delivery time and charges for your pincode, then share payment details.',
      'Made in small batches, so timelines can vary a little.',
    ],
  },
]

/* Soap-letter colours, taken from the bouquet photos */
const LETTER_COLOURS = ['#f08a3c', '#f0466e', '#f7e6cf', '#f5b83d', '#fbf6ef', '#e8336b', '#f7a1c0']

function NamePreview({ name, placeholder }) {
  const text = name || String(placeholder || '').replace(/^e\.g\.\s*/i, '')
  const letters = [...text]
  return (
    <div className={`name-preview${name ? '' : ' is-placeholder'}`} aria-hidden="true">
      {letters.map((ch, i) =>
        ch === ' ' ? (
          <span className="name-gap" key={i} />
        ) : (
          <span
            className="name-letter"
            key={`${i}-${ch}`}
            style={{
              '--c': LETTER_COLOURS[i % LETTER_COLOURS.length],
              '--r': `${((i * 37) % 9) - 4}deg`,
            }}
          >
            {ch}
          </span>
        ),
      )}
    </div>
  )
}

export default function Product() {
  const { id } = useParams()
  const { products, getProduct, loading } = useProducts()
  const { formatINR, waLink, content } = useSite()
  const promises = content?.promises || []
  const product = getProduct(id)
  const navigate = useNavigate()
  const { addItem, items } = useCart()
  const [qty, setQty] = useState(1)
  const [open, setOpen] = useState(0)
  const [custom, setCustom] = useState('')
  const [customError, setCustomError] = useState('')
  const [lastId, setLastId] = useState(id)
  const [buyVisible, setBuyVisible] = useState(true)
  const buyRef = useRef(null)

  // Reset when moving between products
  if (lastId !== id) {
    setLastId(id)
    setQty(1)
    setOpen(0)
    setCustom('')
    setCustomError('')
  }

  usePageTitle(product ? `${product.name} — ${product.variant}` : 'Not found')

  // Show the sticky mobile add bar only once the main buttons scroll away
  useEffect(() => {
    const el = buyRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => setBuyVisible(entry.isIntersecting), {
      rootMargin: '0px 0px -60px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [id])

  if (loading) return <section className="section"><div className="container">Loading...</div></section>
  if (!product) return <NotFound />

  const inCartQty = items
    .filter((item) => item.id === product.id)
    .reduce((sum, item) => sum + item.qty, 0)
  const pz = product.personalise
  const lettersUsed = custom.replace(/\s/g, '').length

  // Returns the cleaned name, or null (and points to the field) if it's missing
  const readCustom = () => {
    if (!pz) return ''
    const name = custom.trim().replace(/\s+/g, ' ').toUpperCase()
    if (!name) {
      setCustomError('Type the name you want on the bouquet first.')
      const input = document.getElementById('pdp-custom')
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input?.focus({ preventScroll: true })
      return null
    }
    return name
  }

  const addToCart = () => {
    const name = readCustom()
    if (name === null) return
    addItem(product.id, qty, { custom: name })
  }

  const buyNow = () => {
    const name = readCustom()
    if (name === null) return
    addItem(product.id, qty, { silent: true, custom: name })
    navigate('/cart')
  }

  const related = [
    ...products.filter((p) => p.id !== product.id && p.tag === product.tag),
    ...products.filter((p) => p.id !== product.id && p.tag !== product.tag),
  ].slice(0, 4)

  const mediaStyle = {
    '--product-tint': product.tint,
    ...(product.photo ? { aspectRatio: `${product.width} / ${product.height}` } : {}),
  }

  return (
    <>
      <section className="pdp">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to={`/shop?c=${encodeURIComponent(product.tag)}`}>{product.tag}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{product.variant}</span>
          </nav>

          <div className="pdp-grid">
            <div className={`pdp-media${product.photo ? ' pdp-media--photo' : ''}`} style={mediaStyle}>
              <img
                src={product.img}
                alt={product.alt}
                width={product.width}
                height={product.height}
                fetchPriority="high"
              />
              <span className="product-badge">
                {product.isNew && <b className="badge-new">New</b>}
                {product.tag}
              </span>
            </div>

            <div className="pdp-info">
              <h1 className="pdp-title">{product.name}</h1>
              <p className="pdp-variant">{product.variant}</p>
              <p className="pdp-price">
                <span className="cur">₹</span>
                {product.price}
                {product.priceNote && <small>{product.priceNote}</small>}
              </p>
              <p className="pdp-desc">{product.desc}</p>

              {pz && (
                <div className={`pdp-custom${customError ? ' has-error' : ''}`}>
                  <NamePreview name={custom.trim()} placeholder={pz.placeholder} />
                  <div className="field">
                    <label htmlFor="pdp-custom">{pz.label}</label>
                    <input
                      id="pdp-custom"
                      value={custom}
                      maxLength={pz.maxLength}
                      placeholder={pz.placeholder}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      onChange={(e) => {
                        setCustom(e.target.value.replace(/[^a-zA-Z ]/g, '').toUpperCase())
                        if (customError) setCustomError('')
                      }}
                      aria-invalid={Boolean(customError)}
                      aria-describedby="pdp-custom-help"
                    />
                    <span id="pdp-custom-help" className={customError ? 'field-error' : 'field-hint'}>
                      {customError || (
                        <>
                          <span>Letters only. For two names, add each one separately.</span>
                          <span className="field-count">
                            {lettersUsed}/{pz.maxLength}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {product.note && <p className="pdp-note">{product.note}</p>}

              <div className="pdp-buy" ref={buyRef}>
                <QtyStepper value={qty} onChange={setQty} />
                <button type="button" className="btn btn--primary pdp-add" onClick={addToCart}>
                  <BagIcon /> Add to cart · {formatINR(product.price * qty)}
                </button>
              </div>
              <button type="button" className="btn btn--ghost pdp-buynow" onClick={buyNow}>
                Buy now
              </button>

              <div className="pdp-meta">
                {inCartQty > 0 && (
                  <p className="pdp-incart">
                    {inCartQty} in your cart · <Link to="/cart">View cart</Link>
                  </p>
                )}
                <a
                  className="pdp-ask"
                  href={waLink(`Hi SaBun! I have a question about ${product.name} — ${product.variant}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon /> Ask a question on WhatsApp
                </a>
              </div>

              <ul className="pdp-promises">
                {promises.map((p) => (
                  <li key={p.title}>
                    <span className="promise-icon">
                      <PromiseIcon name={p.icon} />
                    </span>
                    {p.title}
                  </li>
                ))}
                <li>
                  <span className="promise-icon">
                    <GiftIcon />
                  </span>
                  Gift wrap available
                </li>
              </ul>

              <div className="faq-list pdp-acc">
                {infoBlocks(product).map((block, index) => {
                  const isOpen = open === index
                  return (
                    <div className={`faq-item${isOpen ? ' is-open' : ''}`} key={block.title}>
                      <button
                        type="button"
                        className="faq-q"
                        onClick={() => setOpen(isOpen ? -1 : index)}
                        aria-expanded={isOpen}
                        aria-controls={`pdp-panel-${index}`}
                      >
                        <span>{block.title}</span>
                        <span className="faq-icon">
                          <PlusIcon />
                        </span>
                      </button>
                      <div className="faq-a" id={`pdp-panel-${index}`} aria-hidden={!isOpen}>
                        <div>
                          {block.text ? (
                            <p className="pdp-acc-text">{block.text}</p>
                          ) : (
                            <ul className="pdp-acc-list">
                              {(block.body || []).map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight related">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <h2 className="section-title">You may also like</h2>
            </div>
            <Link className="btn btn--ghost" to="/shop">
              Shop all
            </Link>
          </div>
          <div className="product-grid">
            {related.map((p, index) => (
              <ProductCard key={p.id} product={p} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Sticky add bar on phones, once the main button is off screen */}
      <div className={`mobile-bar pdp-bar${buyVisible ? '' : ' is-shown'}`}>
        <div className="mobile-bar-total">
          <span>{custom.trim() ? `“${custom.trim()}”` : product.variant}</span>
          <strong>{formatINR(product.price * qty)}</strong>
        </div>
        <button type="button" className="mob-btn mob-btn--wa" onClick={addToCart}>
          <BagIcon /> {pz && !custom.trim() ? 'Add a name' : 'Add to cart'}
        </button>
      </div>
    </>
  )
}
