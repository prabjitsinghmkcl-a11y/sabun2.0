import { useEffect, useState } from 'react'
import { CheckCircle2, Code2, Home, Layers, Loader2, MapPin, MessageCircle, RotateCcw, Save, Store, Truck, Type, X } from 'lucide-react'
import { api } from '../../lib/api'
import { useSite } from '../../context/SiteContext'
import { useProducts } from '../../context/ProductsContext'
import usePageTitle from '../../components/usePageTitle'
import { Alert, Empty, PageHead } from './ui'
import { ValueEditor, labelFor } from './SettingsEditor'

const CONTACT_FIELDS = [
  { key: 'addressLine1', label: 'Address line 1', type: 'text' },
  { key: 'addressLine2', label: 'Address line 2', type: 'text' },
  { key: 'supportPhone', label: 'Support phone (shown to customers)', type: 'tel' },
  { key: 'supportEmail', label: 'Support email', type: 'email' },
  { key: 'weekdayHours', label: 'Weekday hours', type: 'text' },
  { key: 'weekendHours', label: 'Weekend hours', type: 'text' },
  { key: 'instagramHandle', label: 'Instagram handle', hint: 'e.g. @hellosabun', type: 'text' },
  { key: 'instagramUrl', label: 'Instagram URL', type: 'url' },
]

const SITE_FIELDS = [
  { key: 'waNumber', label: 'WhatsApp number (for links)', hint: 'Country code + number, digits only — e.g. 919266145378', type: 'tel' },
  { key: 'waDisplay', label: 'WhatsApp number (as shown on site)', hint: 'e.g. +91 92661 45378', type: 'text' },
  { key: 'igProfile', label: 'Instagram profile link', type: 'url' },
  { key: 'igDm', label: 'Instagram DM link', hint: 'e.g. https://ig.me/m/hellosabun', type: 'url' },
  { key: 'maxQty', label: 'Max quantity per item', type: 'number' },
  { key: 'deliveryFee', label: 'Delivery fee (₹)', hint: 'Leave empty = “confirmed on WhatsApp”', type: 'number', nullable: true },
  { key: 'freeDeliveryAbove', label: 'Free delivery above (₹)', hint: 'Leave empty to turn off', type: 'number', nullable: true },
]

const ALL_FIELDS = [...CONTACT_FIELDS, ...SITE_FIELDS]

// Content settings shown as visual editors (in this order)
const CONTENT_SECTIONS = {
  content: { icon: Home, title: 'Home page lists', sub: 'Promises, how-it-works steps, FAQs, the scrolling strip and Instagram photos.' },
  copy: { icon: Type, title: 'Words on the site', sub: 'Headings, paragraphs and button text for every page. Open a page to edit its text.' },
  collections: {
    icon: Layers,
    title: 'Shop collections',
    sub: 'The filter buttons on the Shop page.',
    listOptions: {
      lockItem: (item) => item?.id === 'all',
      itemHint: 'ID must match the “Collection” chosen on products. “All soaps” (id: all) is required and can’t be removed.',
    },
  },
  states: { icon: MapPin, title: 'States at checkout', sub: 'The state dropdown customers choose from.' },
}

function ContentSection({ id, value, onSaved, busy, setBusy, setError }) {
  const meta = CONTENT_SECTIONS[id] || { icon: Code2, title: labelFor(id), sub: 'Custom setting' }
  const Icon = meta.icon
  const [draft, setDraft] = useState(value)
  const valueJson = JSON.stringify(value)
  const [baseJson, setBaseJson] = useState(valueJson)
  const [json, setJson] = useState(null) // advanced mode text, or null
  // Only reset when this section's saved value really changed
  // (saving another section must not wipe unsaved edits here)
  if (baseJson !== valueJson) {
    setBaseJson(valueJson)
    setDraft(value)
    setJson(null)
  }
  const dirty = json !== null ? json !== JSON.stringify(value, null, 2) : JSON.stringify(draft) !== valueJson

  const save = async () => {
    setError('')
    let next = draft
    if (json !== null) {
      try {
        next = JSON.parse(json)
      } catch (e) {
        return setError(`${meta.title}: the advanced text has a mistake (${e.message}). Fix it or click Undo.`)
      }
    }
    if (id === 'collections' && Array.isArray(next)) {
      const ids = next.map((c) => String(c?.id || '').trim())
      if (ids.some((x) => !x)) return setError('Every collection needs an ID.')
      if (new Set(ids).size !== ids.length) return setError('Two collections have the same ID.')
      if (!ids.includes('all')) return setError('The “All soaps” collection (id: all) is required.')
    }
    if (Array.isArray(next) && next.some((x) => typeof x === 'string')) {
      next = next.map((x) => (typeof x === 'string' ? x.trim() : x)).filter((x) => x !== '')
    }
    setBusy(true)
    try {
      const d = await api.put('/admin/settings', { [id]: next })
      onSaved(d.settings || {}, meta.title)
    } catch (e) {
      setError(`${meta.title}: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  const undo = () => {
    setDraft(value)
    setJson(null)
  }

  return (
    <section id={`set-${id}`} className="sb-card sb-pad se-section">
      <div className="sb-step-head">
        <span className="sb-step-num"><Icon size={15} /></span>
        <div style={{ flex: 1 }}>
          <h3>{meta.title}</h3>
          <p>{meta.sub}</p>
        </div>
        {dirty && <span className="sb-pill sb-pill--pending">Unsaved</span>}
      </div>

      {json === null ? (
        <ValueEditor name={id} value={draft} onChange={setDraft} listOptions={meta.listOptions} />
      ) : (
        <textarea
          className="sb-code"
          spellCheck={false}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={Math.min(26, Math.max(8, json.split('\n').length + 1))}
        />
      )}

      <div className="se-actions">
        <button
          type="button"
          className="sb-btn sb-btn--sm sb-btn--ghost se-adv"
          onClick={() => {
            if (json === null) setJson(JSON.stringify(draft, null, 2))
            else {
              try {
                setDraft(JSON.parse(json))
                setJson(null)
              } catch (e) {
                setError(`${meta.title}: fix the advanced text first (${e.message}).`)
              }
            }
          }}
        >
          <Code2 size={14} /> {json === null ? 'Advanced (JSON)' : 'Back to simple editor'}
        </button>
        <span style={{ flex: 1 }} />
        <button type="button" className="sb-btn sb-btn--sm sb-btn--ghost" onClick={undo} disabled={!dirty || busy}>
          <RotateCcw size={14} /> Undo
        </button>
        <button type="button" className="sb-btn sb-btn--sm sb-btn--primary" onClick={save} disabled={!dirty || busy}>
          {busy ? <Loader2 size={14} className="sb-spin" /> : <Save size={14} />} Save {meta.title.toLowerCase()}
        </button>
      </div>
    </section>
  )
}

export default function AdminSettings() {
  const { refresh: refreshSite } = useSite()
  const { refresh: refreshProducts } = useProducts()
  const [settings, setSettings] = useState(null)
  const [siteForm, setSiteForm] = useState({})
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  usePageTitle('Settings')

  // Auto-hide the "saved" toast; scroll errors into view
  useEffect(() => {
    if (!msg) return undefined
    const t = setTimeout(() => setMsg(''), 4000)
    return () => clearTimeout(t)
  }, [msg])
  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [error])

  const apply = (s) => {
    setSettings(s)
    const site = s.site || {}
    setSiteForm(Object.fromEntries(ALL_FIELDS.map((f) => [f.key, site[f.key] ?? ''])))
  }

  const load = async () => {
    try {
      apply((await api.get('/admin/settings')).settings || {})
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const afterSave = (s, label) => {
    apply(s)
    setMsg(`Saved ${label}. The live site now uses the new values.`)
    refreshSite()
    refreshProducts()
  }

  const saveSite = async (e) => {
    e.preventDefault()
    setMsg('')
    setError('')
    const next = { ...(settings?.site || {}) }
    for (const f of ALL_FIELDS) {
      const raw = siteForm[f.key]
      if (f.type === 'number') {
        if (raw === '' || raw == null) {
          if (f.nullable) next[f.key] = null
          else return setError(`${f.label} is required`)
        } else {
          const n = Number(raw)
          if (!Number.isFinite(n) || n < 0) return setError(`${f.label} must be a number`)
          next[f.key] = n
        }
      } else if (f.key === 'waNumber') {
        next[f.key] = String(raw).replace(/\D/g, '')
      } else {
        next[f.key] = String(raw ?? '').trim()
      }
    }
    if (next.waNumber && next.waNumber.length < 10) return setError('WhatsApp number looks too short — include the country code, e.g. 91XXXXXXXXXX')
    setBusy(true)
    try {
      const d = await api.put('/admin/settings', { site: next })
      afterSave(d.settings || {}, 'contact & delivery')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const order = Object.keys(CONTENT_SECTIONS)
  const keys = settings
    ? Object.keys(settings)
        .filter((k) => k !== 'site')
        .sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99) || a.localeCompare(b))
    : []
  const byKey = Object.fromEntries(SITE_FIELDS.map((f) => [f.key, f]))
  const groups = [
    { id: 'contact', icon: Store, title: 'Shop contact', sub: 'Shown on the contact section and footer', fields: CONTACT_FIELDS },
    { id: 'social', icon: MessageCircle, title: 'WhatsApp & Instagram', sub: 'Where order and chat buttons send customers', fields: ['waNumber', 'waDisplay', 'igProfile', 'igDm'].map((k) => byKey[k]) },
    { id: 'delivery', icon: Truck, title: 'Orders & delivery', sub: 'Cart limits and delivery charges', fields: ['maxQty', 'deliveryFee', 'freeDeliveryAbove'].map((k) => byKey[k]) },
  ]

  const renderField = (f) => (
    <label key={f.key} className="sb-field">
      <span className="sb-label">
        {f.label}
        {f.nullable && <em>Optional</em>}
      </span>
      {f.type === 'number' && /fee|above/i.test(f.key) ? (
        <div className="sb-prefix">
          <span>₹</span>
          <input type="number" min={0} value={siteForm[f.key] ?? ''} onChange={(e) => setSiteForm((v) => ({ ...v, [f.key]: e.target.value }))} />
        </div>
      ) : (
        <input
          type={f.type}
          min={f.type === 'number' ? 0 : undefined}
          value={siteForm[f.key] ?? ''}
          onChange={(e) => setSiteForm((v) => ({ ...v, [f.key]: e.target.value }))}
        />
      )}
      {f.hint && <span className="sb-hint">{f.hint}</span>}
    </label>
  )

  return (
    <div>
      <PageHead eyebrow="Settings" title="Shop settings" sub="Contact details, WhatsApp, delivery charges and all the words on the site — just edit and save, no code needed." />

      <Alert onClose={() => setError('')}>{error}</Alert>
      {!settings && !error && <div className="sb-card"><Empty icon={Loader2} title="Loading settings…" /></div>}

      {settings && (
        <div className="sb-settings">
          <nav className="sb-settings-nav" aria-label="Settings sections">
            {groups.map((g) => {
              const Icon = g.icon
              return <a key={g.id} href={`#set-${g.id}`}><Icon size={16} /> {g.title}</a>
            })}
            {keys.map((k) => {
              const Icon = CONTENT_SECTIONS[k]?.icon || Code2
              return <a key={k} href={`#set-${k}`}><Icon size={16} /> {CONTENT_SECTIONS[k]?.title || labelFor(k)}</a>
            })}
          </nav>

          <div className="sb-settings-body">
            <form onSubmit={saveSite} className="sb-stack">
              {groups.map((g) => {
                const Icon = g.icon
                return (
                  <section key={g.id} id={`set-${g.id}`} className="sb-card sb-pad">
                    <div className="sb-step-head">
                      <span className="sb-step-num"><Icon size={15} /></span>
                      <div>
                        <h3>{g.title}</h3>
                        <p>{g.sub}</p>
                      </div>
                    </div>
                    <div className="sb-grid-2">{g.fields.filter(Boolean).map(renderField)}</div>
                  </section>
                )
              })}
              <div className="sb-savebar" style={{ marginTop: 0 }}>
                <span>Changes apply to the live shop as soon as you save.</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="sb-btn sb-btn--ghost" onClick={() => apply(settings)} disabled={busy}>Reset</button>
                  <button type="submit" disabled={busy} className="sb-btn sb-btn--primary">
                    {busy && <Loader2 size={15} className="sb-spin" />} {busy ? 'Saving…' : 'Save settings'}
                  </button>
                </div>
              </div>
            </form>

            {!keys.length && <Alert>No site content in the database yet. Run <code>npm run seed</code> once to load the defaults.</Alert>}
            {keys.map((key) => (
              <ContentSection
                key={key}
                id={key}
                value={settings[key]}
                onSaved={afterSave}
                busy={busy}
                setBusy={setBusy}
                setError={setError}
              />
            ))}
          </div>
        </div>
      )}

      {msg && (
        <div className="sb-toasts">
          <div className="sb-toast sb-toast--plain" role="status">
            <span className="sb-toast-icon"><CheckCircle2 size={17} /></span>
            <span className="sb-toast-body"><strong>Saved</strong><span>{msg}</span></span>
            <button type="button" className="sb-toast-x" style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => setMsg('')} aria-label="Dismiss"><X size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
