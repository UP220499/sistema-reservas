/** Returns an error message, or '' if the value is valid (exactly 10 digits). */
export function validatePhone(value: string): string {
    if (!value) return 'El teléfono es requerido';
    if (!/^\d+$/.test(value)) return 'Solo se permiten dígitos';
    if (value.length !== 10) return `Ingresa exactamente 10 dígitos (${value.length}/10)`;
    return '';
}

/**
 * Formats a stored phone string as "+52 XXX XXX XXXX".
 * Handles 10-digit local numbers and 12-digit numbers starting with "52".
 * Falls back to the raw value if it cannot be parsed.
 */
export function formatMxPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    const local =
        digits.length === 12 && digits.startsWith('52') ? digits.slice(2) : digits;
    if (local.length === 10) {
        return `+52 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
    }
    return raw;
}

/** Maps known backend 400 phone error messages to user-friendly Spanish strings. */
export function friendlyPhoneError(raw: string): string {
    if (/telefono.*required|phone.*required/i.test(raw)) return 'El teléfono es requerido';
    if (/telefono.*invalid|phone.*invalid/i.test(raw)) return 'Número de teléfono inválido';
    if (/already.*exist|duplicate/i.test(raw)) return 'Este teléfono ya está registrado';
    return raw;
}
