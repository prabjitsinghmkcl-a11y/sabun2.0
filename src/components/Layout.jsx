import { useEffect, useLayoutEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useCart } from '../context/CartContext'
import { useProducts } from '../context/ProductsContext'
import { useSite } from '../context/SiteContext'
import {
  ArrowUpRightIcon,
  BagIcon,
  CheckIcon,
  CloseIcon,
  InstagramIcon,
  MenuIcon,
  UserIcon,
  WhatsAppIcon,
} from './Icons'
import { useAuth } from '../context/AuthContext'

const defaultNavLinks = [
  { to: '/shop', label: 'Shop', mobileLabel: 'Shop all soaps' },
  { to: '/#story', label: 'Our story', mobileLabel: 'Our story' },
  { to: '/#gifting', label: 'Gifting', mobileLabel: 'Gifting & hampers' },
  { to: '/#how', label: 'How to order', mobileLabel: 'How to order' },
  { to: '/#faq', label: 'FAQs', mobileLabel: 'FAQs' },
]

/* Scroll to top on page change, or to #section when the link has a hash */
function ScrollManager() {
  const { pathname, hash } = useLocation()

  useLayoutEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    const id = decodeURIComponent(hash.slice(1))
    let tries = 0
    const tryScroll = () => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (tries++ < 10) {
        requestAnimationFrame(tryScroll)
      }
    }
    tryScroll()
  }, [pathname, hash])

  return null
}

/* Fade-in on scroll for anything marked data-reveal, including
   elements that appear later (filters, route changes). */
function useRevealObserver() {
  const { pathname } = useLocation()

  useEffect(() => {
    const reveal = (el) => el.classList.add('is-visible')
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach(reveal)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target)
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px' },
    )
    const watch = (root) => {
      root.querySelectorAll?.('[data-reveal]:not(.is-visible)').forEach((el) => io.observe(el))
    }
    watch(document)
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) =>
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return
          if (node.matches('[data-reveal]:not(.is-visible)')) io.observe(node)
          watch(node)
        }),
      )
    })
    mo.observe(document.getElementById('root'), { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [pathname])
}

function CartToast() {
  const { toast, dismissToast } = useCart()
  if (!toast) return null
  const { product, qty, custom } = toast
  return (
    <div className="cart-toast" role="status" key={toast.key}>
      <span className="cart-toast-img" style={{ '--product-tint': product.tint }}>
        <img src={product.thumb || product.img} alt="" />
      </span>
      <div className="cart-toast-text">
        <strong>
          <CheckIcon /> Added to cart
        </strong>
        <span>
          {qty} × {product.name} · {custom ? `“${custom}”` : product.variant}
        </span>
      </div>
      <Link className="cart-toast-link" to="/cart" onClick={dismissToast}>
        View cart
      </Link>
      <button type="button" className="cart-toast-close" onClick={dismissToast} aria-label="Dismiss">
        <CloseIcon />
      </button>
    </div>
  )
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { count } = useCart()
  const { user } = useAuth()
  const accountLabel = user ? `My account (${user.name || user.email})` : 'Log in or create an account'
  const { products, collections } = useProducts()
  const siteCtx = useSite()
  const { IG_DM, IG_PROFILE, WA_DISPLAY, formatINR, waLink, copy } = siteCtx
  const helloWa = waLink("Hi SaBun! I'd like to place an order and have a quick question about your soaps.")
  const navLinks = copy?.header?.nav?.length ? copy.header.nav : defaultNavLinks
  const brand = copy?.brand || { name: 'SaBun', tagline: 'Handcrafted soap', footerText: '', city: 'India' }
  const announcement = copy?.announcement || { items: [], cta: 'Questions? DM us' }
  const footerCopy = copy?.footer || { note: '', instagramHandle: '@hellosabun on Instagram' }
  const location = useLocation()
  // These pages bring their own sticky bar (or none)
  const ownBar =
    ['/cart', '/checkout'].includes(location.pathname) || location.pathname.startsWith('/product/')

  useRevealObserver()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on navigation
  const [lastPath, setLastPath] = useState(location.key)
  if (lastPath !== location.key) {
    setLastPath(location.key)
    if (menuOpen) setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const cartLabel = count === 1 ? '1 item' : `${count} items`

  return (
    <>
      <ScrollManager />

      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {/* Announcement */}
      <div className="announcement">
        <div className="container">
          <p>
            {(announcement.items || []).map((item, i) => (
              <span key={i}>
                {i > 0 && <span className="dot" aria-hidden="true">•</span>}
                <span>{item}</span>
              </span>
            ))}
          </p>
          <a href={IG_DM} target="_blank" rel="noopener noreferrer">
            {announcement.cta || 'Questions? DM us'} <ArrowUpRightIcon />
          </a>
        </div>
      </div>

      {/* Header */}
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="container header-inner">
          <Link className="logo" to="/" aria-label={`${brand.name} — home`}>
            <span className="logo-text">
              <span className="logo-name">{brand.name}</span>
              <span className="logo-sub">{brand.tagline}</span>
            </span>
          </Link>

          <nav className="nav" aria-label="Primary">
            {navLinks.map((link) =>
              link.to.includes('#') ? (
                <Link key={link.to} to={link.to}>
                  {link.label}
                </Link>
              ) : (
                <NavLink key={link.to} to={link.to}>
                  {link.label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="header-actions">
            <a
              className="icon-link"
              href={IG_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${brand.name} on Instagram`}
            >
              <InstagramIcon />
            </a>
            <Link className={`icon-link account-link${user ? ' is-in' : ''}`} to={user ? '/account' : '/account/login'} aria-label={accountLabel} title={accountLabel}>
              <UserIcon />
            </Link>
            <Link className="icon-link cart-link" to="/cart" aria-label={`Cart, ${cartLabel}`}>
              <BagIcon />
              {count > 0 && (
                <span className="cart-count" key={count}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
            <Link className="btn btn--primary header-shop" to="/shop">
              {copy?.header?.shopCta || 'Shop now'}
            </Link>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' is-open' : ''}`}>
          <nav className="mobile-nav" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>
                {link.mobileLabel}
              </Link>
            ))}
            <Link to="/cart" onClick={() => setMenuOpen(false)}>
              Your cart {count > 0 && <span className="mobile-nav-count">{count}</span>}
            </Link>
            <Link to={user ? '/account' : '/account/login'} onClick={() => setMenuOpen(false)}>
              {user ? `My account · ${(user.name || '').split(' ')[0] || 'you'}` : 'Log in / Create account'}
            </Link>
          </nav>
          <div className="mobile-menu-ctas">
            <a className="btn btn--ghost" href={IG_DM} target="_blank" rel="noopener noreferrer">
              <InstagramIcon /> Instagram DM
            </a>
            <a className="btn btn--primary" href={helloWa} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="footer-name">{brand.name}</span>
              <p>{brand.footerText}</p>
              <div className="footer-social">
                <a href={IG_DM} target="_blank" rel="noopener noreferrer">
                  <InstagramIcon /> Instagram DM
                </a>
                <a href={helloWa} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon /> WhatsApp
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Explore</h4>
              <ul>
                <li><Link to="/shop">Shop all</Link></li>
                <li><Link to="/#story">Our story</Link></li>
                <li><Link to="/#gifting">Gifting &amp; hampers</Link></li>
                <li><Link to="/#how">How to order</Link></li>
                <li><Link to="/#faq">FAQs</Link></li>
                <li><Link to="/cart">Your cart</Link></li>
                <li><Link to={user ? '/account' : '/account/login'}>{user ? 'My account' : 'Log in'}</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Shop</h4>
              <ul>
                {collections
                  .filter((c) => c.id !== 'all')
                  .map((c) => {
                    const inIt = products.filter((p) => p.tag === c.id)
                    const from = Math.min(...inIt.map((p) => p.price))
                    return (
                      <li key={c.id}>
                        <Link to={`/shop?c=${encodeURIComponent(c.id)}`}>
                          {c.label} <span className="footer-from">from {formatINR(from)}</span>
                        </Link>
                      </li>
                    )
                  })}
              </ul>
            </div>

            <div className="footer-col">
              <h4>Say hello</h4>
              <ul>
                <li>
                  <a href={IG_PROFILE} target="_blank" rel="noopener noreferrer">
                    {footerCopy.instagramHandle || '@hellosabun on Instagram'}
                  </a>
                </li>
                <li>
                  <a
                    className="footer-phone"
                    href={waLink('Hi SaBun! I have a question about your soaps.')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {WA_DISPLAY}
                  </a>
                </li>
                <li>
                  <span className="footer-note">{footerCopy.note}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {brand.name}. All rights reserved.</span>
            <span>
              Handcrafted with <span className="heart">♥</span> in {brand.city || 'India'}
            </span>
            <a href={IG_PROFILE} target="_blank" rel="noopener noreferrer">
              Instagram ↗
            </a>
          </div>
        </div>
      </footer>

      {/* Sticky mobile bar (hidden on cart & checkout, which have their own) */}
      {!ownBar && (
        <div className="mobile-bar">
          {count > 0 ? (
            <>
              <a className="mob-btn mob-btn--ig" href={helloWa} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon /> Ask us
              </a>
              <Link className="mob-btn mob-btn--wa" to="/cart">
                <BagIcon /> View cart ({count})
              </Link>
            </>
          ) : (
            <>
              <a className="mob-btn mob-btn--ig" href={IG_DM} target="_blank" rel="noopener noreferrer">
                <InstagramIcon /> DM us
              </a>
              <Link className="mob-btn mob-btn--wa" to="/shop">
                <BagIcon /> {copy?.header?.shopCta || 'Shop now'}
              </Link>
            </>
          )}
        </div>
      )}

      <CartToast />
    </>
  )
}
