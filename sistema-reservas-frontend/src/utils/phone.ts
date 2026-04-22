/** Validates the local part of a phone number (digits only, 4–15 chars). */
export function validatePhone(value: string): string {
    if (!value) return 'El teléfono es requerido';
    if (!/^\d+$/.test(value)) return 'Solo se permiten dígitos';
    if (value.length < 4) return 'Número demasiado corto';
    if (value.length > 15) return 'Número demasiado largo';
    return '';
}

/**
 * Formats a stored phone string for display.
 * Handles E.164 format (+521234567890) and legacy 10-digit MX numbers.
 */
export function formatPhone(raw: string): string {
    if (!raw) return raw;
    if (raw.startsWith('+')) return raw;
    // Legacy: bare 10-digit number → assume Mexico
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) {
        return `+52 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return raw;
}

/** Legacy alias kept for components that haven't been updated yet. */
export const formatMxPhone = formatPhone;

/** Maps known backend 400 phone error messages to user-friendly Spanish strings. */
export function friendlyPhoneError(raw: string): string {
    if (/telefono.*required|phone.*required/i.test(raw)) return 'El teléfono es requerido';
    if (/telefono.*invalid|phone.*invalid|internacional/i.test(raw)) return 'Número de teléfono inválido';
    if (/already.*exist|duplicate/i.test(raw)) return 'Este teléfono ya está registrado';
    return raw;
}
