import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import * as site from '../data/site'

const SiteContext = createContext(null)

const defaultCopy = {
  brand: { name: 'SaBun', tagline: 'Handcrafted soap', footerText: 'Handcrafted soap, made slowly in small batches. Pure ingredients, palm-oil free, zero waste at heart.', city: 'India' },
  announcement: { items: ['Handcrafted soap', 'Palm-oil free', 'Order on WhatsApp'], cta: 'Questions? DM us' },
  header: { nav: [
    { to: '/shop', label: 'Shop', mobileLabel: 'Shop all soaps' },
    { to: '/#story', label: 'Our story', mobileLabel: 'Our story' },
    { to: '/#gifting', label: 'Gifting', mobileLabel: 'Gifting & hampers' },
    { to: '/#how', label: 'How to order', mobileLabel: 'How to order' },
    { to: '/#faq', label: 'FAQs', mobileLabel: 'FAQs' },
  ], shopCta: 'Shop now' },
  footer: { note: 'Orders are confirmed on WhatsApp before payment. Prices in INR.', instagramHandle: '@hellosabun on Instagram' },
  home: {
    hero: { eyebrow: 'Handcrafted soap · Small batches', title1: 'Little soaps,', title2: 'big joy.', lede: 'Hand-sculpted soap in shapes too lovely to forget — made with pure, palm-oil-free ingredients in small, thoughtful batches.', ctaPrimary: 'Shop the collection', ctaSecondary: 'DM us on Instagram' },
    collection: { eyebrow: 'The collection', title: 'Pick your little joy.', note: "Hand-sculpted pieces, made in small batches. Some shapes are limited — if one catches your eye, don't wait too long." },
    story: { eyebrow: 'Our story', title: 'Made by hand, meant for slow little moments.', text1: 'SaBun is a small soap studio with a simple belief: the things we reach for every day should feel a little special. So we sculpt them — into roses, lucky eyes, tiny cameras and bear-shaped friends.', text2: 'Every piece is handcrafted in small batches with pure, 100% natural ingredients. Always palm-oil free. Always zero waste at heart. And always made slowly enough to keep the joy in it.', signature: '— with love, Team SaBun', sticker: 'small batch, big heart' },
    gifting: { eyebrow: 'Gifting, sorted', title: 'Put a little joy in a box.', text: 'Birthdays, weddings, thank-yous or just because — mix any pieces from the collection into a hand-wrapped hamper. Tick “gift wrap” at checkout, or tell us the occasion and we\'ll make it feel personal.', ctaPrimary: 'Build a hamper', ctaSecondary: 'See the collection', note: 'New: Personalised Name Bouquets — ₹650' },
    how: { eyebrow: 'How it works', title: 'Cart to doorstep, in three steps.', sub: 'No payment on the website. Your order comes to us on WhatsApp, we confirm everything personally — the way handmade should be.' },
    faq: { eyebrow: 'Good to know', title1: 'Good questions,', title2: 'honest answers.', sub: "Still curious? We're only a DM away." },
    instagram: { eyebrow: '@hellosabun', title: 'A little joy, in your feed.', text: 'New shapes, fresh batches and behind-the-scenes from the studio. Follow along — and DM us when something catches your eye.', cta: 'Follow @hellosabun' },
  },
  shop: { eyebrow: 'The shop', title: 'Every little joy, in one place.', lede: 'Hand-sculpted, palm-oil-free soaps made in small batches. Add your favourites to the cart and send the order to us on WhatsApp.', customTitle: 'Looking for something custom?', customText: "Wedding favours, corporate gifts, a colour you can't find here — tell us what you have in mind.", customCta: 'Ask about custom orders' },
}

const defaults = {
  site: {
    igProfile: site.IG_PROFILE,
    igDm: site.IG_DM,
    waNumber: site.WA_NUMBER,
    waDisplay: site.WA_DISPLAY,
    maxQty: site.MAX_QTY,
    deliveryFee: site.DELIVERY_FEE,
    freeDeliveryAbove: site.FREE_DELIVERY_ABOVE,
    addressLine1: '',
    addressLine2: '',
    supportPhone: site.WA_DISPLAY,
    supportEmail: 'hello@sabun.in',
    weekdayHours: 'Mon – Fri, 10am – 6pm',
    weekendHours: 'Sat – Sun, 11am – 4pm',
    instagramHandle: '@hellosabun',
    instagramUrl: site.IG_PROFILE,
  },
  content: {
    promises: site.promises,
    steps: site.steps,
    faqs: site.faqs,
    marqueeItems: site.marqueeItems,
    igTiles: site.igTiles,
  },
  states: site.INDIAN_STATES,
  copy: defaultCopy,
}

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(defaults)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const data = await api.get('/settings')
      if (data?.settings) {
        setSettings((prev) => ({
          site: { ...prev.site, ...(data.settings.site || {}) },
          content: { ...prev.content, ...(data.settings.content || {}) },
          states: data.settings.states || prev.states,
          collections: data.settings.collections || prev.collections,
          copy: { ...prev.copy, ...(data.settings.copy || {}) },
        }))
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const value = useMemo(() => {
    const s = settings.site || {}
    const waLink = (message) => `https://wa.me/${s.waNumber}?text=${encodeURIComponent(message)}`
    const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`
    return {
      loading,
      refresh,
      settings,
      site: s,
      content: settings.content || defaults.content,
      states: settings.states || defaults.states,
      copy: settings.copy || defaults.copy,
      waLink,
      formatINR,
      MAX_QTY: s.maxQty ?? site.MAX_QTY,
      DELIVERY_FEE: s.deliveryFee ?? site.DELIVERY_FEE,
      FREE_DELIVERY_ABOVE: s.freeDeliveryAbove ?? site.FREE_DELIVERY_ABOVE,
      IG_PROFILE: s.igProfile || site.IG_PROFILE,
      IG_DM: s.igDm || site.IG_DM,
      WA_NUMBER: s.waNumber || site.WA_NUMBER,
      WA_DISPLAY: s.waDisplay || site.WA_DISPLAY,
    }
  }, [settings, loading])

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const ctx = useContext(SiteContext)
  if (!ctx) throw new Error('useSite must be used inside <SiteProvider>')
  return ctx
}
