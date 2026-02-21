import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  getStats() {
    return {
      checkins: 0,
      checkouts: 0,
      activeReservations: 0,
      monthlyRevenue: 0,
    };
  }

  getAvailabilityToday() {
    return {
      items: [],
      total: 0,
    };
  }

  getOccupancy() {
    return [];
  }

  getRevenue() {
    return [];
  }
}
