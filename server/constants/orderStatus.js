// Single source of truth for order statuses and allowed transitions.
// The admin UI fetches this from GET /api/admin/meta so both sides stay in sync.

export const ORDER_STATUSES = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled']

export const ALLOWED_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'paid', 'shipped', 'delivered', 'cancelled'],
  confirmed: ['paid', 'shipped', 'delivered', 'cancelled'],
  paid: ['shipped', 'delivered', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function canTransition(from, to) {
  if (from === to) return true
  return (ALLOWED_STATUS_TRANSITIONS[from] || []).includes(to)
}

export function nextStatuses(from) {
  return ALLOWED_STATUS_TRANSITIONS[from] || []
}
