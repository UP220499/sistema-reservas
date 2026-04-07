/**
 * Centralized location color palette.
 * Each location gets a unique, visually distinct color based on its numeric ID.
 * Used by CalendarPage (event border) and the locations legend.
 */

const LOCATION_PALETTE = [
    '#009688', // Teal
    '#7B1FA2', // Purple
    '#E91E63', // Pink
    '#FF6F00', // Amber Dark
    '#1565C0', // Blue Dark
    '#2E7D32', // Green Dark
    '#F4511E', // Deep Orange
    '#00838F', // Cyan Dark
    '#C62828', // Red Dark
    '#33691E', // Light Green Dark
    '#4527A0', // Indigo
    '#AD1457', // Pink Dark
] as const;

/**
 * Returns a consistent color for a given location ID.
 * Uses the numeric value of the ID modulo the palette length.
 */
export function getLocationColor(ubicacionId: string): string {
    const num = parseInt(ubicacionId, 10);
    if (Number.isNaN(num)) {
        return LOCATION_PALETTE[0];
    }
    return LOCATION_PALETTE[num % LOCATION_PALETTE.length];
}
