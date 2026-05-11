/**
 * Centralized React Query key factory.
 *
 * Usage:
 *   useQuery({ queryKey: qk.reservations.detail(id) })
 *   queryClient.invalidateQueries({ queryKey: qk.reservations.list() })
 *
 * Passing no arguments returns the prefix key used for broad invalidation.
 * Passing arguments returns the exact key used in useQuery hooks.
 */
export const qk = {
    clients: {
        /** Prefix → ['clients'] | Exact → ['clients', filters] */
        list: (filters?: unknown) =>
            filters !== undefined ? (['clients', filters] as const) : (['clients'] as const),
        /** ['client', id] */
        detail: (id: string | undefined) => ['client', id] as const,
        /** ['clients-all'] — unfiltered list used in dropdowns */
        all: () => ['clients-all'] as const,
    },

    reservations: {
        /** Prefix → ['reservations'] | Exact → ['reservations', filters] */
        list: (filters?: unknown) =>
            filters !== undefined
                ? (['reservations', filters] as const)
                : (['reservations'] as const),
        /** ['reservation', id] */
        detail: (id: string | undefined) => ['reservation', id] as const,
        /** ['payments', reservationId] */
        payments: (reservationId: string | undefined) => ['payments', reservationId] as const,
        /** Pending balance reminders */
        reminders: (days?: number) => days !== undefined ? ['reservations-reminders', days] as const : ['reservations-reminders'] as const,
    },

    paymentsGlobal: {
        /** Prefix → ['payments-global'] | Exact → ['payments-global', filters] */
        list: (filters?: unknown) =>
            filters !== undefined ? (['payments-global', filters] as const) : (['payments-global'] as const),
    },

    blocks: {
        /** Prefix → ['blocks'] | Exact → ['blocks', filters] */
        list: (filters?: unknown) =>
            filters !== undefined ? (['blocks', filters] as const) : (['blocks'] as const),
    },

    calendar: {
        /** Prefix → ['calendar'] | Exact → ['calendar', from, to, filter] */
        events: (from?: string, to?: string, filter?: string) =>
            from !== undefined
                ? (['calendar', from, to, filter] as const)
                : (['calendar'] as const),
        /** ['locations-calendar'] */
        locations: () => ['locations-calendar'] as const,
    },

    dashboard: {
        /** ['dashboard-stats'] */
        stats: () => ['dashboard-stats'] as const,
        /** ['dashboard-occupancy'] */
        occupancy: () => ['dashboard-occupancy'] as const,
        /** ['dashboard-revenue'] */
        revenue: () => ['dashboard-revenue'] as const,
        /** ['today-availability'] */
        todayAvailability: () => ['today-availability'] as const,
        /** ['dashboard-reservation-counts'] */
        reservationCounts: () => ['dashboard-reservation-counts'] as const,
    },

    /** ['ubicaciones'] — location catalog used in forms */
    ubicaciones: () => ['ubicaciones'] as const,
} as const;
