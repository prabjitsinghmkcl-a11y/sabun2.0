import { useEffect, useState } from 'react'

// Simple countdown used for "resend OTP in 60s".
export function useCountdown() {
  const [left, setLeft] = useState(0)

  useEffect(() => {
    if (left <= 0) return undefined
    const timer = setTimeout(() => setLeft((n) => Math.max(0, n - 1)), 1000)
    return () => clearTimeout(timer)
  }, [left])

  return [left, setLeft]
}

export default function OtpBox({
  id = 'otp',
  value,
  onChange,
  phone,
  left = 0,
  onResend,
  sending = false,
  autoFocus = false,
}) {
  return (
    <div className="field acc-otp">
      <label htmlFor={id}>
        Enter OTP <span className="optional">6 digits</span>
      </label>
      <input
        id={id}
        className="acc-otp-input"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="••••••"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        autoFocus={autoFocus}
      />
      <span className="field-hint">
        {phone ? <>Sent to +91 {phone}. </> : null}
        {left > 0 ? (
          `Resend in ${left}s`
        ) : (
          <button type="button" className="acc-inline-btn" onClick={onResend} disabled={sending}>
            {sending ? 'Sending…' : 'Resend OTP'}
          </button>
        )}
      </span>
    </div>
  )
}
