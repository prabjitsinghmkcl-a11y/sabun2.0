import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ImagePlus, Link2, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { uploadImage } from '../../lib/api'
import { useProducts } from '../../context/ProductsContext'
import { Alert, PageHead, Switch, inr } from './ui'

const TINTS = ['bloom', 'gems', 'talisman', 'bus', 'camera', 'bears']

export const emptyProduct = {
  id: '',
  name: '',
  variant: '',
  tag: '',
  price: '',
  priceNote: '',
  stock: 50,
  desc: '',
  longDesc: '',
  note: '',
  img: '',
  thumb: '',
  alt: '',
  tint: '',
  isNew: false,
  photo: true,
  personaliseOn: false,
  pLabel: '',
  pPlaceholder: '',
  pMax: 10,
}

export const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function productToForm(product) {
  if (!product) return { ...emptyProduct }
  return {
    ...emptyProduct,
    ...Object.fromEntries(
      Object.keys(emptyProduct)
        .filter((key) => product[key] != null)
        .map((key) => [key, product[key]]),
    ),
    price: product.price ?? '',
    stock: product.stock ?? 50,
    personaliseOn: Boolean(product.personalise?.label),
    pLabel: product.personalise?.label || '',
    pPlaceholder: product.personalise?.placeholder || '',
    pMax: product.personalise?.maxLength || 10,
  }
}

export function formToPayload(form) {
  return {
    id: slugify(form.id),
    name: form.name.trim(),
    variant: form.variant.trim(),
    tag: form.tag,
    price: Number(form.price),
    priceNote: form.priceNote.trim(),
    stock: Number(form.stock),
    desc: form.desc,
    longDesc: form.longDesc,
    note: form.note,
    img: form.img.trim(),
    thumb: form.thumb.trim(),
    alt: form.alt || form.name,
    tint: form.tint,
    isNew: Boolean(form.isNew),
    photo: Boolean(form.photo),
    personalise: form.personaliseOn && form.pLabel
      ? { label: form.pLabel, placeholder: form.pPlaceholder, maxLength: Number(form.pMax) || 10 }
      : null,
  }
}

export function validateProductForm(form, { editing = false } = {}) {
  if (form.name.trim().length < 2) return 'Please enter a product name'
  if (!editing && !slugify(form.id)) return 'Please enter a product id (slug), e.g. rose-soap'
  if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) return 'Please enter a valid price'
  if (!Number.isFinite(Number(form.stock)) || Number(form.stock) < 0) return 'Stock must be 0 or more'
  if (form.personaliseOn && !form.pLabel.trim()) return 'Personalise field label is required'
  return null
}

export default function ProductForm({ form, setForm, editing, busy, onSubmit, onCancel, error }) {
  const { collections } = useProducts()
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [showUrl, setShowUrl] = useState(false)

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const categories = useMemo(() => {
    const ids = collections.filter((c) => c.id !== 'all').map((c) => c.id)
    if (form.tag && !ids.includes(form.tag)) ids.push(form.tag)
    return ids
  }, [collections, form.tag])

  const preview = form.thumb || form.img
  const tintIsCustom = form.tint && !TINTS.some((tint) => form.tint === `var(--tint-${tint})`)

  const handleFile = async (file) => {
    if (!file) return
    setUploadError('')
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      return setUploadError('Choose a JPG, PNG, WEBP or GIF image')
    }
    if (file.size > 5 * 1024 * 1024) return setUploadError('Image is too large (max 5 MB)')

    setUploading(true)
    try {
      const data = await uploadImage(file)
      setForm((current) => ({ ...current, img: data.url, thumb: '', alt: current.alt || current.name }))
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const onFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    handleFile(file)
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  return (
    <form onSubmit={onSubmit} noValidate={false}>
      <Link to="/sabun-admin/products" className="sb-link" style={{ marginBottom: 14 }}>
        <ArrowLeft size={15} /> All products
      </Link>
      <PageHead
        eyebrow={editing ? 'Edit product' : 'New product'}
        title={editing ? form.name || 'Edit product' : 'Add a new soap'}
        sub={editing ? 'Update the details below. The shop refreshes as soon as you save.' : 'Add a photo, a name and a price — that’s enough to go live.'}
      />

      <Alert>{error}</Alert>

      <div className="sb-form">
        <div className="sb-stack">
          <section className="sb-card sb-pad">
            <div className="sb-step-head">
              <span className="sb-step-num">1</span>
              <div>
                <h3>The basics</h3>
                <p>What it’s called and where it lives in the shop</p>
              </div>
            </div>

            <label className="sb-field">
              <span className="sb-label">Product name <em>Required</em></span>
              <input
                type="text"
                value={form.name}
                required
                placeholder="e.g. Forever Bloom"
                onChange={(e) => {
                  const name = e.target.value
                  setForm((current) => ({
                    ...current,
                    name,
                    id: editing || current.id !== slugify(current.name) ? current.id : slugify(name),
                  }))
                }}
              />
            </label>

            <label className="sb-field">
              <span className="sb-label">Web address <em>{editing ? 'Locked' : 'Auto from name'}</em></span>
              <div className="sb-prefix">
                <span>/</span>
                <input
                  type="text"
                  value={form.id}
                  required
                  disabled={Boolean(editing)}
                  onChange={(e) => set('id', e.target.value)}
                  onBlur={(e) => set('id', slugify(e.target.value))}
                />
              </div>
              <span className="sb-hint">
                {editing ? "The web address can't change after the product is created." : `Shop link: /product/${slugify(form.id) || '…'}`}
              </span>
            </label>

            <div className="sb-grid-2">
              <label className="sb-field">
                <span className="sb-label">Variant <em>Optional</em></span>
                <input type="text" value={form.variant} onChange={(e) => set('variant', e.target.value)} placeholder="e.g. Pink tray box" />
              </label>
              <label className="sb-field">
                <span className="sb-label">Collection</span>
                <select value={form.tag} onChange={(e) => set('tag', e.target.value)}>
                  <option value="">No collection</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="sb-card sb-pad">
            <div className="sb-step-head">
              <span className="sb-step-num">2</span>
              <div>
                <h3>Price &amp; stock</h3>
                <p>Products with 10 or fewer left show up as “running low”</p>
              </div>
            </div>
            <div className="sb-grid-3">
              <label className="sb-field">
                <span className="sb-label">Price <em>Required</em></span>
                <div className="sb-prefix">
                  <span>₹</span>
                  <input type="number" min="0" step="1" value={form.price} required onChange={(e) => set('price', e.target.value)} placeholder="0" />
                </div>
              </label>
              <label className="sb-field">
                <span className="sb-label">In stock</span>
                <input type="number" min="0" step="1" value={form.stock} required onChange={(e) => set('stock', e.target.value)} />
              </label>
              <label className="sb-field">
                <span className="sb-label">Price note <em>Optional</em></span>
                <input type="text" value={form.priceNote} onChange={(e) => set('priceNote', e.target.value)} placeholder="e.g. per piece" />
              </label>
            </div>
          </section>

          <section className="sb-card sb-pad">
            <div className="sb-step-head">
              <span className="sb-step-num">3</span>
              <div>
                <h3>The story</h3>
                <p>Short line for the card, longer text for the product page</p>
              </div>
            </div>
            <label className="sb-field">
              <span className="sb-label">Card description <em>{form.desc.length}/160</em></span>
              <textarea rows={2} maxLength={160} value={form.desc} onChange={(e) => set('desc', e.target.value)} placeholder="One or two lines that make people want it." />
            </label>
            <label className="sb-field">
              <span className="sb-label">Product page description</span>
              <textarea rows={5} value={form.longDesc} onChange={(e) => set('longDesc', e.target.value)} placeholder="How it’s made, what it smells like, who it’s for…" />
            </label>
            <label className="sb-field" style={{ marginBottom: 0 }}>
              <span className="sb-label">Small note <em>Optional</em></span>
              <input type="text" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="e.g. Made to order — colours may vary" />
            </label>
          </section>
        </div>

        <aside className="sb-form-side">
          <section className="sb-card sb-pad">
            <div className="sb-card-head" style={{ marginBottom: 14 }}>
              <h3>Photo</h3>
              <button type="button" className="sb-link" style={{ border: 0, background: 'none', cursor: 'pointer', font: 'inherit' }} onClick={() => setShowUrl((v) => !v)}>
                <Link2 size={14} /> {showUrl ? 'Hide links' : 'Use a link'}
              </button>
            </div>

            {preview ? (
              <div className="sb-img" style={{ '--tint': form.tint || undefined }}>
                <img src={preview} alt="" onError={(e) => { e.currentTarget.style.opacity = '0.2' }} onLoad={(e) => { e.currentTarget.style.opacity = '1' }} />
                <div className="sb-img-actions">
                  <button type="button" className="sb-btn sb-btn--sm" style={{ flex: 1 }} onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 size={14} className="sb-spin" /> : <RefreshCw size={14} />} {uploading ? 'Uploading…' : 'Replace'}
                  </button>
                  <button type="button" className="sb-btn sb-btn--sm sb-btn--icon sb-btn--danger" onClick={() => setForm((c) => ({ ...c, img: '', thumb: '' }))} aria-label="Remove photo">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={`sb-drop${dragOver ? ' is-over' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                disabled={uploading}
              >
                <span className="sb-drop-icon">{uploading ? <Loader2 className="sb-spin" size={24} /> : <ImagePlus size={24} />}</span>
                <strong>{uploading ? 'Uploading…' : 'Drop a photo here'}</strong>
                <small>or click to choose · JPG, PNG, WEBP, GIF · max 5 MB</small>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={onFile} />
            {uploadError && <div style={{ marginTop: 12 }}><Alert>{uploadError}</Alert></div>}

            {showUrl && (
              <div style={{ marginTop: 16 }}>
                <label className="sb-field">
                  <span className="sb-label">Image link</span>
                  <input type="text" value={form.img} onChange={(e) => set('img', e.target.value)} placeholder="https://… or /products/file.jpg" />
                </label>
                <label className="sb-field">
                  <span className="sb-label">Card thumbnail link <em>Optional</em></span>
                  <input type="text" value={form.thumb} onChange={(e) => set('thumb', e.target.value)} />
                </label>
              </div>
            )}

            <label className="sb-field" style={{ marginTop: 16 }}>
              <span className="sb-label">Describe the photo <em>For screen readers</em></span>
              <input type="text" value={form.alt} onChange={(e) => set('alt', e.target.value)} placeholder="e.g. Pink rose-shaped soap" />
            </label>

            <div className="sb-label">Background colour</div>
            <div className="sb-tints" role="radiogroup" aria-label="Background colour">
              <button type="button" role="radio" aria-checked={!form.tint} title="None" className={`sb-tint sb-tint--none${!form.tint ? ' is-active' : ''}`} onClick={() => set('tint', '')} />
              {TINTS.map((tint) => {
                const value = `var(--tint-${tint})`
                return (
                  <button
                    key={tint}
                    type="button"
                    role="radio"
                    aria-checked={form.tint === value}
                    title={tint}
                    className={`sb-tint${form.tint === value ? ' is-active' : ''}`}
                    style={{ '--t': value }}
                    onClick={() => set('tint', value)}
                  />
                )
              })}
              {tintIsCustom && <button type="button" role="radio" aria-checked title={form.tint} className="sb-tint is-active" style={{ '--t': form.tint }} />}
            </div>
          </section>

          <section className="sb-card sb-pad">
            <h3 style={{ marginBottom: 6 }}>Options</h3>
            <Switch checked={form.isNew} onChange={(v) => set('isNew', v)} title="“New” badge" hint="Highlights the product in the shop" />
            <Switch checked={form.photo} onChange={(v) => set('photo', v)} title="Real photo" hint="Turn off for illustrations" />
            <Switch checked={form.personaliseOn} onChange={(v) => set('personaliseOn', v)} title="Personalised" hint="Customer types a name when ordering" />
            {form.personaliseOn && (
              <div style={{ marginTop: 10 }}>
                <label className="sb-field">
                  <span className="sb-label">Question to ask</span>
                  <input type="text" value={form.pLabel} onChange={(e) => set('pLabel', e.target.value)} placeholder="Name on the bouquet" />
                </label>
                <div className="sb-grid-2">
                  <label className="sb-field">
                    <span className="sb-label">Example</span>
                    <input type="text" value={form.pPlaceholder} onChange={(e) => set('pPlaceholder', e.target.value)} placeholder="AISH" />
                  </label>
                  <label className="sb-field">
                    <span className="sb-label">Max letters</span>
                    <input type="number" min="1" max="40" value={form.pMax} onChange={(e) => set('pMax', e.target.value)} />
                  </label>
                </div>
              </div>
            )}
          </section>

          <section className="sb-card sb-pad">
            <div className="sb-section-title">Shop preview</div>
            <div className="sb-preview-card">
              <div className="sb-pc-media" style={{ '--tint': form.tint || undefined }}>
                {preview && <img src={preview} alt="" />}
                {form.isNew && <span className="sb-pill sb-pill--new sb-pill--plain">New</span>}
              </div>
              <div className="sb-pc-body">
                {form.tag && <div className="sb-pc-tag">{form.tag}</div>}
                <div className="sb-pc-name">{form.name || 'Product name'}</div>
                {form.variant && <div className="sb-pc-variant">{form.variant}</div>}
                {form.desc && <p className="sb-preview-desc">{form.desc}</p>}
                <div className="sb-pc-foot">
                  <span className="sb-price sb-num">{form.price !== '' ? inr(form.price) : '₹—'}</span>
                  {form.priceNote && <span className="sb-muted sb-small">{form.priceNote}</span>}
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="sb-savebar">
        <span>{editing ? 'Unsaved changes are lost if you leave this page.' : 'The product goes live as soon as you create it.'}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="sb-btn sb-btn--ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" disabled={busy || uploading} className="sb-btn sb-btn--primary">
            {busy && <Loader2 size={15} className="sb-spin" />}
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </div>
    </form>
  )
}
