/**
 * Date range validation helpers.
 *
 * Accepts YYYY-MM-DD or ISO 8601 strings — lexicographic comparison is
 * correct for both formats since they start with the date portion.
 */

/** Returns true when the range is valid: single-sided or from <= to. */
export function isValidDateRange(
    from: string | undefined,
    to: string | undefined,
): boolean {
    if (!from || !to) return true;
    return from <= to;
}

/**
 * Called when the user changes `from`.
 * If the new from exceeds the current to, clears to so the range stays valid.
 */
export function adjustToOnFromChange(
    newFrom: string | undefined,
    currentTo: string | undefined,
): string | undefined {
    if (newFrom && currentTo && newFrom > currentTo) return undefined;
    return currentTo;
}

/**
 * Called when the user changes `to`.
 * If the new to precedes the current from, clears from so the range stays valid.
 */
export function adjustFromOnToChange(
    currentFrom: string | undefined,
    newTo: string | undefined,
): string | undefined {
    if (newTo && currentFrom && currentFrom > newTo) return undefined;
    return currentFrom;
}
