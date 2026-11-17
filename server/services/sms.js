// Sends login OTPs through the Pinnacle / 1SPOC SMS gateway.
// Local development can print the code to the server console when
// SMS_DEV_MODE=true and no gateway credentials are configured.

const DEFAULT_API_URL = 'https://transapi.pinnacle.in/genericapi/JSONGenericReceiver'
const SENDER_ID_LENGTH = 6

export function smsConfigured() {
  return Boolean(
    process.env.SMS_ACCESS_KEY &&
      process.env.SMS_SENDER_ID &&
      process.env.SMS_DLT_ENTITY_ID &&
      process.env.SMS_DLT_TEMPLATE_ID,
  )
}

function gatewayMessage(data) {
  if (!data || typeof data !== 'object') return ''
  return String(
    data.message ||
      data.reason ||
      data.error ||
      data.description ||
      data.statusMessage ||
      '',
  )
}

export async function sendOtpSms(phone, code) {
  const template = process.env.SMS_OTP_TEMPLATE || 'Your SaBun OTP is {OTP}. Valid for 5 minutes.'
  // DLT templates usually use {OTP}, {#var#} or ##OTP## as the variable placeholder.
  const message = template
    .replace(/\{OTP\}/g, code)
    .replace(/\{#var#\}/g, code)
    .replace(/##OTP##/g, code)

  if (!smsConfigured()) {
    // Never silently log OTPs in production. Local dev must opt in explicitly.
    if (process.env.SMS_DEV_MODE !== 'true') {
      throw new Error('SMS is not configured. Please contact SaBun on WhatsApp.')
    }
    console.log(`[sms:dev] OTP for ${phone}: ${code}`)
    return { dev: true }
  }

  const senderId = String(process.env.SMS_SENDER_ID).trim()
  if (senderId.length !== SENDER_ID_LENGTH) {
    throw new Error(
      `SMS sender ID must be exactly ${SENDER_ID_LENGTH} characters (DLT header), got "${senderId}".`,
    )
  }
  if (!message.includes(code)) {
    throw new Error('SMS template is missing an OTP placeholder ({OTP}, {#var#} or ##OTP##).')
  }

  // Pinnacle JSONGenericReceiver expects the message(s) inside a `messages` array.
  const payload = {
    version: '1.0',
    accesskey: process.env.SMS_ACCESS_KEY,
    messages: [
      {
        dest: [String(phone).replace(/\D/g, '').slice(-10)],
        msg: message,
        type: process.env.SMS_TYPE || 'PM',
        header: senderId,
        app_country: '1',
        country_cd: '91',
        dlt_entity_id: process.env.SMS_DLT_ENTITY_ID,
        dlt_template_id: process.env.SMS_DLT_TEMPLATE_ID,
      },
    ],
  }

  let res
  try {
    res = await fetch(process.env.SMS_API_URL || DEFAULT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    })
  } catch (err) {
    console.error('[sms] gateway request failed:', err.message)
    throw new Error('Could not reach the SMS gateway. Please try again.', { cause: err })
  }

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    /* non-JSON responses are handled below */
  }

  // Avoid writing the OTP-bearing message to logs; only the gateway response.
  console.log(`[sms] ${res.status} -> ${text.slice(0, 300)}`)

  if (!res.ok) {
    throw new Error(`SMS gateway error (${res.status})${gatewayMessage(data) ? `: ${gatewayMessage(data)}` : ''}`)
  }

  // Pinnacle answers HTTP 200 even when it rejects a message, e.g.
  //   ok:   { "req_id": "...", "status": { "code": "200", "reason": "Application Accepted", "info": "ACCEPTED" } }
  //   fail: { "status": { "code": "1013", "reason": "Invalid DLT Template", "info": "REJECTED" } }
  // so the code inside the body decides whether the SMS really went out.
  if (data?.status && typeof data.status === 'object') {
    const code = String(data.status.code ?? '')
    if (code !== '200') {
      const reason = data.status.reason || data.status.info || `code ${code || 'unknown'}`
      console.error('[sms] Pinnacle rejected the message:', JSON.stringify(data.status))
      throw new Error(`SMS could not be sent (${reason}). Please try again or contact SaBun on WhatsApp.`)
    }
    return { dev: false, requestId: data.req_id || null }
  }

  // Other / unexpected response shapes
  const status = String(data?.status || data?.statusCode || '').toLowerCase()
  if (!data || ['error', 'failed', 'failure', 'rejected'].includes(status) || data?.error) {
    throw new Error(gatewayMessage(data) || 'SMS gateway rejected the message.')
  }

  return { dev: false }
}
