import { Link } from 'react-router'
import { useCart } from '../context/CartContext'
import { BagIcon, PencilIcon, PlusIcon } from './Icons'

export default function ProductCard({ product, index = 0, eager = false }) {
  const { addItem, items } = useCart()
  const inCartQty = items
    .filter((item) => item.id === product.id)
    .reduce((sum, item) => sum + item.qty, 0)
  const href = `/product/${product.id}`

  return (
    <article
      className="product-card"
      data-reveal
      style={{ transitionDelay: `${(index % 3) * 70}ms` }}
    >
      <Link
        to={href}
        className={`product-media${product.photo ? ' product-media--photo' : ''}`}
        style={{ '--product-tint': product.tint }}
        aria-label={`${product.name} — ${product.variant}`}
        tabIndex={-1}
      >
        <img
          src={product.thumb || product.img}
          alt={product.alt}
          width={product.width}
          height={product.height}
          loading={eager ? 'eager' : 'lazy'}
        />
        <span className="product-badge">
          {product.isNew && <b className="badge-new">New</b>}
          {product.tag}
        </span>
        {inCartQty > 0 && <span className="product-incart">{inCartQty} in cart</span>}
      </Link>

      <div className="product-body">
        <h3 className="product-name">
          <Link to={href}>{product.name}</Link>
        </h3>
        <p className="product-variant">{product.variant}</p>
        <p className="product-desc">{product.desc}</p>

        <div className="product-foot">
          <p className="price">
            <span className="cur">₹</span>
            {product.price}
            {product.priceNote && <small>{product.priceNote}</small>}
          </p>
          <div className="product-actions">
            <Link className="dm-mini" to={href}>
              Details
            </Link>
            {product.personalise ? (
              <Link className="btn-order" to={href}>
                <PencilIcon /> Personalise
              </Link>
            ) : (
              <button
                type="button"
                className="btn-order"
                onClick={() => addItem(product.id)}
                aria-label={`Add ${product.name} — ${product.variant} to cart`}
              >
                {inCartQty > 0 ? <PlusIcon /> : <BagIcon />} Add
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
