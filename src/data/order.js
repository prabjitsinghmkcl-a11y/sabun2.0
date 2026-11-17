import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, formatINR as formatINRStatic } from './site'

export function getDelivery(subtotal, config = {}) {
  const deliveryFee = config.deliveryFee ?? DELIVERY_FEE
  const freeAbove = config.freeDeliveryAbove ?? FREE_DELIVERY_ABOVE
  const formatINR = config.formatINR || formatINRStatic
  if (deliveryFee == null) {
    return { fee: 0, label: 'Confirmed on WhatsApp', known: false }
  }
  if (freeAbove != null && subtotal >= freeAbove) {
    return { fee: 0, label: 'Free', known: true }
  }
  return { fee: deliveryFee, label: formatINR(deliveryFee), known: true }
}

export function makeOrderRef() {
  const d = new Date()
  const date = `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `SB-${date}-${rand}`
}

export function buildOrderMessage({ ref, items, subtotal, customer, deliveryConfig }) {
  const formatINR = deliveryConfig?.formatINR || formatINRStatic
  const delivery = getDelivery(subtotal, deliveryConfig)
  const total = subtotal + delivery.fee
  const lines = [
    `Hi SaBun! I'd like to place an order.`,
    ``,
    `*Order ref:* ${ref}`,
    ``,
    `*Items*`,
    ...items.map(
      (item, i) =>
        `${i + 1}. ${item.product.name} (${item.product.variant})${
          item.custom ? ` — Name: "${item.custom}"` : ''
        } × ${item.qty} = ${formatINR(item.lineTotal)}`,
    ),
    ``,
    `Subtotal: ${formatINR(subtotal)}`,
    delivery.known
      ? `Delivery: ${delivery.label}`
      : `Delivery: please confirm for my pincode`,
    `*Total: ${formatINR(total)}*${delivery.known ? '' : ' + delivery'}`,
    ``,
    `*Deliver to*`,
    customer.name,
    `Phone: ${customer.phone}`,
    customer.email ? `Email: ${customer.email}` : null,
    customer.address,
    `${customer.city}, ${customer.state} - ${customer.pincode}`,
  ]

  if (customer.gift) {
    lines.push(``, `*Gift wrap:* Yes`)
    if (customer.giftNote) lines.push(`Gift note: "${customer.giftNote}"`)
  }
  if (customer.notes) {
    lines.push(``, `*Notes:* ${customer.notes}`)
  }
  lines.push(``, `Please confirm availability and payment details. Thank you!`)

  return lines.filter((line) => line !== null).join('\n')
}
