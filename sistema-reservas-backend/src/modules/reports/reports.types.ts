export interface TodayAvailabilityItem {
  ubicacion_id: string;
  nombre: string;
  status: 'DISPONIBLE' | 'OCUPADO';
  cliente: string | null;
}

export interface TodayAvailabilityResponse {
  items: TodayAvailabilityItem[];
  total: number;
}

export interface OccupancyDay {
  date: string;
  occupied_units: number;
  total_units: number;
  occupancy_pct: number;
}

export interface RevenueMonth {
  month: string;
  revenue: string;
}
