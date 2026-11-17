import { useState } from 'react'
import { Link } from 'react-router'
import ProductCard from '../components/ProductCard'
import usePageTitle from '../components/usePageTitle'
import {
  ArrowRightIcon,
  DropIcon,
  InstagramIcon,
  LeafIcon,
  LoopIcon,
  PlusIcon,
  PromiseIcon,
  WhatsAppIcon,
} from '../components/Icons'
import { useProducts } from '../context/ProductsContext'
import { useSite } from '../context/SiteContext'

export default function Home() {
  const { products } = useProducts()
  const { IG_DM, IG_PROFILE, waLink, content, copy } = useSite()
  const faqs = content?.faqs || []
  const promises = content?.promises || []
  const steps = content?.steps || []
  const marqueeItems = content?.marqueeItems || []
  const igTiles = content?.igTiles || []
  const home = copy?.home || {}
  const helloWa = waLink("Hi SaBun! I'd like to place an order and have a quick question about your soaps.")
  const [openFaq, setOpenFaq] = useState(0)
  usePageTitle(null)

  return (
    <>
      {/* Hero */}
      <section className="hero" id="top">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{home.hero?.eyebrow}</p>
            <h1 className="hero-title">
              {home.hero?.title1}
              <br />
              <em>{home.hero?.title2}</em>
            </h1>
            <p className="hero-lede">{home.hero?.lede}</p>
            <div className="hero-actions">
              <Link className="btn btn--primary" to="/shop">
                {home.hero?.ctaPrimary || 'Shop the collection'} <ArrowRightIcon />
              </Link>
              <a className="btn btn--ghost" href={IG_DM} target="_blank" rel="noopener noreferrer">
                <InstagramIcon /> {home.hero?.ctaSecondary || 'DM us on Instagram'}
              </a>
            </div>
            <ul className="trust-row">
              <li>
                <LeafIcon /> 100% natural
              </li>
              <li>
                <DropIcon /> Palm-oil free
              </li>
              <li>
                <LoopIcon /> Zero waste
              </li>
            </ul>
          </div>

          <div className="collage">
            <Link className="hero-card hero-card--main" to="/product/forever-bloom" aria-label="Forever Bloom">
              <img
                src="https://res.cloudinary.com/kkocbepk/image/upload/v1794819100/sabun/products/forever-bloom.jpg"
                alt="Forever Bloom — a hand-sculpted magenta rose soap"
                width="1239"
                height="1270"
                fetchPriority="high"
              />
            </Link>
            <Link className="hero-card hero-card--camera" to="/product/love-rides-camera" aria-label="Love Rides camera">
              <img
                src="https://res.cloudinary.com/kkocbepk/image/upload/v1794819101/sabun/products/love-rides-camera.jpg"
                alt="Love Rides — a glossy teal vintage camera-shaped soap"
                width="1536"
                height="1024"
                loading="lazy"
              />
            </Link>
            <Link className="hero-card hero-card--eye" to="/product/evil-eye-gems" aria-label="Evil Eye gems">
              <img
                src="https://res.cloudinary.com/kkocbepk/image/upload/v1794819098/sabun/products/evil-eye-gems.jpg"
                alt="Evil Eye — glossy evil-eye soap gems on a gold plate"
                width="1199"
                height="1312"
                loading="lazy"
              />
            </Link>

            <div className="hero-tag">
              <span>Forever Bloom</span>
              <strong>
                <em>₹</em>100
              </strong>
            </div>

            <div className="spin-badge" aria-hidden="true">
              <svg className="spin-svg" viewBox="0 0 96 96">
                <defs>
                  <path id="spin-path" d="M48,48 m-33,0 a33,33 0 1,1 66,0 a33,33 0 1,1 -66,0" />
                </defs>
                <text>
                  <textPath href="#spin-path" startOffset="0">
                    HANDCRAFTED · SMALL BATCH · PURE ·
                  </textPath>
                </text>
              </svg>
              <span className="spin-center">
                <LeafIcon />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((group) => (
            <div className="marquee-group" key={group}>
              {marqueeItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Collection */}
      <section className="section shop" id="shop">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <p className="eyebrow">{home.collection?.eyebrow}</p>
              <h2 className="section-title">{home.collection?.title}</h2>
            </div>
            <p className="section-note">{home.collection?.note}</p>
          </div>

          <div className="product-grid">
            {products.slice(0, 6).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} eager={index < 3} />
            ))}
          </div>

          <div className="shop-more" data-reveal>
            <Link className="btn btn--ghost" to="/shop">
              See all {products.length} pieces <ArrowRightIcon />
            </Link>
            <p className="shop-foot">
              Prices in INR. Add to cart and send your order on WhatsApp — or{' '}
              <a href={helloWa} target="_blank" rel="noopener noreferrer">
                message us
              </a>{' '}
              and we&apos;ll help you pick.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="section story" id="story">
        <div className="container story-grid">
          <div className="story-media" data-reveal>
            <img
              src="https://res.cloudinary.com/kkocbepk/image/upload/v1794819097/sabun/products/bestie-bears.jpg"
              alt="Bestie Bears — a pair of handcrafted bear-shaped soaps"
              width="1200"
              height="1600"
              loading="lazy"
            />
            <span className="story-sticker">{home.story?.sticker}</span>
          </div>

          <div className="story-copy" data-reveal>
            <p className="eyebrow">{home.story?.eyebrow}</p>
            <h2 className="section-title">{home.story?.title}</h2>
            <p className="story-text">{home.story?.text1}</p>
            <p className="story-text">{home.story?.text2}</p>
            <p className="signature">{home.story?.signature}</p>

            <div className="promise-grid">
              {promises.map((promise) => (
                <div className="promise" key={promise.title}>
                  <span className="promise-icon">
                    <PromiseIcon name={promise.icon} />
                  </span>
                  <div>
                    <strong>{promise.title}</strong>
                    <span>{promise.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gifting */}
      <section className="section" id="gifting">
        <div className="container">
          <div className="hamper" data-reveal>
            <div className="hamper-copy">
              <p className="eyebrow">{home.gifting?.eyebrow}</p>
              <h2>{home.gifting?.title}</h2>
              <p>{home.gifting?.text}</p>
              <div className="hamper-actions">
                <a
                  className="btn btn--cream"
                  href={waLink(
                    "Hi SaBun! I'd like to build a gift hamper. Can you help me put one together?",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {home.gifting?.ctaPrimary || 'Build a hamper'} <ArrowRightIcon />
                </a>
                <Link className="btn btn--outline-light" to="/shop">
                  {home.gifting?.ctaSecondary || 'See the collection'}
                </Link>
              </div>
              <p className="hamper-note">{home.gifting?.note}</p>
            </div>

            <div className="hamper-art" aria-hidden="true">
              <div className="hamper-card">
                <img src="https://res.cloudinary.com/kkocbepk/image/upload/v1794819100/sabun/products/forever-bloom.jpg" alt="" />
              </div>
              <div className="hamper-card">
                <img src="https://res.cloudinary.com/kkocbepk/image/upload/v1794819097/sabun/products/bestie-bears.jpg" alt="" />
              </div>
              <div className="hamper-card">
                <img src="https://res.cloudinary.com/kkocbepk/image/upload/v1794819098/sabun/products/evil-eye-gems.jpg" alt="" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to order */}
      <section className="section" id="how">
        <div className="container">
          <div className="steps-head" data-reveal>
            <p className="eyebrow eyebrow--center">{home.how?.eyebrow}</p>
            <h2 className="section-title">{home.how?.title}</h2>
            <p className="section-sub">{home.how?.sub}</p>
          </div>

          <div className="steps-grid">
            {steps.map((step, index) => (
              <div
                className="step"
                key={step.num}
                data-reveal
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <span className="step-num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq" id="faq">
        <div className="container faq-grid">
          <div className="faq-head" data-reveal>
            <p className="eyebrow">{home.faq?.eyebrow}</p>
            <h2>
              {home.faq?.title1}
              <br />
              <em>{home.faq?.title2}</em>
            </h2>
            <p>{home.faq?.sub}</p>
            <div className="faq-ctas">
              <a className="btn btn--primary" href={IG_DM} target="_blank" rel="noopener noreferrer">
                <InstagramIcon /> DM on Instagram
              </a>
              <a className="btn btn--ghost" href={helloWa} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon /> WhatsApp
              </a>
            </div>
          </div>

          <div className="faq-list" data-reveal>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div className={`faq-item${isOpen ? ' is-open' : ''}`} key={faq.q}>
                  <button
                    type="button"
                    className="faq-q"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    id={`faq-trigger-${index}`}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-icon">
                      <PlusIcon />
                    </span>
                  </button>
                  <div
                    className="faq-a"
                    id={`faq-panel-${index}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${index}`}
                    aria-hidden={!isOpen}
                  >
                    <div>
                      <p>{faq.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="ig-band" id="instagram">
        <div className="container">
          <div className="ig-head" data-reveal>
            <div>
              <p className="eyebrow">{home.instagram?.eyebrow}</p>
              <h2 className="section-title">{home.instagram?.title}</h2>
            </div>
            <p>{home.instagram?.text}</p>
          </div>

          <div className="ig-grid" data-reveal>
            {igTiles.map((tile) => (
              <a
                className={`ig-tile${tile.photo ? ' ig-tile--photo' : ''}`}
                key={tile.img}
                href={IG_PROFILE}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`See ${tile.alt} on Instagram`}
              >
                <img src={tile.img} alt="" loading="lazy" />
                <InstagramIcon />
              </a>
            ))}
          </div>

          <div className="ig-foot">
            <a className="btn btn--primary" href={IG_PROFILE} target="_blank" rel="noopener noreferrer">
              <InstagramIcon /> {home.instagram?.cta || 'Follow @hellosabun'}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
