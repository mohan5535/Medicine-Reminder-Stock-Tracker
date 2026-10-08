import type { Medicine, Schedule, DoseRecord, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = (data && data.message) || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network error occurred. Please check server connection.', 0);
  }
}

// ==================== MEDICINES API ====================
export const medicinesApi = {
  getAll: async (): Promise<Medicine[]> => {
    const res = await request<ApiResponse<Medicine[]>>('/medicines');
    return res.data || [];
  },

  getById: async (id: string): Promise<Medicine> => {
    const res = await request<ApiResponse<Medicine>>(`/medicines/${id}`);
    if (!res.data) throw new ApiError('Medicine not found', 404);
    return res.data;
  },

  create: async (data: Partial<Medicine>): Promise<Medicine> => {
    const res = await request<ApiResponse<Medicine>>('/medicines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new ApiError('Failed to create medicine', 500);
    return res.data;
  },

  update: async (id: string, data: Partial<Medicine>): Promise<Medicine> => {
    const res = await request<ApiResponse<Medicine>>(`/medicines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new ApiError('Failed to update medicine', 500);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await request<ApiResponse<void>>(`/medicines/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== SCHEDULES API ====================
export const schedulesApi = {
  getAll: async (medicineId?: string): Promise<Schedule[]> => {
    const query = medicineId ? `?medicineId=${encodeURIComponent(medicineId)}` : '';
    const res = await request<ApiResponse<Schedule[]>>(`/schedules${query}`);
    return res.data || [];
  },

  getById: async (id: string): Promise<Schedule> => {
    const res = await request<ApiResponse<Schedule>>(`/schedules/${id}`);
    if (!res.data) throw new ApiError('Schedule not found', 404);
    return res.data;
  },

  create: async (data: Partial<Schedule>): Promise<Schedule> => {
    const res = await request<ApiResponse<Schedule>>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new ApiError('Failed to create schedule', 500);
    return res.data;
  },

  update: async (id: string, data: Partial<Schedule>): Promise<Schedule> => {
    const res = await request<ApiResponse<Schedule>>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new ApiError('Failed to update schedule', 500);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await request<ApiResponse<void>>(`/schedules/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== DOSES API ====================
export const dosesApi = {
  getAll: async (filters?: { medicineId?: string; status?: string }): Promise<DoseRecord[]> => {
    const params = new URLSearchParams();
    if (filters?.medicineId) params.append('medicineId', filters.medicineId);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await request<ApiResponse<DoseRecord[]>>(`/doses${query}`);
    return res.data || [];
  },

  getToday: async (date?: string): Promise<DoseRecord[]> => {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await request<ApiResponse<DoseRecord[]>>(`/doses/today${query}`);
    return res.data || [];
  },

  getById: async (id: string): Promise<DoseRecord> => {
    const res = await request<ApiResponse<DoseRecord>>(`/doses/${id}`);
    if (!res.data) throw new ApiError('Dose record not found', 404);
    return res.data;
  },

  create: async (data: Partial<DoseRecord>): Promise<DoseRecord> => {
    const res = await request<ApiResponse<DoseRecord>>('/doses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new ApiError('Failed to create dose record', 500);
    return res.data;
  },

  update: async (id: string, data: Partial<DoseRecord>): Promise<DoseRecord> => {
    const res = await request<ApiResponse<DoseRecord>>(`/doses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.data) throw new ApiError('Failed to update dose record', 500);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await request<ApiResponse<void>>(`/doses/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Marks a dose as 'taken'.
   * Ensures stock is reduced ONLY ONCE and NEVER below zero.
   */
  markTaken: async (dose: DoseRecord): Promise<{ dose: DoseRecord; updatedStock?: number }> => {
    // Update the dose status to 'taken' via API; backend handles atomic stock reduction
    const updatedDose = await dosesApi.update(dose._id, {
      status: 'taken',
      takenAt: new Date().toISOString(),
    });

    const med = typeof updatedDose.medicineId === 'object' ? updatedDose.medicineId : null;
    return {
      dose: updatedDose,
      updatedStock: med ? med.currentStock : undefined,
    };
  },

  /**
   * Marks a dose as 'missed'.
   */
  markMissed: async (doseId: string): Promise<DoseRecord> => {
    return await dosesApi.update(doseId, {
      status: 'missed',
    });
  },
};
