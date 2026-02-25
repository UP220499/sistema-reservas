import { Prisma } from '@prisma/client';

/**
 * Reservation statuses that count toward a client's loyalty score.
 * Only fully completed reservations are considered.
 */
export const LOYALTY_COMPLETED_STATUSES = ['COMPLETADA', 'FINALIZADA'] as const;

/** 1 loyalty point is awarded per this many currency units spent. */
const POINTS_DIVISOR = 100;

interface LoyaltyTier {
  readonly nivel: string;
  readonly minAmount: number;
}

/**
 * Tiers ordered from highest to lowest.
 * The first tier whose `minAmount` is <= totalSpent is selected.
 */
const LOYALTY_TIERS: LoyaltyTier[] = [
  { nivel: 'PLATINO', minAmount: 10_000 },
  { nivel: 'ORO', minAmount: 5_000 },
  { nivel: 'PLATA', minAmount: 1_000 },
  { nivel: 'BRONCE', minAmount: 0 },
];

export interface LoyaltyInfo {
  /** Sum of total_reserva for completed reservations, as decimal string. */
  total_reservas: string;
  /** Integer points earned (floor(total / POINTS_DIVISOR)). */
  puntos: number;
  /** Tier name: BRONCE | PLATA | ORO | PLATINO */
  nivel_loyalty: string;
}

/**
 * Derives loyalty data from the sum of a client's completed reservations.
 *
 * `toNumber()` is used only for tier comparison and point flooring —
 * monetary precision is kept in `total_reservas` (Decimal → string).
 */
export function computeLoyalty(totalGastado: Prisma.Decimal): LoyaltyInfo {
  const totalNum = totalGastado.toNumber();
  const puntos = Math.floor(totalNum / POINTS_DIVISOR);
  const tier =
    LOYALTY_TIERS.find((t) => totalNum >= t.minAmount) ??
    ({ nivel: 'BRONCE', minAmount: 0 } satisfies LoyaltyTier);

  return {
    total_reservas: totalGastado.toString(),
    puntos,
    nivel_loyalty: tier.nivel,
  };
}
