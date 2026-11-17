import { useEffect, useState, useMemo } from 'react'

/* ------------------------------------------------------------------ */
/*  Contact + links                                                    */
/* ------------------------------------------------------------------ */

const IG_PROFILE = 'https://www.instagram.com/hellosabun/'
const IG_DM = 'https://ig.me/m/hellosabun'
const WA_NUMBER = '919266145378'
const WA_DISPLAY = '+91 92661 45378'

const waLink = (message) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`

const helloWa = waLink(
  "Hi SaBun! I'd like to place an order and have a quick question about your soaps.",
)

/* ------------------------------------------------------------------ */
/*  Products Data                                                      */
/* ------------------------------------------------------------------ */

const categories = [
  { id: 'all', label: 'All Soaps' },
  { id: 'floral', label: 'Signature & Floral' },
  { id: 'charms', label: 'Lucky Charms' },
  { id: 'gifting', label: 'Gifting & Novelty' },
]

const products = [
  {
    id: 'forever-bloom',
    name: 'Forever Bloom',
    variant: 'Sculpted rose',
    category: 'floral',
    tint: 'rose',
    tag: 'Signature',
    price: 100,
    weight: '100g',
    scent: 'Damascus Rose, Geranium & Soft Vanilla',
    ingredients: 'Cold-Pressed Coconut Oil, Shea Butter, French Pink Clay, Pure Rose Water',
    rating: 5.0,
    reviewCount: 48,
    desc: 'A rose in full bloom — swirls of magenta, a soft floral finish and a lather that feels like a tiny luxury.',
    details: 'Each rose petal is individually sculpted by hand. The creamy lather leaves skin supple without any dry after-feel. Great for daily face & body care.',
    img: '/products/forever-bloom.jpg',
    alt: 'Forever Bloom — a hand-sculpted magenta rose soap',
    width: 1239,
    height: 1270,
  },
  {
    id: 'evil-eye-talisman',
    name: 'Evil Eye',
    variant: 'Gold shimmer talisman',
    category: 'charms',
    tint: 'gold',
    tag: 'Lucky charm',
    price: 150,
    weight: '110g',
    scent: 'White Sage, Sea Salt & Bergamot',
    ingredients: 'Extra Virgin Olive Oil, Sweet Almond Oil, Eco-Mica Shimmer, Blue Kaolin',
    rating: 4.9,
    reviewCount: 36,
    desc: 'A shimmering gold eye talisman, hand-finished to keep the good vibes close. Equal parts charm and creamy cleanse.',
    details: 'Finished with cosmetic-grade biodegradable gold mica. An ancient symbol of protection crafted to bring mindfulness and calm to your bath routine.',
    img: '/products/evil-eye-talisman.jpg',
    alt: 'Evil Eye — a gold shimmer eye-shaped soap talisman',
    width: 1536,
    height: 1024,
  },
  {
    id: 'love-rides-camera',
    name: 'Love Rides',
    variant: 'Vintage camera',
    category: 'gifting',
    tint: 'teal',
    tag: 'Gift-ready',
    price: 100,
    weight: '95g',
    scent: 'Crisp Spearmint & Eucalyptus Breeze',
    ingredients: 'Castor Oil, Cocoa Butter, Spirulina Natural Green, Tea Tree Extract',
    rating: 4.8,
    reviewCount: 29,
    desc: 'A glossy teal camera for the memory-keeper in your life. Small enough to gift, pretty enough to display.',
    details: 'A nostalgic tribute to retro cameras. Formulated with invigorating mint and nourishing cocoa butter for an energizing morning shower.',
    img: '/products/love-rides-camera.jpg',
    alt: 'Love Rides — a glossy teal vintage camera-shaped soap',
    width: 1536,
    height: 1024,
  },
  {
    id: 'love-rides-bus',
    name: 'Love Rides',
    variant: 'Caramel toy bus',
    category: 'gifting',
    tint: 'caramel',
    tag: 'Gift-ready',
    price: 100,
    weight: '95g',
    scent: 'Warm Caramel, Tonka Bean & Bourbon Vanilla',
    ingredients: 'Raw Shea Butter, Oat Milk, Cocoa Powder, Pure Jojoba',
    rating: 4.9,
    reviewCount: 31,
    desc: 'A caramel toy bus with all the vintage charm. A tiny joyride for your sink, your shelf or a gift box.',
    details: 'Smells like a cozy French bakery. Creamy oat milk gently soothes sensitive and dry skin while keeping hands deeply moisturized.',
    img: '/products/love-rides-bus.jpg',
    alt: 'Love Rides — a glossy caramel toy bus-shaped soap',
    width: 1600,
    height: 800,
  },
  {
    id: 'evil-eye-gems',
    name: 'Evil Eye',
    variant: 'Gems on a gold plate',
    category: 'charms',
    tint: 'blue',
    tag: 'Lucky charm',
    price: 150,
    weight: '120g',
    scent: 'Lavender Blossom & Amber Wood',
    ingredients: 'Cold-Pressed Olive Oil, Golden Mica, Indigo Botanical Extract, Vitamin E',
    rating: 5.0,
    reviewCount: 52,
    desc: 'A golden plate of glossy evil-eye gems — a protective little set that looks as good as it cleans.',
    details: 'Includes miniature gem soaps resting on a handcrafted golden soap dish block. Makes an unforgettable festive or housewarming keepsake.',
    img: '/products/evil-eye-gems.jpg',
    alt: 'Evil Eye — glossy evil-eye soap gems arranged on a gold plate',
    width: 1199,
    height: 1312,
  },
  {
    id: 'bestie-bears',
    name: 'Bestie Bears',
    variant: 'Hand-sculpted bears',
    category: 'gifting',
    tint: 'bear',
    tag: 'Bestie bears',
    price: 85,
    priceNote: 'each',
    weight: '85g',
    scent: 'Honey Blossom & Calming Chamomile',
    ingredients: 'Raw Forest Honey, Calendula Extract, Organic Coconut Milk, Mango Butter',
    rating: 4.9,
    reviewCount: 64,
    desc: 'Palm-sized bestie bears, sold separately so nobody has to share. Pick a colour, gift a pair, spread the love.',
    details: 'Individually poured and sculpted with tender care. Infused with soothing chamomile and wild honey, ideal for all ages and delicate skin.',
    img: '/products/bestie-bears.jpg',
    alt: 'Bestie Bears — a pair of handcrafted bear-shaped soaps',
    width: 1200,
    height: 1600,
    photo: true,
  },
]

const singleProductOrderLink = (product) =>
  waLink(
    `Hi SaBun! I'd like to order ${product.name} — ${product.variant} (₹${product.price}${
      product.priceNote ? ` ${product.priceNote}` : ''
    }). Is it available?`,
  )

/* ------------------------------------------------------------------ */
/*  Customer Reviews & Testimonials                                    */
/* ------------------------------------------------------------------ */

const reviews = [
  {
    id: 1,
    name: 'Ananya Sharma',
    city: 'Mumbai',
    rating: 5,
    soap: 'Forever Bloom',
    quote: 'Forever Bloom looks like a literal sculpture on my bathroom vanity. The real rose scent is divine and gentle, with zero tight or dry feel after washing.',
  },
  {
    id: 2,
    name: 'Devika Rao',
    city: 'Bengaluru',
    rating: 5,
    soap: 'Evil Eye Talisman',
    quote: 'Ordered 8 hampers for festive gifts. Every single friend messaged me asking where I found these! The gold sheen and craftsmanship are breathtaking.',
  },
  {
    id: 3,
    name: 'Rohan & Sneha',
    city: 'New Delhi',
    rating: 5,
    soap: 'Bestie Bears',
    quote: 'The little bestie bears are adorable beyond words. Knowing they are 100% natural, palm-oil free and lovingly made gives complete peace of mind.',
  },
  {
    id: 4,
    name: 'Kavita Menon',
    city: 'Pune',
    rating: 5,
    soap: 'Love Rides Camera',
    quote: 'Sent the vintage camera soap to a photographer colleague. The customized gift wrapping and sweet handwritten note made it the highlight of her day!',
  },
]

/* ------------------------------------------------------------------ */
/*  Promises & FAQs                                                    */
/* ------------------------------------------------------------------ */

const promises = [
  {
    icon: 'leaf',
    title: '100% Natural',
    text: 'Cold-pressed botanical oils, pure plant clays and zero harsh detergents.',
  },
  {
    icon: 'drop',
    title: 'Palm-Oil Free',
    text: 'Kinder to rainforests and gentle on even the most sensitive skin.',
  },
  {
    icon: 'loop',
    title: 'Zero Waste Heart',
    text: 'Biodegradable packaging, plastic-free shipping and small thoughtful batches.',
  },
  {
    icon: 'sparkle',
    title: 'Hand-Sculpted',
    text: 'Every single bar has individual character and artisanal warmth.',
  },
]

const steps = [
  {
    num: '01',
    title: 'Pick or Build',
    text: 'Browse the collection, add pieces to your bag, or assemble a custom gift box.',
  },
  {
    num: '02',
    title: 'Send Order on WhatsApp',
    text: 'One tap sends your organized list to our soapmaker. No tedious checkout forms.',
  },
  {
    num: '03',
    title: 'Crafted & Dispatched',
    text: 'We confirm your pincode details and hand-wrap your soaps with a custom card.',
  },
]

const faqs = [
  {
    q: 'What are your soaps made of?',
    a: 'Every SaBun piece is handcrafted with 100% natural, skin-loving oils (coconut, olive, sweet almond, shea and cocoa butters). We strictly avoid palm oil, synthetic hardeners, parabens and SLS.',
  },
  {
    q: 'How does ordering on WhatsApp / Instagram work?',
    a: "It's seamless! Build your order here and tap 'Checkout via WhatsApp'. It sends a pre-filled item list with prices directly to us. We confirm shipping and payment via UPI/Cards instantly.",
  },
  {
    q: 'Do you take custom hamper and bulk wedding favors?',
    a: 'Yes! Custom colors, fragrance blends, wedding favors, corporate gifting and bridesmaids boxes are our specialty. Message us with your quantity and event date for custom rates.',
  },
  {
    q: 'How long does shipping take across India?',
    a: 'Because we craft in small batches, orders are usually dispatched within 24–48 hours. Express metro delivery takes 2–4 days. Send us your pincode for an exact delivery window.',
  },
  {
    q: 'Can you include a personalized gift message?',
    a: 'Absolutely! Every gift box includes a complimentary handcrafted textured card. Just tell us what you would like us to write on it.',
  },
  {
    q: 'How do I care for handmade soap so it lasts longer?',
    a: 'Always rest your bar on a well-draining soap dish away from direct shower spray between uses. Keeping handmade soap dry extends its life by weeks!',
  },
]

const marqueeItems = [
  '100% Natural Botanicals',
  'Palm-Oil Free',
  'Zero Waste Packaging',
  'Hand-Sculpted in India',
  'Small Batch Quality',
  'Artisan Gifting',
]

const igTiles = [
  { img: '/products/forever-bloom.jpg', alt: 'Forever Bloom rose soap', tint: 'rose' },
  { img: '/products/evil-eye-talisman.jpg', alt: 'Gold shimmer Evil Eye soap', tint: 'gold' },
  { img: '/products/love-rides-camera.jpg', alt: 'Love Rides vintage camera soap', tint: 'teal' },
  { img: '/products/love-rides-bus.jpg', alt: 'Love Rides caramel bus soap', tint: 'caramel' },
  { img: '/products/bestie-bears.jpg', alt: 'Bestie Bears handmade soaps', tint: 'bear', photo: true },
]

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
}

function LeafIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 20C5 11 11 5 21 3c-1 11-7 17-17 17Z" />
      <path d="M4 20c4-6 8-9 13-11" />
    </svg>
  )
}

function DropIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 2.6S5.7 9.4 5.7 14a6.3 6.3 0 0 0 12.6 0c0-4.6-6.3-11.4-6.3-11.4Z" />
    </svg>
  )
}

function LoopIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <path d="M20.5 3.5V9H15" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg {...iconProps}>
      <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M18.5 16.5 19 18l1.5.5-1.5.5-.5 1.5-.5-1.5L16.5 19l1.5-.5.5-1.5Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.14-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.07 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.57-.34M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26C2.16 6.45 6.6 2.01 12.05 2.01c2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.9-9.88 9.9m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.48-8.4Z" />
    </svg>
  )
}

function ArrowUpRightIcon() {
  return (
    <svg {...iconProps}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4.5 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 12h14" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function StarIcon({ filled = true }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className="star-svg" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg {...iconProps}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg {...iconProps}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg {...iconProps}>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  )
}

function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="32" fill="var(--accent)" />
      <path d="M32 49V34" stroke="var(--surface)" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M32 36c0-9.5 5.8-16.5 17-19.5C49 27 42.7 33.8 32 36Z"
        fill="var(--tint-gold)"
      />
      <path
        d="M32 41.5c-7.4-1-12.7-5.4-14.8-12.8 7.4 0 12.8 4.3 14.8 12.8Z"
        fill="var(--tint-rose)"
      />
      <circle cx="44" cy="24" r="1.5" fill="var(--surface)" opacity="0.55" />
    </svg>
  )
}

function PromiseIcon({ name }) {
  if (name === 'drop') return <DropIcon />
  if (name === 'loop') return <LoopIcon />
  if (name === 'sparkle') return <SparkleIcon />
  return <LeafIcon />
}

/* ------------------------------------------------------------------ */
/*  Main Application Component                                         */
/* ------------------------------------------------------------------ */

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')

  // Cart / Bag state
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  // Quick View modal state
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  // Toast notifications
  const [toastMessage, setToastMessage] = useState('')

  // Interactive Hamper Builder state
  const [hamperItems, setHamperItems] = useState(['forever-bloom', 'evil-eye-gems'])
  const [hamperNote, setHamperNote] = useState('Handpicked with love for you!')
  const [boxStyle, setBoxStyle] = useState('ribbon')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage('')
    }, 2800)
  }

  // Cart Actions
  const addToCart = (product, count = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + count }
            : item,
        )
      }
      return [...prev, { product, qty: count }]
    })
    showToast(`Added ${product.name} to your bag ✨`)
  }

  const updateCartQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.qty + delta
            return nextQty > 0 ? { ...item, qty: nextQty } : null
          }
          return item
        })
        .filter(Boolean),
    )
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.qty, 0)
  }, [cart])

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.qty, 0)
  }, [cart])

  // Multi-item WhatsApp checkout message generator
  const cartWhatsAppLink = useMemo(() => {
    if (cart.length === 0) return helloWa
    let text = `Hi SaBun! 🌿 I would like to order the following soaps from your website:\n\n`
    cart.forEach((item, idx) => {
      text += `${idx + 1}. ${item.product.name} (${item.product.variant}) × ${item.qty} = ₹${
        item.product.price * item.qty
      }\n`
    })
    text += `\nTotal Estimated: ₹${cartSubtotal}`
    text += `\nCould you please confirm availability and shipping details?`
    return waLink(text)
  }, [cart, cartSubtotal])

  // Hamper WhatsApp message generator
  const hamperWhatsAppLink = useMemo(() => {
    const selectedProds = hamperItems
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean)
    const hamperTotal = selectedProds.reduce((sum, p) => sum + p.price, 0)
    let text = `Hi SaBun! 🎁 I'd love to order a Custom Handcrafted Gift Hamper with:\n\n`
    selectedProds.forEach((p, i) => {
      text += `${i + 1}. ${p.name} (${p.variant}) - ₹${p.price}\n`
    })
    text += `\nPackaging: ${
      boxStyle === 'ribbon'
        ? 'Signature Textured Kraft Box + Forest Green Ribbon'
        : 'Royal Shimmer Box with Botanical Twig'
    }`
    if (hamperNote.trim()) {
      text += `\nHandwritten Card Note: "${hamperNote.trim()}"`
    }
    text += `\nTotal Hamper Price: ₹${hamperTotal}`
    text += `\nPlease let me know the dispatch date!`
    return waLink(text)
  }, [hamperItems, boxStyle, hamperNote])

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products
    return products.filter((p) => p.category === activeCategory)
  }, [activeCategory])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setCartOpen(false)
        setQuickViewProduct(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px' },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [filteredProducts])

  // Hamper toggle helper
  const toggleHamperItem = (productId) => {
    setHamperItems((prev) => {
      if (prev.includes(productId)) {
        if (prev.length <= 1) return prev // keep at least 1
        return prev.filter((id) => id !== productId)
      } else {
        if (prev.length >= 4) {
          showToast('Hamper fits up to 4 bars. Remove one to add another!')
          return prev
        }
        return [...prev, productId]
      }
    })
  }

  return (
    <>
      <a className="skip-link" href="#shop">
        Skip to the collection
      </a>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Announcement Bar */}
      <div className="announcement">
        <div className="container">
          <p>
            <span>Handcrafted botanical soap</span>
            <span className="dot" aria-hidden="true">•</span>
            <span>100% Palm-oil free</span>
            <span className="dot" aria-hidden="true">•</span>
            <span>Plastic-free shipping</span>
          </p>
          <div className="announcement-links">
            <span className="announcement-promo">Complimentary gift box on 3+ soaps</span>
            <a href={IG_DM} target="_blank" rel="noopener noreferrer">
              DM to order <ArrowUpRightIcon />
            </a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="container header-inner">
          <a className="logo" href="#top" aria-label="SaBun — back to top">
            <LogoMark />
            <span className="logo-text">
              <span className="logo-name">SaBun</span>
              <span className="logo-sub">Handcrafted soap studio</span>
            </span>
          </a>

          <nav className="nav" aria-label="Primary">
            <a href="#shop">Shop</a>
            <a href="#hamper-builder">Custom Hamper</a>
            <a href="#story">Our story</a>
            <a href="#reviews">Reviews</a>
            <a href="#how">How to order</a>
            <a href="#faq">FAQs</a>
          </nav>

          <div className="header-actions">
            <a
              className="icon-link"
              href={IG_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SaBun on Instagram"
              title="Visit our Instagram"
            >
              <InstagramIcon />
            </a>

            {/* Bag Button */}
            <button
              type="button"
              className="bag-button"
              onClick={() => setCartOpen(true)}
              aria-label={`View your shopping bag with ${totalCartCount} items`}
            >
              <BagIcon />
              <span className="bag-label">Bag</span>
              {totalCartCount > 0 && <span className="bag-count-badge">{totalCartCount}</span>}
            </button>

            <a className="btn btn--primary header-cta" href={helloWa} target="_blank" rel="noopener noreferrer">
              Chat to Order <ArrowUpRightIcon />
            </a>

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

        {/* Mobile Dropdown Menu */}
        <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' is-open' : ''}`}>
          <nav className="mobile-nav" aria-label="Mobile">
            <a href="#shop" onClick={() => setMenuOpen(false)}>The collection</a>
            <a href="#hamper-builder" onClick={() => setMenuOpen(false)}>Custom Hamper Builder</a>
            <a href="#story" onClick={() => setMenuOpen(false)}>Our story &amp; ethics</a>
            <a href="#reviews" onClick={() => setMenuOpen(false)}>Customer love &amp; reviews</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>How to order</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQs</a>
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

      {/* Bag / Cart Drawer */}
      <div
        className={`drawer-backdrop${cartOpen ? ' is-active' : ''}`}
        onClick={() => setCartOpen(false)}
        aria-hidden={!cartOpen}
      />
      <aside className={`cart-drawer${cartOpen ? ' is-open' : ''}`} aria-label="Shopping Bag">
        <div className="cart-header">
          <div className="cart-title-row">
            <BagIcon />
            <h3>Your Soap Bag</h3>
            <span className="cart-qty-pill">{totalCartCount} items</span>
          </div>
          <button
            type="button"
            className="cart-close"
            onClick={() => setCartOpen(false)}
            aria-label="Close bag"
          >
            <CloseIcon />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-art">🧼</div>
            <h4>Your bag is feeling light</h4>
            <p>Pick a few sculpted pieces or gift hampers from our collection.</p>
            <a
              className="btn btn--primary"
              href="#shop"
              onClick={() => setCartOpen(false)}
            >
              Browse Soaps
            </a>
          </div>
        ) : (
          <>
            <div className="cart-perks">
              <SparkleIcon />
              <span>
                {totalCartCount >= 3
                  ? '🎉 Qualified for complimentary handcrafted gift wrapping!'
                  : `Add ${3 - totalCartCount} more piece${3 - totalCartCount > 1 ? 's' : ''} for free gift packaging!`}
              </span>
            </div>

            <div className="cart-items">
              {cart.map((item) => (
                <div className="cart-item" key={item.product.id}>
                  <img
                    src={item.product.img}
                    alt={item.product.alt}
                    className={`cart-item-img tint-${item.product.tint}${item.product.photo ? ' cart-item-img--photo' : ''}`}
                  />
                  <div className="cart-item-info">
                    <div className="cart-item-top">
                      <span className="cart-item-name">{item.product.name}</span>
                      <button
                        type="button"
                        className="cart-item-del"
                        onClick={() => removeFromCart(item.product.id)}
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                    <span className="cart-item-var">{item.product.variant}</span>
                    <div className="cart-item-foot">
                      <div className="qty-control">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon />
                        </button>
                        <span>{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, 1)}
                          aria-label="Increase quantity"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                      <span className="cart-item-price">₹{item.product.price * item.qty}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-subtotal-row">
                <span>Estimated Total</span>
                <strong>₹{cartSubtotal}</strong>
              </div>
              <p className="cart-disclaimer">
                Shipping calculated by pincode. Orders are confirmed and paid directly via WhatsApp or Instagram.
              </p>
              <div className="cart-ctas">
                <a
                  className="btn btn--primary cart-wa-btn"
                  href={cartWhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon /> Order Bag on WhatsApp
                </a>
                <a
                  className="btn btn--ghost"
                  href={IG_DM}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramIcon /> Send via Instagram
                </a>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div
          className="modal-backdrop"
          onClick={() => setQuickViewProduct(null)}
          role="dialog"
          aria-modal="true"
          aria-label={quickViewProduct.name}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setQuickViewProduct(null)}
              aria-label="Close details"
            >
              <CloseIcon />
            </button>

            <div className="modal-grid">
              <div className={`modal-media tint-${quickViewProduct.tint}${quickViewProduct.photo ? ' modal-media--photo' : ''}`}>
                <img
                  src={quickViewProduct.img}
                  alt={quickViewProduct.alt}
                  width={quickViewProduct.width}
                  height={quickViewProduct.height}
                />
                <span className="modal-badge">{quickViewProduct.tag}</span>
              </div>

              <div className="modal-details">
                <p className="modal-category">{quickViewProduct.variant}</p>
                <h3 className="modal-title">{quickViewProduct.name}</h3>

                <div className="modal-rating">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} />
                    ))}
                  </div>
                  <span>{quickViewProduct.rating} ({quickViewProduct.reviewCount} customer reviews)</span>
                </div>

                <div className="modal-price">
                  <span className="cur">₹</span>
                  {quickViewProduct.price}
                  {quickViewProduct.priceNote && <small>{quickViewProduct.priceNote}</small>}
                  <span className="modal-weight">• {quickViewProduct.weight}</span>
                </div>

                <p className="modal-desc">{quickViewProduct.desc}</p>
                <p className="modal-extra">{quickViewProduct.details}</p>

                <div className="spec-card">
                  <div className="spec-item">
                    <span className="spec-label">Scent Notes:</span>
                    <span className="spec-val">{quickViewProduct.scent}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Key Botanicals:</span>
                    <span className="spec-val">{quickViewProduct.ingredients}</span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => {
                      addToCart(quickViewProduct)
                      setQuickViewProduct(null)
                      setCartOpen(true)
                    }}
                  >
                    <BagIcon /> Add to Bag (₹{quickViewProduct.price})
                  </button>

                  <a
                    className="btn btn--ghost"
                    href={singleProductOrderLink(quickViewProduct)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon /> Instant WhatsApp Order
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main id="top">
        {/* Hero Section */}
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="hero-badge-pill">
                <LeafIcon /> Small Batch Artisanal Soap Studio
              </div>
              <h1 className="hero-title">
                Little soaps,
                <br />
                <em>endless joy.</em>
              </h1>
              <p className="hero-lede">
                Hand-sculpted botanical soap in shapes too lovely to forget — crafted with pure,
                palm-oil-free plant butters, cold-pressed oils, and subtle natural fragrances.
              </p>

              <div className="hero-actions">
                <a className="btn btn--primary" href="#shop">
                  Explore the Collection <ArrowRightIcon />
                </a>
                <a className="btn btn--ghost" href="#hamper-builder">
                  <GiftIcon /> Build a Custom Hamper
                </a>
              </div>

              <div className="hero-proof">
                <div className="rating-pill">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} />
                    ))}
                  </div>
                  <span><strong>4.9 / 5</strong> rating from 500+ happy baths across India</span>
                </div>
              </div>

              <ul className="trust-row">
                <li><LeafIcon /> 100% Botanical</li>
                <li><DropIcon /> Palm-Oil Free</li>
                <li><LoopIcon /> Zero Waste Heart</li>
                <li><SparkleIcon /> Handcrafted</li>
              </ul>
            </div>

            <div className="collage">
              <div className="hero-card hero-card--main">
                <img
                  src="/products/forever-bloom.jpg"
                  alt="Forever Bloom — a hand-sculpted magenta rose soap"
                  width="1239"
                  height="1270"
                  fetchPriority="high"
                />
              </div>
              <div className="hero-card hero-card--camera">
                <img
                  src="/products/love-rides-camera.jpg"
                  alt="Love Rides — a glossy teal vintage camera-shaped soap"
                  width="1536"
                  height="1024"
                  loading="lazy"
                />
              </div>
              <div className="hero-card hero-card--eye">
                <img
                  src="/products/evil-eye-gems.jpg"
                  alt="Evil Eye — glossy evil-eye soap gems on a gold plate"
                  width="1199"
                  height="1312"
                  loading="lazy"
                />
              </div>

              <div className="hero-tag">
                <span>Featured Signature</span>
                <strong>Forever Bloom <em>₹100</em></strong>
              </div>

              <div className="spin-badge" aria-hidden="true">
                <svg className="spin-svg" viewBox="0 0 96 96">
                  <defs>
                    <path
                      id="spin-path"
                      d="M48,48 m-33,0 a33,33 0 1,1 66,0 a33,33 0 1,1 -66,0"
                    />
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

        {/* Marquee Banner */}
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            <div className="marquee-group">
              {marqueeItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="marquee-group">
              {marqueeItems.map((item) => (
                <span key={`${item}-2`}>{item}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Collection Section */}
        <section className="section shop" id="shop">
          <div className="container">
            <div className="section-head" data-reveal>
              <div>
                <p className="eyebrow">The Collection</p>
                <h2 className="section-title">
                  Pick your <em>sculpted joy.</em>
                </h2>
              </div>
              <p className="section-note">
                Hand-poured in limited small batches. Add individual bars to your bag or click any soap for detailed scent notes and botanical ingredients.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="category-filter-bar" data-reveal>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  className={`category-pill${activeCategory === cat.id ? ' is-active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                  <span className="category-count">
                    {cat.id === 'all'
                      ? products.length
                      : products.filter((p) => p.category === cat.id).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="product-grid">
              {filteredProducts.map((product, index) => (
                <article
                  className="product-card"
                  key={product.id}
                  data-reveal
                  style={{ transitionDelay: `${(index % 3) * 70}ms` }}
                >
                  <div
                    className={`product-media tint-${product.tint}${
                      product.photo ? ' product-media--photo' : ''
                    }`}
                  >
                    <img
                      src={product.img}
                      alt={product.alt}
                      width={product.width}
                      height={product.height}
                      loading={index < 3 ? 'eager' : 'lazy'}
                    />
                    <span className="product-badge">{product.tag}</span>

                    {/* Quick View Button on Card */}
                    <button
                      type="button"
                      className="quick-view-btn"
                      onClick={() => setQuickViewProduct(product)}
                      aria-label={`Quick view ${product.name}`}
                    >
                      <EyeIcon /> Quick View
                    </button>
                  </div>

                  <div className="product-body">
                    <div className="product-head-row">
                      <h3 className="product-name">{product.name}</h3>
                      <div className="product-card-rating">
                        <StarIcon /> <span>{product.rating}</span>
                      </div>
                    </div>
                    <p className="product-variant">{product.variant} · {product.weight}</p>
                    <p className="product-scent-chip">🌿 {product.scent}</p>
                    <p className="product-desc">{product.desc}</p>

                    <div className="product-foot">
                      <p className="price">
                        <span className="cur">₹</span>
                        {product.price}
                        {product.priceNote && <small>{product.priceNote}</small>}
                      </p>

                      <div className="product-actions">
                        <button
                          type="button"
                          className="btn-add-bag"
                          onClick={() => addToCart(product)}
                          title="Add to soap bag"
                        >
                          <BagIcon /> Add
                        </button>

                        <a
                          className="btn-order"
                          href={singleProductOrderLink(product)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Order directly on WhatsApp"
                        >
                          Order <ArrowUpRightIcon />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="shop-perks-banner" data-reveal>
              <div className="perk">
                <GiftIcon />
                <div>
                  <strong>Bespoke Gifting Box</strong>
                  <span>Free decorative packaging when you buy 3 or more soaps</span>
                </div>
              </div>
              <div className="perk">
                <DropIcon />
                <div>
                  <strong>Gentle on Skin</strong>
                  <span>100% palm-oil free, made with nourishing botanical oils</span>
                </div>
              </div>
              <div className="perk">
                <WhatsAppIcon />
                <div>
                  <strong>Direct Soapmaker Support</strong>
                  <span>Real-time assistance, customization and pincode confirmation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Custom Hamper Builder Section */}
        <section className="section hamper-section" id="hamper-builder">
          <div className="container">
            <div className="hamper-builder-card" data-reveal>
              <div className="hamper-builder-grid">
                <div className="hamper-left">
                  <p className="eyebrow">Interactive Studio</p>
                  <h2 className="builder-title">
                    Build your custom <em>gift hamper.</em>
                  </h2>
                  <p className="builder-desc">
                    Choose 2 to 4 of your favorite sculpted pieces, pick your gift packaging, and write a personalized greeting card. Perfect for birthdays, weddings, or a thoughtful surprise.
                  </p>

                  {/* Step 1: Soap Selector */}
                  <div className="builder-step">
                    <span className="builder-step-label">
                      Step 1: Pick your soaps ({hamperItems.length}/4 selected)
                    </span>
                    <div className="builder-soap-options">
                      {products.map((p) => {
                        const isSelected = hamperItems.includes(p.id)
                        return (
                          <button
                            type="button"
                            key={p.id}
                            className={`soap-select-pill${isSelected ? ' is-selected' : ''}`}
                            onClick={() => toggleHamperItem(p.id)}
                          >
                            <span className="select-check">{isSelected ? '✓' : '+'}</span>
                            <span className="select-name">{p.name}</span>
                            <span className="select-price">₹{p.price}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Step 2: Packaging Style */}
                  <div className="builder-step">
                    <span className="builder-step-label">Step 2: Choose Box Style</span>
                    <div className="box-style-toggle">
                      <button
                        type="button"
                        className={`box-opt-btn${boxStyle === 'ribbon' ? ' is-active' : ''}`}
                        onClick={() => setBoxStyle('ribbon')}
                      >
                        🌿 Signature Kraft Box with Forest Ribbon (Complimentary)
                      </button>
                      <button
                        type="button"
                        className={`box-opt-btn${boxStyle === 'luxury' ? ' is-active' : ''}`}
                        onClick={() => setBoxStyle('luxury')}
                      >
                        ✨ Royal Shimmer Box with Botanical Twig
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Card Note */}
                  <div className="builder-step">
                    <span className="builder-step-label">Step 3: Handwritten Gift Card Note</span>
                    <input
                      type="text"
                      className="hamper-input"
                      value={hamperNote}
                      onChange={(e) => setHamperNote(e.target.value)}
                      placeholder="e.g. Happy Birthday Sneha! Hope you love these."
                      maxLength={120}
                    />
                  </div>
                </div>

                {/* Right: Live Preview Box */}
                <div className="hamper-preview-panel">
                  <div className="preview-box">
                    <div className="preview-box-header">
                      <GiftIcon />
                      <span>SaBun Bespoke Gift Box</span>
                    </div>

                    <div className="box-slots-grid">
                      {hamperItems.map((id) => {
                        const prod = products.find((p) => p.id === id)
                        if (!prod) return null
                        return (
                          <div className={`box-slot filled tint-${prod.tint}${prod.photo ? ' box-slot--photo' : ''}`} key={id}>
                            <img src={prod.img} alt={prod.alt} />
                            <span className="slot-name">{prod.name}</span>
                            <button
                              type="button"
                              className="slot-remove"
                              onClick={() => toggleHamperItem(id)}
                              title="Remove from hamper"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      })}
                      {Array.from({ length: Math.max(0, 4 - hamperItems.length) }).map((_, i) => (
                        <div className="box-slot empty" key={`empty-${i}`}>
                          <PlusIcon />
                          <span>Add soap</span>
                        </div>
                      ))}
                    </div>

                    <div className="preview-card-display">
                      <div className="preview-card-inner">
                        <span className="card-badge">Gift Note Included</span>
                        <p className="card-message-text">"{hamperNote || 'Your custom message here'}"</p>
                      </div>
                    </div>

                    <div className="preview-summary">
                      <div className="preview-price-row">
                        <span>Hamper Value</span>
                        <strong>
                          ₹{hamperItems.reduce((acc, id) => {
                            const p = products.find((item) => item.id === id)
                            return acc + (p ? p.price : 0)
                          }, 0)}
                        </strong>
                      </div>
                      <a
                        className="btn btn--cream hamper-checkout-btn"
                        href={hamperWhatsAppLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <WhatsAppIcon /> Order This Hamper via WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="section story" id="story">
          <div className="container story-grid">
            <div className="story-media" data-reveal>
              <img
                src="/products/bestie-bears.jpg"
                alt="Bestie Bears — a pair of handcrafted bear-shaped soaps"
                width="1200"
                height="1600"
                loading="lazy"
              />
              <span className="story-sticker">small batch, big heart</span>
            </div>

            <div className="story-copy" data-reveal>
              <p className="eyebrow">Our Story</p>
              <h2 className="section-title">
                Made slowly by hand, meant for <em>peaceful little rituals.</em>
              </h2>
              <p className="story-text">
                SaBun began with a simple belief: the ordinary rituals we repeat every day should carry a spark of beauty. We take pure cold-pressed oils, rich unrefined butters and botanical clays, and hand-pour them into shapes that make you smile every time you wash your hands.
              </p>
              <p className="story-text">
                Every batch cures naturally over weeks. We formulate 100% free from palm oil, synthetic foaming agents, and animal testing. Slow craft means fewer bars, but infinite care in each one.
              </p>
              <p className="signature">— with warmth &amp; love, Team SaBun</p>

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

        {/* Clean Ingredients Spotlight */}
        <section className="section ingredients-section">
          <div className="container">
            <div className="steps-head" data-reveal>
              <p className="eyebrow eyebrow--center">Pure Transparency</p>
              <h2 className="section-title">
                What goes into every <em>bar.</em>
              </h2>
              <p className="section-sub">
                No hidden chemicals or artificial fillers. Just honest, food-grade and cosmetic botanicals that pamper your skin barrier.
              </p>
            </div>

            <div className="ingredient-cards-grid" data-reveal>
              <div className="ing-card">
                <span className="ing-icon">🥥</span>
                <h3>Cold-Pressed Oils</h3>
                <p>Pure coconut, sweet almond and extra virgin olive oil create a naturally conditioning, creamy lather.</p>
              </div>
              <div className="ing-card">
                <span className="ing-icon">🧈</span>
                <h3>Raw Plant Butters</h3>
                <p>Unrefined Shea and Cocoa butters lock in hydration, preventing the dryness of commercial soap bars.</p>
              </div>
              <div className="ing-card">
                <span className="ing-icon">🌸</span>
                <h3>Natural Clays &amp; Micas</h3>
                <p>French Pink Clay, Kaolin and mineral micas give our soaps their soft pastel colors and gentle detox qualities.</p>
              </div>
              <div className="ing-card">
                <span className="ing-icon">🚫</span>
                <h3>The "Zero" Guarantee</h3>
                <p>0% Palm Oil, 0% Parabens, 0% SLS/SLES sulfates, and 0% animal cruelty. Truly safe for delicate skin.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section className="section reviews-section" id="reviews">
          <div className="container">
            <div className="section-head" data-reveal>
              <div>
                <p className="eyebrow">Customer Love</p>
                <h2 className="section-title">
                  Loved across <em>500+ homes.</em>
                </h2>
              </div>
              <div className="overall-rating-card">
                <div className="rating-num">4.9</div>
                <div className="rating-meta">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} />
                    ))}
                  </div>
                  <span>Over 1,200+ handcrafted bars delivered</span>
                </div>
              </div>
            </div>

            <div className="reviews-grid" data-reveal>
              {reviews.map((rev) => (
                <div className="review-card" key={rev.id}>
                  <div className="review-top">
                    <div className="stars">
                      {[...Array(rev.rating)].map((_, i) => (
                        <StarIcon key={i} />
                      ))}
                    </div>
                    <span className="review-soap-tag">{rev.soap}</span>
                  </div>
                  <p className="review-quote">"{rev.quote}"</p>
                  <div className="review-author">
                    <div className="author-avatar">{rev.name.charAt(0)}</div>
                    <div>
                      <strong className="author-name">{rev.name}</strong>
                      <span className="author-city">{rev.city} · Verified Customer</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Order */}
        <section className="section" id="how">
          <div className="container">
            <div className="steps-head" data-reveal>
              <p className="eyebrow eyebrow--center">Simple Ordering</p>
              <h2 className="section-title">
                Ordering is as easy as a <em>friendly chat.</em>
              </h2>
              <p className="section-sub">
                No rigid checkout accounts or forgotten passwords. Speak directly with us — the way artisanal shopping should feel.
              </p>
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

        {/* FAQ Section */}
        <section className="section faq" id="faq">
          <div className="container faq-grid">
            <div className="faq-head" data-reveal>
              <p className="eyebrow">Good to Know</p>
              <h2>
                Good questions,
                <br />
                <em>honest answers.</em>
              </h2>
              <p>Curious about custom wedding batches, allergies or delivery to your city? We’re always ready to chat.</p>
              <div className="faq-ctas">
                <a
                  className="btn btn--primary"
                  href={helloWa}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon /> Message on WhatsApp
                </a>
                <a
                  className="btn btn--ghost"
                  href={IG_DM}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramIcon /> DM on Instagram
                </a>
              </div>
            </div>

            <div className="faq-list" data-reveal>
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index
                return (
                  <div
                    className={`faq-item${isOpen ? ' is-open' : ''}`}
                    key={faq.q}
                  >
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

        {/* Instagram Grid Band */}
        <section className="ig-band" id="instagram">
          <div className="container">
            <div className="ig-head" data-reveal>
              <div>
                <p className="eyebrow">@hellosabun</p>
                <h2 className="section-title">
                  Fresh pours, <em>in your feed.</em>
                </h2>
              </div>
              <p>
                Follow our daily studio pours, new seasonal shapes, and behind-the-scenes sculpting on Instagram.
              </p>
            </div>

            <div className="ig-grid" data-reveal>
              {igTiles.map((tile) => (
                <a
                  className={`ig-tile ig-tile--${tile.tint}${tile.photo ? ' ig-tile--photo' : ''}`}
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
              <a
                className="btn btn--primary"
                href={IG_PROFILE}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramIcon /> Follow @hellosabun on Instagram
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="footer-name">
                <LeafIcon /> SaBun
              </span>
              <p>
                Handcrafted botanical soap, made slowly in small batches. Pure ingredients,
                palm-oil free, zero waste at heart. Based in India, shipping joy nationwide.
              </p>
              <div className="footer-social">
                <a href={IG_DM} target="_blank" rel="noopener noreferrer">
                  <InstagramIcon /> Instagram DM
                </a>
                <a href={helloWa} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon /> WhatsApp Chat
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Explore</h4>
              <ul>
                <li><a href="#shop">The Collection</a></li>
                <li><a href="#hamper-builder">Custom Hampers</a></li>
                <li><a href="#story">Our Story</a></li>
                <li><a href="#reviews">Customer Reviews</a></li>
                <li><a href="#faq">FAQs</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Signature Soaps</h4>
              <ul>
                <li><a href="#shop">Forever Bloom · ₹100</a></li>
                <li><a href="#shop">Evil Eye Talisman · ₹150</a></li>
                <li><a href="#shop">Love Rides Camera · ₹100</a></li>
                <li><a href="#shop">Bestie Bears · ₹85</a></li>
                <li><a href="#hamper-builder">Custom Gift Hamper</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Connect With Us</h4>
              <ul>
                <li>
                  <a href={IG_PROFILE} target="_blank" rel="noopener noreferrer">
                    @hellosabun on Instagram
                  </a>
                </li>
                <li>
                  <a
                    className="footer-phone"
                    href={waLink('Hi SaBun! I have a question about placing an order.')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {WA_DISPLAY}
                  </a>
                </li>
                <li>
                  <span className="footer-note">
                    All orders are carefully packed in plastic-free packaging and confirmed directly with you.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} SaBun Studio. All rights reserved.</span>
            <span>
              Handcrafted with <span className="heart">♥</span> in India
            </span>
            <a href={IG_PROFILE} target="_blank" rel="noopener noreferrer">
              Instagram ↗
            </a>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Quick Action Button */}
      <a
        className="floating-wa-btn"
        href={helloWa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat directly with soapmaker on WhatsApp"
        title="Chat with soapmaker"
      >
        <span className="wa-pulse-dot" />
        <WhatsAppIcon />
        <span className="wa-tooltip">Order on WhatsApp</span>
      </a>

      {/* Sticky Mobile Order Bar */}
      <div className="mobile-bar">
        <button
          type="button"
          className="mob-btn mob-btn--bag"
          onClick={() => setCartOpen(true)}
        >
          <BagIcon />
          <span>Bag {totalCartCount > 0 ? `(${totalCartCount})` : ''}</span>
        </button>

        <a
          className="mob-btn mob-btn--wa"
          href={totalCartCount > 0 ? cartWhatsAppLink : helloWa}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon />
          <span>{totalCartCount > 0 ? `Order (₹${cartSubtotal})` : 'Order on WhatsApp'}</span>
        </a>
      </div>
    </>
  )
}

export default App
