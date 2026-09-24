export type ZoneId = 'A' | 'B' | 'C' | 'D';

export type SlotType = 'standard' | 'ev' | 'faculty' | 'compact';

export interface ParkingSlot {
  id: string; // e.g. "A1"
  zone: ZoneId; // 'A' | 'B' | 'C' | 'D'
  zoneName: string; // "Mall North / Faculty"
  number: number; // 1..5
  isOccupied: boolean;
  type: SlotType;
  plate?: string;
  vehicleColor?: string;
  vehicleModel?: string;
  entryTime?: string; // ISO string
  durationMinutes?: number;
  pixelCount: number; // current detected white pixel count in ROI
  threshold: number; // threshold for occupancy (e.g. 850)
  x: number; // visual coordinate percentage or pixels
  y: number;
  width: number;
  height: number;
  isMaintenance?: boolean;
}

export interface ParkingSession {
  id: string;
  slotId: string;
  zone: ZoneId;
  plate: string;
  vehicleColor: string;
  vehicleModel: string;
  entryTime: string;
  exitTime?: string;
  durationMinutes?: number;
  fee?: number;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface OccupancyStats {
  total: number;
  occupied: number;
  available: number;
  occupancyRate: number; // 0..100
  evOccupied: number;
  evTotal: number;
  averageDwellMinutes: number;
}

export interface HourlyPeakData {
  hour: string;
  vehicles: number;
  occupancyPercent: number;
  peakLabel?: string;
}

export interface ZoneAnalytics {
  zone: ZoneId;
  name: string;
  total: number;
  occupied: number;
  utilizationRate: number;
  type: string;
}

export type ViewTab = 'dashboard' | 'cv-feed' | 'admin' | 'stages' | 'analytics';
