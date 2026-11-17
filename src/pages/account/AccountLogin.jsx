import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import usePageTitle from '../../components/usePageTitle'
import { useAuth } from '../../context/AuthContext'
import OtpBox, { useCountdown } from './OtpBox'
import './account.css'

// Only allow redirects back into our own site
const safeNext = (value) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/account')
const digits10 = (v) => String(v || '').replace(/\D/g, '').slice(-10)
const validPhone = (v) => /^[6-9]\d{9}$/.test(digits10(v))
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export default function AccountLogin() {
  const { user, loading, sendOtp, loginWithOtp } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const next = safeNext(params.get('next'))
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', otp: '' })
  const [otpSentTo, setOtpSentTo] = useState('')
  const [left, setLeft] = useCountdown()
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [sending, setSending] = useState(false)
  const [busy, setBusy] = useState(false)
  usePageTitle(mode === 'login' ? 'Log in' : 'Create account')

  if (!loading && user) return <Navigate to={next} replace />

  const phoneNow = digits10(form.phone)
  const otpActive = Boolean(otpSentTo) && otpSentTo === phoneNow

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (error) setError('')
  }

  const validate = () => {
    if (!validPhone(phoneNow)) return 'Enter a valid 10-digit mobile number.'
    if (mode === 'signup' && form.name.trim().length < 2) return 'Please enter your full name.'
    if (mode === 'signup' && form.email.trim() && !validEmail(form.email.trim())) {
      return 'This email doesn’t look right.'
    }
    return ''
  }

  const sendCode = async () => {
    setError('')
    setInfo('')
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }

    setSending(true)
    try {
      const res = await sendOtp(phoneNow)
      setOtpSentTo(phoneNow)
      setForm((f) => ({ ...f, otp: '' }))
      setLeft(res.retryAfter || 60)
      setInfo(
        res.devCode
          ? `OTP sent to +91 ${phoneNow}. Dev OTP: ${res.devCode}`
          : `OTP sent to +91 ${phoneNow}. It is valid for 5 minutes.`,
      )
    } catch (err) {
      if (err.data?.retryAfter) setLeft(err.data.retryAfter)
      setError(err.message || 'Could not send the OTP. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    if (!otpActive) {
      setError('Send an OTP first, then verify it.')
      return
    }
    const code = form.otp.replace(/\D/g, '').slice(0, 6)
    if (code.length !== 6) {
      setError('Enter the 6-digit OTP.')
      return
    }

    setBusy(true)
    try {
      const details = mode === 'signup' ? { name: form.name.trim(), email: form.email.trim() } : {}
      await loginWithOtp(phoneNow, code, details)
      navigate(next, { replace: true })
    } catch (err) {
      if (mode === 'login' && err.status === 404) {
        setMode('signup')
        setForm((f) => ({ ...f, phone: phoneNow }))
        setInfo('No account on this number yet — enter your name and verify the same OTP.')
      } else if (err.data?.retryAfter) {
        setLeft(err.data.retryAfter)
        setError(err.message)
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setInfo('')
  }

  const changeNumber = () => {
    setOtpSentTo('')
    setLeft(0)
    setForm((f) => ({ ...f, otp: '' }))
    setError('')
    setInfo('')
  }

  const submitLabel = busy ? 'Verifying…' : mode === 'login' ? 'Verify & log in' : 'Verify & create account'

  return (
    <section className="section section--tight acc-auth">
      <div className="container">
        <div className="acc-auth-card">
          <p className="eyebrow eyebrow--center">Your SaBun account</p>
          <h1 className="page-title">
            {mode === 'login' ? <>Welcome <em>back</em></> : <>Join the <em>soap club</em></>}
          </h1>
          <p className="acc-auth-sub">
            {mode === 'login'
              ? 'Enter your mobile number and verify the OTP — no password needed.'
              : 'Add your name and mobile number, verify the OTP and your account is ready.'}
          </p>

          <div className="acc-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => switchMode('login')}>
              Log in
            </button>
            <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-active' : ''} onClick={() => switchMode('signup')}>
              Create account
            </button>
          </div>

          <form onSubmit={onSubmit} className="acc-form" noValidate>
            {mode === 'signup' && (
              <div className="field">
                <label htmlFor="acc-name">Full name</label>
                <input id="acc-name" value={form.name} onChange={set('name')} autoComplete="name" required />
              </div>
            )}

            <div className="field">
              <label htmlFor="acc-phone">Mobile number</label>
              <div className="input-prefix">
                <span>+91</span>
                <input
                  id="acc-phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={set('phone')}
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  autoFocus={mode === 'login' && !otpActive}
                  disabled={sending || busy}
                  required
                />
              </div>
              <span className="field-hint">
                {mode === 'login' ? 'We’ll send a 6-digit OTP to this number.' : 'This number will be your login.'}
              </span>
            </div>

            {mode === 'signup' && (
              <div className="field">
                <label htmlFor="acc-email">Email <span className="optional">(optional)</span></label>
                <input id="acc-email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
              </div>
            )}

            {otpActive && (
              <OtpBox
                id="acc-otp"
                value={form.otp}
                onChange={(otp) => setForm((f) => ({ ...f, otp }))}
                phone={otpSentTo}
                left={left}
                onResend={sendCode}
                sending={sending}
                autoFocus
              />
            )}

            {info && !error && <p className="acc-info" role="status">{info}</p>}
            {error && <p className="acc-error" role="alert">{error}</p>}

            {otpActive ? (
              <>
                <button type="submit" className="btn btn--primary acc-submit" disabled={busy}>
                  {submitLabel}
                </button>
                <p className="acc-auth-foot">
                  Wrong number? <button type="button" onClick={changeNumber}>Change number</button>
                </p>
              </>
            ) : (
              <button type="button" className="btn btn--primary acc-submit" onClick={sendCode} disabled={sending}>
                {sending ? 'Sending OTP…' : 'Send OTP'}
              </button>
            )}
          </form>

          <p className="acc-auth-foot">
            {mode === 'login' ? (
              <>New here? <button type="button" onClick={() => switchMode('signup')}>Create an account</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => switchMode('login')}>Log in</button></>
            )}
          </p>
          <p className="acc-auth-foot">
            <Link to="/shop">← Continue shopping</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
