/** Default status assigned when creating a new reservation via the API. */
export const DEFAULT_RESERVATION_STATUS = 'CONFIRMADA' as const;

/**
 * Statuses counted as "active" for dashboard stats:
 * today's check-ins, check-outs, and the running active-reservation count.
 *
 * This is intentionally narrower than bloquea_disponibilidad (which also
 * covers PENDIENTE) because dashboard stats represent operationally active
 * reservations, not every status that physically blocks a location.
 */
export const ACTIVE_STATS_STATUSES = ['CONFIRMADA', 'EN_CURSO'] as const;

/**
 * Statuses excluded from expected-revenue totals.
 * Cancelled reservations are not expected to generate revenue.
 */
export const EXCLUDED_REVENUE_STATUSES = ['CANCELADA'] as const;

/**
 * Statuses that block client deactivation.
 * A client with a reservation in any of these states still has open
 * commitments; the operation must be resolved before deactivating.
 */
export const BLOCKING_CLIENT_DEACTIVATION_STATUSES = new Set<string>([
  'PENDIENTE',
  'CONFIRMADA',
  'EN_CURSO',
]);

/**
 * Statuses for which registering a new payment is forbidden.
 *
 * These are terminal or voided states; no new charges should be applied:
 * - CANCELADA  : reservation was cancelled — no further payments.
 * - NO_SHOW    : guest did not arrive — no further payments.
 * - COMPLETADA : reservation fully completed — accounting is closed.
 * - FINALIZADA : reservation formally closed out — accounting is closed.
 *
 * COMPLETADA and FINALIZADA are both recognised as terminal "done" states by
 * the loyalty module (loyalty/loyalty.ts → LOYALTY_COMPLETED_STATUSES).
 */
export const BLOCKED_PAYMENT_STATUSES = new Set<string>([
  'CANCELADA',
  'NO_SHOW',
  'COMPLETADA',
  'FINALIZADA',
]);
