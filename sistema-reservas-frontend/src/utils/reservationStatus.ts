/**
 * Centralized reservation status helpers.
 * Single source of truth for labels, MUI chip colors, calendar hex colors,
 * and valid state transitions.
 */

/** Hex colors used by CalendarPage for status-based event chip backgrounds. */
export const CALENDAR_STATUS_COLORS = {
    PENDIENTE: '#ff9800',
    CANCELADA: '#ef5350',
    COMPLETADA: '#42a5f5',
} as const;

/** Maps a status code to its Spanish display label. */
export function statusLabel(code: string): string {
    switch (code) {
        case 'PENDIENTE': return 'Pendiente';
        case 'CONFIRMADA': return 'Confirmada';
        case 'EN_CURSO': return 'En Curso';
        case 'CANCELADA': return 'Cancelada';
        case 'COMPLETADA': return 'Completada';
        case 'FINALIZADA': return 'Finalizada';
        case 'NO_SHOW': return 'No Show';
        default: return code;
    }
}

/** Maps a status code to the MUI Chip color prop. */
export function statusChipColor(
    code: string,
): 'warning' | 'success' | 'error' | 'info' | 'default' {
    switch (code) {
        case 'PENDIENTE': return 'warning';
        case 'CONFIRMADA': return 'success';
        case 'EN_CURSO': return 'success';
        case 'CANCELADA': return 'error';
        case 'NO_SHOW': return 'error';
        case 'COMPLETADA': return 'info';
        case 'FINALIZADA': return 'info';
        default: return 'default';
    }
}

/**
 * Maps a status code to a hex color for calendar rendering.
 * Returns `defaultColor` for CONFIRMADA (uses the primary color supplied by caller).
 */
export function statusHexColor(code: string, defaultColor: string): string {
    switch (code) {
        case 'PENDIENTE': return CALENDAR_STATUS_COLORS.PENDIENTE;
        case 'CANCELADA': return CALENDAR_STATUS_COLORS.CANCELADA;
        case 'COMPLETADA': return CALENDAR_STATUS_COLORS.COMPLETADA;
        default: return defaultColor;
    }
}

/**
 * Returns the valid next statuses from the current one.
 * CANCELADA and COMPLETADA are terminal — no transitions allowed.
 */
export function allowedStatusTransitions(code: string): string[] {
    switch (code) {
        case 'PENDIENTE': return ['CONFIRMADA', 'CANCELADA'];
        case 'CONFIRMADA': return ['COMPLETADA', 'CANCELADA'];
        default: return [];
    }
}

/** True when payments can be registered (non-terminal active reservation). */
export function canPay(code: string): boolean {
    return code === 'PENDIENTE' || code === 'CONFIRMADA' || code === 'EN_CURSO';
}
