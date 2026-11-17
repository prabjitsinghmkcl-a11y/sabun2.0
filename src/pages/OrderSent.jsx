import { Link, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import usePageTitle from '../components/usePageTitle'
import { ArrowRightIcon, CheckIcon, WhatsAppIcon } from '../components/Icons'
import { useSite } from '../context/SiteContext'

function readOrder(state) {
  if (state?.ref) return state
  try {
    return JSON.parse(sessionStorage.getItem('sabun-last-order') || 'null')
  } catch {
    return null
  }
}

export default function OrderSent() {
  const location = useLocation()
  const order = readOrder(location.state)
  const { formatINR, waLink } = useSite()
  const { user } = useAuth()
  const helloWa = waLink("Hi SaBun! I'd like to place an order and have a quick question about your soaps.")
  usePageTitle('Order sent')

  return (
    <section className="empty-state empty-state--page order-sent">
      <div className="container">
        <span className="empty-icon empty-icon--ok">
          <CheckIcon />
        </span>
        <p className="eyebrow eyebrow--center">Almost there</p>
        <h1 className="page-title">
          {order?.name ? `Thank you, ${order.name}!` : 'Thank you!'}
          <br />
          <em>Now hit send on WhatsApp.</em>
        </h1>

        {order ? (
          <>
            <p className="page-lede">
              Your order <strong>{order.ref}</strong> ({order.count}{' '}
              {order.count === 1 ? 'item' : 'items'} · {formatINR(order.total)}
              {order.deliveryKnown ? '' : ' + delivery'}) is ready in WhatsApp. Once you send it,
              we&apos;ll confirm availability, delivery and payment details.
            </p>
            <div className="empty-actions">
              <a className="btn btn--wa" href={order.url} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon /> {order.opened ? 'Open WhatsApp again' : 'Open WhatsApp to send'}
              </a>
              <Link className="btn btn--ghost" to="/shop">
                Keep shopping <ArrowRightIcon />
              </Link>
            </div>
            <p className="order-sent-help">
              WhatsApp didn&apos;t open? Tap the green button above. Using a laptop? It will open
              WhatsApp Web.
            </p>
            <p className="order-sent-help">
              {user ? (
                <>Track this order any time in <Link to="/account/orders">My account → My orders</Link>.</>
              ) : (
                <><Link to="/account/login?mode=signup&next=/account/orders">Create an account</Link> to save your address and track future orders.</>
              )}
            </p>
          </>
        ) : (
          <>
            <p className="page-lede">
              If you have any questions about your order, just message us.
            </p>
            <div className="empty-actions">
              <a className="btn btn--wa" href={helloWa} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon /> Message us
              </a>
              <Link className="btn btn--ghost" to="/shop">
                Keep shopping
              </Link>
            </div>
          </>
        )}

        <ol className="order-next">
          <li>
            <span>1</span> Send the message in WhatsApp
          </li>
          <li>
            <span>2</span> We confirm and share payment details
          </li>
          <li>
            <span>3</span> Your soaps are hand-wrapped and shipped
          </li>
        </ol>
      </div>
    </section>
  )
}
