export interface Medicine {
  _id: string;
  name: string;
  dosage: string;
  frequency: string;
  scheduleTime: string;
  startDate: string;
  endDate?: string;
  initialStock: number;
  currentStock: number;
  lowStockThreshold: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockStatus = 'normal' | 'low' | 'out_of_stock';

export function getStockStatus(currentStock: number, threshold: number): StockStatus {
  if (currentStock <= 0) return 'out_of_stock';
  if (currentStock <= threshold) return 'low';
  return 'normal';
}

export interface Schedule {
  _id: string;
  medicineId: string | Medicine;
  time: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DoseStatus = 'pending' | 'taken' | 'missed';

export interface DoseRecord {
  _id: string;
  medicineId: string | Medicine;
  scheduleId?: string | Schedule;
  scheduledDate: string;
  scheduledTime: string;
  status: DoseStatus;
  takenAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}
