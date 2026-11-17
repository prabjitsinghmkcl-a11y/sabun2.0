// Visual editor for the site's content settings.
// Turns any JSON value (objects, lists, text, numbers) into a normal form,
// so admins never have to type brackets, quotes or commas.
import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from 'lucide-react'

/* ---------- Friendly names for keys ---------- */
const LABELS = {
  // lists on the home page
  promises: 'Promises (icon row)',
  steps: 'How-it-works steps',
  faqs: 'FAQs',
  marqueeItems: 'Scrolling text strip',
  igTiles: 'Instagram photos',
  // common fields
  q: 'Question',
  a: 'Answer',
  num: 'Step number',
  icon: 'Icon',
  img: 'Image link',
  alt: 'Image description',
  id: 'ID',
  label: 'Name shown',
  to: 'Link (page)',
  mobileLabel: 'Name in mobile menu',
  eyebrow: 'Small heading (above title)',
  title: 'Title',
  title1: 'Title — line 1',
  title2: 'Title — line 2',
  sub: 'Subtitle',
  lede: 'Intro text',
  text: 'Text',
  text1: 'Paragraph 1',
  text2: 'Paragraph 2',
  note: 'Note',
  cta: 'Button text',
  ctaPrimary: 'Main button text',
  ctaSecondary: 'Second button text',
  shopCta: '“Shop now” button text',
  customTitle: 'Custom-order box — title',
  customText: 'Custom-order box — text',
  customCta: 'Custom-order box — button',
  footerText: 'Footer text',
  tagline: 'Tagline',
  name: 'Name',
  city: 'City',
  items: 'Items',
  nav: 'Menu links',
  signature: 'Signature',
  sticker: 'Sticker text',
  instagramHandle: 'Instagram handle',
  // copy sections
  brand: 'Brand',
  announcement: 'Top announcement bar',
  header: 'Header & menu',
  footer: 'Footer',
  home: 'Home page',
  hero: 'Hero (top banner)',
  collection: 'Collection section',
  story: 'Our story',
  gifting: 'Gifting',
  how: 'How it works',
  faq: 'FAQ section',
  instagram: 'Instagram section',
  shop: 'Shop page',
  cart: 'Cart page',
  checkout: 'Checkout page',
  product: 'Product page',
  orderSent: 'Order sent page',
  account: 'My account',
  notFound: '“Page not found” page',
}

const HINTS = {
  to: 'e.g. /shop or /#faq',
  img: 'Paste an image link (https://…) or a path like /products/rose.jpg',
  num: 'e.g. 01',
}

const ICONS = [
  { value: 'leaf', label: '🌿 Leaf' },
  { value: 'drop', label: '💧 Drop' },
  { value: 'loop', label: '♻️ Loop' },
  { value: 'sparkle', label: '✨ Sparkle' },
]

const LONG_KEYS = new Set(['a', 'text', 'text1', 'text2', 'lede', 'sub', 'note', 'footerText', 'customText'])

export function labelFor(key) {
  if (LABELS[key]) return LABELS[key]
  const words = String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
  return words ? words[0].toUpperCase() + words.slice(1).toLowerCase() : 'Value'
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

// A blank copy with the same shape — used for "+ Add" in lists
function blankLike(sample) {
  if (Array.isArray(sample)) return []
  if (isObj(sample)) return Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, blankLike(v)]))
  if (typeof sample === 'number') return 0
  if (typeof sample === 'boolean') return false
  return ''
}

// Short title for a list card ("Item 2 · What are your soaps made of?")
function itemTitle(item) {
  if (!isObj(item)) return ''
  const pick = item.title || item.q || item.label || item.name || item.alt || item.text || ''
  const s = String(pick)
  return s.length > 60 ? `${s.slice(0, 60)}…` : s
}

/* ---------- Single values ---------- */
function TextInput({ name, value, onChange }) {
  const v = value ?? ''
  if (name === 'icon') {
    const known = ICONS.some((i) => i.value === v)
    return (
      <select value={v} onChange={(e) => onChange(e.target.value)}>
        {!known && <option value={v}>{v || '— choose —'}</option>}
        {ICONS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
      </select>
    )
  }
  const long = LONG_KEYS.has(name) || String(v).length > 70
  if (long) {
    return (
      <textarea
        rows={Math.min(8, Math.max(2, Math.ceil(String(v).length / 70)))}
        value={v}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  return <input type="text" value={v} onChange={(e) => onChange(e.target.value)} />
}

function Leaf({ name, value, onChange, showLabel = true }) {
  let control
  if (typeof value === 'boolean') {
    control = (
      <label className="sb-switch" style={{ padding: 0 }}>
        <span><strong>{value ? 'On' : 'Off'}</strong></span>
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <i />
      </label>
    )
  } else if (typeof value === 'number') {
    control = (
      <input type="number" value={value} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
    )
  } else {
    control = (
      <TextInput
        name={name}
        value={value}
        // keep "nothing" as null if it started as null
        onChange={(v) => onChange(value === null && v === '' ? null : v)}
      />
    )
  }
  const img = name === 'img' && typeof value === 'string' && value.trim()
  return (
    <div className="sb-field se-leaf">
      {showLabel && <span className="sb-label">{labelFor(name)}</span>}
      <div className={img ? 'se-img-row' : undefined}>
        {img && <img className="sb-thumb" src={value} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} onLoad={(e) => { e.currentTarget.style.visibility = 'visible' }} />}
        {control}
      </div>
      {HINTS[name] && <span className="sb-hint">{HINTS[name]}</span>}
    </div>
  )
}

/* ---------- Lists ---------- */
function ListEditor({ name, value, onChange, lockItem, itemHint }) {
  const [openIdx, setOpenIdx] = useState(null)
  const objects = value.some(isObj)
  const sample = value.find((x) => x !== undefined)

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
    if (openIdx === i) setOpenIdx(j)
  }
  const remove = (i) => {
    const what = objects ? itemTitle(value[i]) || `item ${i + 1}` : `“${value[i]}”`
    if (!window.confirm(`Remove ${what}?`)) return
    onChange(value.filter((_, k) => k !== i))
    setOpenIdx(null)
  }
  const add = () => {
    const item = sample === undefined ? '' : blankLike(sample)
    onChange([...value, item])
    if (objects) setOpenIdx(value.length)
  }
  const setAt = (i, v) => onChange(value.map((x, k) => (k === i ? v : x)))

  return (
    <div className="se-list">
      {value.length === 0 && <p className="sb-muted sb-small">Nothing here yet.</p>}

      {!objects &&
        value.map((item, i) => (
          <div key={i} className="se-row">
            <span className="se-idx">{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Leaf name={name} value={item} onChange={(v) => setAt(i, v)} showLabel={false} />
            </div>
            <div className="se-tools">
              <button type="button" className="sb-btn sb-btn--sm sb-btn--icon sb-btn--ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={14} /></button>
              <button type="button" className="sb-btn sb-btn--sm sb-btn--icon sb-btn--ghost" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move down"><ArrowDown size={14} /></button>
              <button type="button" className="sb-btn sb-btn--sm sb-btn--icon sb-btn--ghost sb-btn--danger" onClick={() => remove(i)} aria-label="Remove"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}

      {objects &&
        value.map((item, i) => {
          const open = openIdx === i
          const locked = lockItem?.(item)
          return (
            <div key={i} className={`se-card${open ? ' is-open' : ''}`}>
              <div className="se-card-head">
                <button type="button" className="se-card-toggle" onClick={() => setOpenIdx(open ? null : i)} aria-expanded={open}>
                  <span className="se-idx">{i + 1}</span>
                  <span className="se-card-title">{itemTitle(item) || <em>New item — click to fill in</em>}</span>
                  <ChevronDown size={16} />
                </button>
                <div className="se-tools">
                  <button type="button" className="sb-btn sb-btn--sm sb-btn--icon sb-btn--ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={14} /></button>
                  <button type="button" className="sb-btn sb-btn--sm sb-btn--icon sb-btn--ghost" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move down"><ArrowDown size={14} /></button>
                  <button
                    type="button"
                    className="sb-btn sb-btn--sm sb-btn--icon sb-btn--ghost sb-btn--danger"
                    onClick={() => remove(i)}
                    disabled={locked}
                    title={locked ? 'This item is needed by the site' : 'Remove'}
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {open && (
                <div className="se-card-body">
                  {itemHint && <p className="sb-hint" style={{ marginTop: 0, marginBottom: 10 }}>{itemHint}</p>}
                  <ValueEditor value={item} onChange={(v) => setAt(i, v)} depth={2} />
                </div>
              )}
            </div>
          )
        })}

      <button type="button" className="sb-btn sb-btn--sm" onClick={add}>
        <Plus size={14} /> Add {objects ? 'item' : 'line'}
      </button>
    </div>
  )
}

/* ---------- Any value ---------- */
export function ValueEditor({ name, value, onChange, depth = 0, listOptions }) {
  if (Array.isArray(value)) {
    return <ListEditor name={name} value={value} onChange={onChange} {...listOptions} />
  }
  if (isObj(value)) {
    const entries = Object.entries(value)
    const simple = entries.filter(([, v]) => !isObj(v) && !Array.isArray(v))
    const nested = entries.filter(([, v]) => isObj(v) || Array.isArray(v))
    const set = (k, v) => onChange({ ...value, [k]: v })
    return (
      <div className="se-obj">
        {simple.length > 0 && (
          <div className={simple.length > 1 && depth > 0 ? 'sb-grid-2 se-grid' : undefined}>
            {simple.map(([k, v]) => {
              const wide = LONG_KEYS.has(k) || String(v ?? '').length > 70
              return (
                <div key={k} style={wide ? { gridColumn: '1 / -1' } : undefined}>
                  <Leaf name={k} value={v} onChange={(nv) => set(k, nv)} />
                </div>
              )
            })}
          </div>
        )}
        {nested.map(([k, v]) => (
          <Group key={k} title={labelFor(k)} count={Array.isArray(v) ? v.length : undefined} defaultOpen={depth === 0 && nested.length === 1}>
            <ValueEditor name={k} value={v} onChange={(nv) => set(k, nv)} depth={depth + 1} />
          </Group>
        ))}
      </div>
    )
  }
  return <Leaf name={name} value={value} onChange={onChange} />
}

function Group({ title, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`sb-acc se-group${open ? ' is-open' : ''}`}>
      <button type="button" className="sb-acc-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <strong style={{ fontSize: 13.5 }}>{title}</strong>
        {count !== undefined && <span>{count} item{count === 1 ? '' : 's'}</span>}
        <ChevronDown size={18} />
      </button>
      {open && <div className="sb-acc-body">{children}</div>}
    </div>
  )
}
