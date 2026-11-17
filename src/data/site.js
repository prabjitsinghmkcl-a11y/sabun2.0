/* ------------------------------------------------------------------ */
/*  Contact + links                                                    */
/*  Change these values in one place and the whole site updates.       */
/* ------------------------------------------------------------------ */

export const IG_PROFILE = 'https://www.instagram.com/hellosabun/'
export const IG_DM = 'https://ig.me/m/hellosabun'
export const WA_NUMBER = '919266145378'
export const WA_DISPLAY = '+91 92661 45378'

export const waLink = (message) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`

export const helloWa = waLink(
  "Hi SaBun! I'd like to place an order and have a quick question about your soaps.",
)

/* Cart rules */
export const MAX_QTY = 20

/* Delivery: kept as a note, confirmed on WhatsApp by pincode.
   To charge a flat fee later, set DELIVERY_FEE (e.g. 60) and
   FREE_DELIVERY_ABOVE (e.g. 499). Leave as null to skip. */
export const DELIVERY_FEE = null
export const FREE_DELIVERY_ABOVE = null

export const formatINR = (amount) => `₹${amount.toLocaleString('en-IN')}`

/* ------------------------------------------------------------------ */
/*  Page content                                                       */
/* ------------------------------------------------------------------ */

export const promises = [
  { icon: 'leaf', title: '100% natural', text: 'Pure ingredients, nothing unnecessary.' },
  { icon: 'drop', title: 'Palm-oil free', text: 'Kinder to your skin and the forests.' },
  { icon: 'loop', title: 'Zero waste', text: 'Thoughtfully wrapped, never overproduced.' },
  { icon: 'sparkle', title: 'Hand-sculpted', text: 'Every piece has its own little character.' },
]

export const steps = [
  {
    num: '01',
    title: 'Fill your cart',
    text: 'Pick the pieces you love from the shop and add them to your cart. Mix and match freely.',
  },
  {
    num: '02',
    title: 'Send it on WhatsApp',
    text: 'At checkout, add your address and tap "Send order". Your full order lands in our WhatsApp.',
  },
  {
    num: '03',
    title: 'We confirm & ship',
    text: 'We confirm availability, delivery and your final total. Once paid, your soaps are hand-wrapped and sent off.',
  },
]

export const faqs = [
  {
    q: 'What are your soaps made of?',
    a: 'Every SaBun piece is handcrafted with 100% natural, pure ingredients — and always palm-oil free. For the full ingredient list of a specific piece, just DM us and we will happily share it.',
  },
  {
    q: 'How do I place an order?',
    a: 'Add the pieces you like to your cart, fill in your delivery details at checkout and tap "Send order on WhatsApp". We will confirm availability, delivery and the final total before you pay. You can still DM us on Instagram if you prefer.',
  },
  {
    q: 'Do I pay on the website?',
    a: 'No — nothing is charged on the website. Once we confirm your order on WhatsApp, we share the payment details with you.',
  },
  {
    q: 'Do you take custom or bulk orders?',
    a: 'Yes! Custom shapes, colours, wedding favours and gifting hampers are some of our favourite things to make. Message us with your idea and timeline.',
  },
  {
    q: 'How long does delivery take?',
    a: "Since everything is made in small batches, timelines vary a little. We'll share the delivery estimate and charges for your pincode when we confirm your order.",
  },
  {
    q: 'Can I gift these?',
    a: 'Absolutely. Tick "gift wrap" at checkout and add a note — we will hand-wrap your order. Hampers are our love language.',
  },
  {
    q: 'How should I care for my soap?',
    a: 'Keep it on a draining soap dish, away from standing water between uses. A little care keeps handmade soap beautiful for longer.',
  },
]

export const marqueeItems = [
  '100% natural',
  'Palm-oil free',
  'Zero waste',
  'Hand-sculpted',
  'Small batch',
  'Made with love',
]

export const igTiles = [
  { img: 'https://res.cloudinary.com/kkocbepk/image/upload/v1794819100/sabun/products/forever-bloom.jpg', alt: 'Forever Bloom rose soap' },
  { img: 'https://res.cloudinary.com/kkocbepk/image/upload/v1794819099/sabun/products/evil-eye-talisman.jpg', alt: 'Gold shimmer Evil Eye soap' },
  { img: 'https://res.cloudinary.com/kkocbepk/image/upload/v1794819101/sabun/products/love-rides-camera.jpg', alt: 'Love Rides vintage camera soap' },
  { img: 'https://res.cloudinary.com/kkocbepk/image/upload/v1794819100/sabun/products/love-rides-bus.jpg', alt: 'Love Rides caramel bus soap' },
  { img: 'https://res.cloudinary.com/kkocbepk/image/upload/v1794819097/sabun/products/bestie-bears.jpg', alt: 'Bestie Bears handmade soaps', photo: true },
]

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]
