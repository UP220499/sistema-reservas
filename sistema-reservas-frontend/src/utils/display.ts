/** Never shows "undefined", "null", NaN, or empty string — returns "—" instead. */
export function displayValue(v: string | number | null | undefined): string {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'number' && isNaN(v)) return '—';
    const s = String(v).trim();
    if (s === '' || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') return '—';
    return s;
}

/** Formats a nullable numeric/string value as "$X,XXX" or "—". */
export function displayCurrency(v: string | number | null | undefined): string {
    if (v === null || v === undefined) return '—';
    const n = Number(v);
    if (isNaN(n)) return '—';
    return '$' + n.toLocaleString();
}
