import { Link } from 'react-router'
import CheckoutSteps from '../components/CheckoutSteps'
import QtyStepper from '../components/QtyStepper'
import usePageTitle from '../components/usePageTitle'
import { ArrowLeftIcon, ArrowRightIcon, BagIcon, TrashIcon, WhatsAppIcon } from '../components/Icons'
import { useCart } from '../context/CartContext'
import { getDelivery } from '../data/order'
import { useSite } from '../context/SiteContext'

export default function Cart() {
  const { items, count, subtotal, setQty, removeItem } = useCart()
  const { formatINR, DELIVERY_FEE, FREE_DELIVERY_ABOVE } = useSite()
  usePageTitle('Your cart')

  if (items.length === 0) {
    return (
      <section className="empty-state empty-state--page">
        <div className="container">
          <span className="empty-icon">
            <BagIcon />
          </span>
          <h1 className="page-title">
            Your cart is <em>empty.</em>
          </h1>
          <p className="page-lede">Little soaps are waiting for a new home.</p>
          <div className="empty-actions">
            <Link className="btn btn--primary" to="/shop">
              Start shopping <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const delivery = getDelivery(subtotal, { deliveryFee: DELIVERY_FEE, freeDeliveryAbove: FREE_DELIVERY_ABOVE, formatINR })
  const total = subtotal + delivery.fee

  return (
    <section className="section section--tight checkout-page">
      <div className="container">
        <div className="checkout-head">
          <CheckoutSteps current={0} />
          <h1 className="page-title">
            {count} little {count === 1 ? 'joy' : 'joys'}, <em>ready to go.</em>
          </h1>
        </div>

        <div className="checkout-grid">
          <div className="cart-lines">
            <ul>
              {items.map((item) => (
                <li className="cart-line" key={item.key}>
                  <Link
                    to={`/product/${item.id}`}
                    className={`cart-line-img${item.product.photo ? ' is-photo' : ''}`}
                    style={{ '--product-tint': item.product.tint }}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <img src={item.product.thumb || item.product.img} alt="" />
                  </Link>
                  <div className="cart-line-info">
                    <Link to={`/product/${item.id}`} className="cart-line-name">
                      {item.product.name}
                    </Link>
                    <span className="cart-line-variant">{item.product.variant}</span>
                    {item.custom && (
                      <span className="cart-line-custom">
                        Name: <strong>{item.custom}</strong>
                      </span>
                    )}
                    <span className="cart-line-unit">
                      {formatINR(item.product.price)}
                      {item.product.priceNote ? ` ${item.product.priceNote}` : ''}
                    </span>
                  </div>
                  <div className="cart-line-qty">
                    <QtyStepper
                      size="sm"
                      value={item.qty}
                      onChange={(q) => setQty(item.key, q)}
                      label={`Quantity of ${item.product.name}`}
                    />
                    <button
                      type="button"
                      className="cart-remove"
                      onClick={() => removeItem(item.key)}
                      aria-label={`Remove ${item.product.name} — ${item.product.variant}`}
                    >
                      <TrashIcon /> Remove
                    </button>
                  </div>
                  <span className="cart-line-total">{formatINR(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <Link className="back-link" to="/shop">
              <ArrowLeftIcon /> Continue shopping
            </Link>
          </div>

          <aside className="summary">
            <h2>Order summary</h2>
            <dl>
              <div>
                <dt>Subtotal ({count} {count === 1 ? 'item' : 'items'})</dt>
                <dd>{formatINR(subtotal)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd className={delivery.known ? '' : 'muted'}>{delivery.label}</dd>
              </div>
              <div className="summary-total">
                <dt>Total</dt>
                <dd>
                  {formatINR(total)}
                  {!delivery.known && <small>+ delivery</small>}
                </dd>
              </div>
            </dl>
            <Link className="btn btn--primary summary-cta" to="/checkout">
              Checkout <ArrowRightIcon />
            </Link>
            <p className="summary-note">
              <WhatsAppIcon /> Your order is sent to us on WhatsApp. Nothing is charged on the website
              — we confirm and share payment details there.
            </p>
          </aside>
        </div>
      </div>

      <div className="mobile-bar mobile-bar--checkout">
        <div className="mobile-bar-total">
          <span>Total</span>
          <strong>{formatINR(total)}</strong>
        </div>
        <Link className="mob-btn mob-btn--wa" to="/checkout">
          Checkout <ArrowRightIcon />
        </Link>
      </div>
    </section>
  )
}
