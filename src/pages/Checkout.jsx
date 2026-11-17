import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import CheckoutSteps from '../components/CheckoutSteps'
import usePageTitle from '../components/usePageTitle'
import { GiftIcon, WhatsAppIcon } from '../components/Icons'
import { useCart } from '../context/CartContext'
import { buildOrderMessage, getDelivery, makeOrderRef } from '../data/order'
import { INDIAN_STATES as STATIC_STATES } from '../data/site'
import { useSite } from '../context/SiteContext'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useCountdown } from './account/OtpBox'

const SAVED_KEY = 'sabun-customer-v1'
const SAVED_FIELDS = ['name', 'phone', 'email', 'address', 'city', 'state', 'pincode']

const empty = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  gift: false,
  giftNote: '',
  notes: '',
}

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_KEY) || '{}')
    const picked = {}
    SAVED_FIELDS.forEach((key) => {
      if (typeof saved[key] === 'string') picked[key] = saved[key]
    })
    return { ...empty, ...picked }
  } catch {
    return empty
  }
}

const cleanPhone = (value) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

function validate(form) {
  const errors = {}
  if (form.name.trim().length < 2) errors.name = 'Please enter your full name.'
  if (!/^[6-9]\d{9}$/.test(cleanPhone(form.phone)))
    errors.phone = 'Enter a valid 10-digit Indian mobile number.'
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = 'This email doesn’t look right.'
  if (form.address.trim().length < 8) errors.address = 'Please add your house no., street and area.'
  if (form.city.trim().length < 2) errors.city = 'Please enter your city.'
  if (!form.state) errors.state = 'Please choose your state.'
  if (!/^[1-9]\d{5}$/.test(form.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode.'
  return errors
}

function Field({ id, label, error, optional, children, hint }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>
        {label} {optional && <span className="optional">(optional)</span>}
      </label>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  )
}

export default function Checkout() {
  const { items, count, subtotal, clearCart } = useCart()
  const { states, formatINR, waLink, DELIVERY_FEE, FREE_DELIVERY_ABOVE } = useSite()
  const INDIAN_STATES = states?.length ? states : STATIC_STATES
  const deliveryConfig = { deliveryFee: DELIVERY_FEE, freeDeliveryAbove: FREE_DELIVERY_ABOVE, formatINR }
  const navigate = useNavigate()
  const [form, setForm] = useState(loadSaved)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef(null)
  const { user, sendOtp, loginWithOtp } = useAuth()
  const savedAddresses = user?.addresses || []
  const [pickedAddress, setPickedAddress] = useState(null)
  const [saveToAccount, setSaveToAccount] = useState(false)
  // Mobile OTP login at the delivery-details step
  const [otpSentTo, setOtpSentTo] = useState('')
  const [otp, setOtp] = useState('')
  const [otpLeft, setOtpLeft] = useCountdown()
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpNote, setOtpNote] = useState(null)
  usePageTitle('Checkout')

  const applyAddress = (a) => {
    setPickedAddress(a.id)
    setForm((current) => ({
      ...current,
      name: a.name || current.name,
      phone: a.phone || current.phone,
      address: a.address,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    }))
    setErrors({})
  }

  // Logged-in customers: fill in their default address and email
  useEffect(() => {
    if (!user) return
    const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0]
    if (def) applyAddress(def)
    else {
      setForm((current) => ({
        ...current,
        name: current.name || user.name || '',
        phone: current.phone || user.phone || '',
      }))
      setSaveToAccount(true)
    }
    setForm((current) => ({ ...current, email: current.email || user.email || '' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    try {
      const toSave = {}
      SAVED_FIELDS.forEach((key) => (toSave[key] = form[key]))
      localStorage.setItem(SAVED_KEY, JSON.stringify(toSave))
    } catch {
      /* ignore */
    }
  }, [form])

  if (items.length === 0 && !submitted) return <Navigate to="/cart" replace />

  const delivery = getDelivery(subtotal, deliveryConfig)
  const total = subtotal + delivery.fee

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    if (['address', 'city', 'state', 'pincode'].includes(key)) setPickedAddress(null)
    if (key === 'phone') {
      setOtpSentTo('')
      setOtp('')
      setOtpLeft(0)
      setOtpNote(null)
    }
    setForm((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const phoneNow = cleanPhone(form.phone)
  const otpActive = Boolean(otpSentTo) && otpSentTo === phoneNow

  // Delivery step: the mobile number is the login. An OTP must be verified
  // before the order can be placed; a new number creates an account using the
  // name entered in this form.
  const sendOtpCode = async () => {
    setOtpNote(null)
    if (!/^[6-9]\d{9}$/.test(phoneNow)) {
      setErrors((current) => ({ ...current, phone: 'Enter a valid 10-digit Indian mobile number.' }))
      return
    }
    setOtpSending(true)
    try {
      const res = await sendOtp(phoneNow)
      setOtpSentTo(phoneNow)
      setOtp('')
      setOtpLeft(res.retryAfter || 60)
      setOtpNote({
        type: 'ok',
        text: res.devCode
          ? `OTP sent to +91 ${phoneNow}. Dev OTP: ${res.devCode}`
          : `OTP sent to +91 ${phoneNow}. It is valid for 5 minutes.`,
      })
    } catch (err) {
      if (err.data?.retryAfter) setOtpLeft(err.data.retryAfter)
      setOtpNote({ type: 'error', text: err.message || 'Could not send the OTP.' })
    } finally {
      setOtpSending(false)
    }
  }

  const verifyOtp = async () => {
    setOtpNote(null)
    if (!otpActive) {
      setOtpNote({ type: 'error', text: 'Send an OTP to this number first.' })
      return
    }
    if (otp.length !== 6) {
      setOtpNote({ type: 'error', text: 'Enter the 6-digit OTP.' })
      return
    }
    setOtpVerifying(true)
    try {
      await loginWithOtp(phoneNow, otp, { name: form.name.trim(), email: form.email.trim() })
      setOtp('')
      setOtpNote({ type: 'ok', text: 'Mobile verified — your saved details are filled in.' })
    } catch (err) {
      if (err.status === 404) {
        setOtpNote({
          type: 'info',
          text: 'New number — enter your full name above, then verify the same OTP to create your account.',
        })
      } else if (err.data?.retryAfter) {
        setOtpLeft(err.data.retryAfter)
        setOtpNote({ type: 'error', text: err.message })
      } else {
        setOtpNote({ type: 'error', text: err.message || 'Could not verify the OTP.' })
      }
    } finally {
      setOtpVerifying(false)
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    const firstBad = Object.keys(found)[0]
    if (firstBad) {
      formRef.current?.querySelector(`[name="${firstBad}"]`)?.focus()
      return
    }

    // Verified mobile login is required to place an order.
    if (!user) {
      setOtpNote({
        type: 'error',
        text: otpActive ? 'Verify the OTP to log in, then place your order.' : 'Verify your mobile number with an OTP to place the order.',
      })
      document.getElementById(otpActive ? 'co-otp' : 'phone')?.focus()
      return
    }

    const customer = {
      ...form,
      name: form.name.trim(),
      phone: `+91 ${cleanPhone(form.phone)}`,
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      pincode: form.pincode.trim(),
      giftNote: form.giftNote.trim(),
      notes: form.notes.trim(),
    }
    const ref = makeOrderRef()

    // Save a new address to the customer's account (best-effort)
    if (user && saveToAccount && !pickedAddress && savedAddresses.length < 10) {
      api
        .post('/account/addresses', {
          label: 'Home',
          name: customer.name,
          phone: cleanPhone(form.phone),
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
        })
        .catch(() => {})
    }

    const message = buildOrderMessage({ ref, items, subtotal, customer, deliveryConfig })
    const url = waLink(message)

    // Save order to MongoDB (best-effort) when backend is available
    try {
      await api.post('/orders', {
        ref,
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          variant: item.product.variant,
          price: item.product.price,
          qty: item.qty,
          custom: item.custom || '',
          lineTotal: item.lineTotal,
        })),
        subtotal,
        deliveryFee: delivery.fee,
        deliveryKnown: delivery.known,
        total,
        customer,
        channel: 'whatsapp',
      })
    } catch (err) {
      // DB save failed (e.g. backend not running / no URI) — continue with WhatsApp flow
      console.warn('Order DB save failed:', err?.message || err)
    }

    const win = window.open(url, '_blank')
    setSubmitted(true)
    const order = {
      ref,
      url,
      total,
      deliveryKnown: delivery.known,
      count,
      name: customer.name.split(' ')[0],
      opened: Boolean(win),
    }
    try {
      sessionStorage.setItem('sabun-last-order', JSON.stringify(order))
    } catch {
      /* ignore */
    }
    clearCart()
    navigate('/order-sent', { replace: true, state: order })
  }

  const errorProps = (key) =>
    errors[key] ? { 'aria-invalid': true, 'aria-describedby': `${key}-error` } : {}

  return (
    <section className="section section--tight checkout-page">
      <div className="container">
        <div className="checkout-head">
          <CheckoutSteps current={1} />
          <h1 className="page-title">
            Where should we <em>send the joy?</em>
          </h1>
        </div>

        <div className="checkout-grid">
          <form className="checkout-form" ref={formRef} onSubmit={onSubmit} noValidate>
            {!user && (
              <p className="co-account-hint">
                Verify your mobile number with an OTP to place your order. No password needed — your saved details load automatically.{' '}
                <Link to="/account/login?next=/checkout">View account</Link>
              </p>
            )}
            {user && savedAddresses.length > 0 && (
              <div className="co-saved">
                <span>Deliver to a saved address</span>
                <div>
                  {savedAddresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={pickedAddress === a.id ? 'is-active' : ''}
                      onClick={() => applyAddress(a)}
                    >
                      <strong>{a.label}</strong>
                      <small>{a.address.slice(0, 32)}{a.address.length > 32 ? '…' : ''}, {a.city}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <fieldset>
              <legend>Your details</legend>
              <div className="field-row">
                <Field id="name" label="Full name" error={errors.name}>
                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={set('name')}
                    {...errorProps('name')}
                  />
                </Field>
                <Field
                  id="phone"
                  label="Mobile number"
                  error={errors.phone}
                  hint={user ? `Logged in as +91 ${user.phone || phoneNow}.` : otpActive ? undefined : 'This number is your login. We’ll send an OTP to verify it.'}
                >
                  <div className="input-prefix">
                    <span>+91</span>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="98765 43210"
                      value={form.phone}
                      onChange={set('phone')}
                      disabled={otpSending || otpVerifying}
                      {...errorProps('phone')}
                    />
                  </div>
                  {!user && (
                    <>
                      {!otpActive ? (
                        <button
                          type="button"
                          className="co-mobile-login"
                          onClick={sendOtpCode}
                          disabled={otpSending}
                        >
                          {otpSending ? 'Sending OTP…' : 'Send OTP'}
                        </button>
                      ) : (
                        <div className="co-otp-block">
                          <div className="co-otp-row">
                            <input
                              id="co-otp"
                              className="co-otp-input"
                              type="text"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={6}
                              placeholder="••••••"
                              aria-label="6-digit OTP"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="co-mobile-login"
                              onClick={verifyOtp}
                              disabled={otpVerifying || otp.length !== 6}
                            >
                              {otpVerifying ? 'Verifying…' : 'Verify & log in'}
                            </button>
                          </div>
                          <span className="co-otp-hint">
                            {otpLeft > 0 ? (
                              `Resend OTP in ${otpLeft}s`
                            ) : (
                              <button type="button" className="co-otp-resend" onClick={sendOtpCode} disabled={otpSending}>
                                {otpSending ? 'Sending…' : 'Resend OTP'}
                              </button>
                            )}
                          </span>
                        </div>
                      )}
                      {otpNote && (
                        <span className={`co-mobile-note is-${otpNote.type}`}>{otpNote.text}</span>
                      )}
                    </>
                  )}
                </Field>
              </div>
              <Field id="email" label="Email" optional error={errors.email}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  {...errorProps('email')}
                />
              </Field>
            </fieldset>

            <fieldset>
              <legend>Delivery address</legend>
              <Field id="address" label="House no., street, area, landmark" error={errors.address}>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  autoComplete="street-address"
                  value={form.address}
                  onChange={set('address')}
                  {...errorProps('address')}
                />
              </Field>
              <div className="field-row field-row--3">
                <Field id="city" label="City" error={errors.city}>
                  <input
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={set('city')}
                    {...errorProps('city')}
                  />
                </Field>
                <Field id="state" label="State" error={errors.state}>
                  <select
                    id="state"
                    name="state"
                    autoComplete="address-level1"
                    value={form.state}
                    onChange={set('state')}
                    {...errorProps('state')}
                  >
                    <option value="">Select…</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="pincode" label="Pincode" error={errors.pincode}>
                  <input
                    id="pincode"
                    name="pincode"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    value={form.pincode}
                    onChange={set('pincode')}
                    {...errorProps('pincode')}
                  />
                </Field>
              </div>
            </fieldset>

            <fieldset>
              <legend>Extras</legend>
              <label className={`gift-toggle${form.gift ? ' is-on' : ''}`}>
                <input type="checkbox" name="gift" checked={form.gift} onChange={set('gift')} />
                <span className="gift-toggle-icon">
                  <GiftIcon />
                </span>
                <span>
                  <strong>Gift wrap this order</strong>
                  <small>We&apos;ll hand-wrap it and add your note.</small>
                </span>
              </label>
              {form.gift && (
                <Field id="giftNote" label="Gift note" optional>
                  <textarea
                    id="giftNote"
                    name="giftNote"
                    rows={2}
                    maxLength={200}
                    placeholder="Happy birthday, bestie! ♥"
                    value={form.giftNote}
                    onChange={set('giftNote')}
                  />
                </Field>
              )}
              <Field
                id="notes"
                label="Order notes"
                optional
                hint="Colour preferences for Bestie Bears, delivery date, anything else."
              >
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  maxLength={400}
                  value={form.notes}
                  onChange={set('notes')}
                />
              </Field>
            </fieldset>

            {user && !pickedAddress && savedAddresses.length < 10 && (
              <label className="co-save-address">
                <input type="checkbox" checked={saveToAccount} onChange={(e) => setSaveToAccount(e.target.checked)} />
                Save this address to my account
              </label>
            )}

            {Object.values(errors).some(Boolean) && (
              <p className="form-error" role="alert">
                Please fix the highlighted fields above.
              </p>
            )}

            <button type="submit" className="btn btn--wa checkout-submit">
              <WhatsAppIcon /> Send order on WhatsApp
            </button>
            <p className="checkout-fineprint">
              This opens WhatsApp with your order filled in — just hit send. Nothing is charged here;
              we&apos;ll confirm availability, delivery and payment with you.
            </p>
          </form>

          <aside className="summary summary--sticky">
            <h2>Your order</h2>
            <ul className="summary-items">
              {items.map((item) => (
                <li key={item.key}>
                  <span
                    className={`summary-thumb${item.product.photo ? ' is-photo' : ''}`}
                    style={{ '--product-tint': item.product.tint }}
                  >
                    <img src={item.product.thumb || item.product.img} alt="" />
                    <span className="summary-qty">{item.qty}</span>
                  </span>
                  <span className="summary-name">
                    {item.product.name}
                    <small>
                      {item.product.variant}
                      {item.custom ? ` · “${item.custom}”` : ''}
                    </small>
                  </span>
                  <span className="summary-price">{formatINR(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatINR(subtotal)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd className={delivery.known ? '' : 'muted'}>{delivery.label}</dd>
              </div>
              {form.gift && (
                <div>
                  <dt>Gift wrap</dt>
                  <dd>Yes</dd>
                </div>
              )}
              <div className="summary-total">
                <dt>Total</dt>
                <dd>
                  {formatINR(total)}
                  {!delivery.known && <small>+ delivery</small>}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </section>
  )
}
