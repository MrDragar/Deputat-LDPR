import type { 
    RegistrationForm, 
    User,
    ReportPeriod, 
    Report,
    RegionReport,
    DeputyRecord,
    ReportRecord,
    AdminViewData,
    CoordinatorViewData,
    DeputyViewData,
    DeputyLevel
} from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

const BASE_URL = 'https://депутатлдпр.рф';
const REPORT_API_URL = `${BASE_URL}/api/auth/mouth_reports`;
const FEDERAL_PLAN_URL = `${BASE_URL}/api/federal_plan/days`;

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

const setTokens = (access: string, refresh?: string) => {
  localStorage.setItem('authToken', access);
  if (refresh) {
    localStorage.setItem('refreshToken', refresh);
  }
};

const clearTokens = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

/**
 * A custom error class for API-related errors.
 */
export class APIError extends Error {
  constructor(message: string, public status?: number, public data?: any) {
    super(message);
    this.name = 'APIError';
  }
}

// Функция для обновления токена
const refreshAuthToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.log('No refresh token available');
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.access, data.refresh);
      console.log('Token refreshed successfully');
      return true;
    } else {
      console.log('Token refresh failed:', response.status);
      clearTokens();
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

/**
 * Custom fetch wrapper that handles token refresh on 401.
 */
const customFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let response = await fetch(url, options);

  if (response.status === 401) {
    console.log('Token expired, attempting refresh...');
    const refreshed = await refreshAuthToken();
    if (refreshed) {
      // Retry with new token
      const newHeaders = {
        ...options.headers,
        ...getAuthHeaders()
      };
      response = await fetch(url, { ...options, headers: newHeaders });
    }
  }
  return response;
};

/**
 * Centralized handler for fetch API responses.
 * It checks for response.ok, parses JSON, and throws a standardized APIError on failure.
 * @param response The fetch Response object.
 * @returns The JSON data from the response.
 */
const handleApiResponse = async (response: Response): Promise<any> => {
  if (response.ok) {
    // Handle 204 No Content response
    if (response.status === 204) {
      return null;
    }
    try {
      // Handle cases where response.ok is true but body might not be JSON
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  // If still unauthorized after potential refresh in customFetch
  if (response.status === 401) {
    // The token is invalid or expired.
    // Dispatch a global event that the AuthProvider can listen for to trigger logout.
    window.dispatchEvent(new Event('auth-error'));
  }
  
  let errorData;
  try {
    errorData = await response.json();
  } catch (e) {
    // If parsing JSON fails, create an error from the status text
    throw new APIError(response.statusText || 'Network error', response.status);
  }

  // Use a specific message from the backend if available
  const message = errorData.detail || errorData.message || 'An unknown API error occurred';
  throw new APIError(message, response.status, errorData);
};


export const api = {
  login: async (username: string, password: string): Promise<{ access: string; refresh: string }> => {
    // Login does not use customFetch because 401 here means bad credentials, not expired token
    const response = await fetch(`${BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ login: username, password }),
    });

    const data = await handleApiResponse(response);
    if (data && data.access && data.refresh) {
      setTokens(data.access, data.refresh);
    }
    return data;
  },

  logout: (): void => {
    clearTokens();
  },

  verifyToken: async (): Promise<boolean> => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`${BASE_URL}/api/auth/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });

      return response.ok;
    } catch {
      return false;
    }
  },

  refreshToken: async (): Promise<boolean> => {
    return await refreshAuthToken();
  },

  getForms: async (): Promise<RegistrationForm[]> => {
    const response = await customFetch(`${BASE_URL}/api/auth/registration-forms/`, {
      headers: getAuthHeaders(),
    });
    return await handleApiResponse(response);
  },

  getUsers: async (): Promise<User[]> => {
    const response = await customFetch(`${BASE_URL}/api/auth/users/`, {
      headers: getAuthHeaders(),
    });
    return await handleApiResponse(response);
  },

  getFormById: async (id: string): Promise<RegistrationForm> => {
    const response = await customFetch(`${BASE_URL}/api/auth/registration-forms/${id}/`, {
      headers: getAuthHeaders(),
    });
    return await handleApiResponse(response);
  },
  
  getUserById: async (userId: number): Promise<User> => {
    const response = await customFetch(`${BASE_URL}/api/auth/users/${userId}/`, {
      headers: getAuthHeaders(),
    });
    return await handleApiResponse(response);
  },

  updateAvailability: async (userId: number, isAvailable: boolean, reasonUnavailable: string | null): Promise<User> => {
    const response = await customFetch(`${BASE_URL}/api/auth/users/${userId}/update-availability`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isAvailable, reasonUnavailable }),
    });
    return await handleApiResponse(response);
  },

  processForm: async (id: number, status: boolean, message: string): Promise<any> => {
    const response = await customFetch(`${BASE_URL}/api/auth/process_form/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status,
        message,
        user_id: id,
      }),
    });
    
    return await handleApiResponse(response);
  },

  // 1. Report Periods
  getReportPeriods: async (): Promise<ReportPeriod[]> => {
    const response = await customFetch(`${REPORT_API_URL}/report-periods/`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  },
  getReportPeriodById: async (id: number): Promise<ReportPeriod> => {
    const response = await customFetch(`${REPORT_API_URL}/report-periods/${id}/`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  },
  createReportPeriod: async (data: Omit<ReportPeriod, 'id'>): Promise<ReportPeriod> => {
    const response = await customFetch(`${REPORT_API_URL}/report-periods/`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return handleApiResponse(response);
  },
  updateReportPeriod: async (id: number, data: Omit<ReportPeriod, 'id'>): Promise<ReportPeriod> => {
    const response = await customFetch(`${REPORT_API_URL}/report-periods/${id}/`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return handleApiResponse(response);
  },

  // 2. Reports (Types)
  getReports: async (periodId?: number): Promise<Report[]> => {
    const url = periodId ? `${REPORT_API_URL}/reports/?reportPeriod=${periodId}` : `${REPORT_API_URL}/reports/`;
    const response = await customFetch(url, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  },
  createReport: async (data: Omit<Report, 'id' | 'themeDisplay'>): Promise<Report> => {
    const response = await customFetch(`${REPORT_API_URL}/reports/`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return handleApiResponse(response);
  },
  updateReport: async (id: number, data: Omit<Report, 'id' | 'themeDisplay'>): Promise<Report> => {
    const response = await customFetch(`${REPORT_API_URL}/reports/${id}/`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return handleApiResponse(response);
  },
  deleteReport: async (id: number): Promise<void> => {
    const response = await customFetch(`${REPORT_API_URL}/reports/${id}/`, { method: 'DELETE', headers: getAuthHeaders() });
    return handleApiResponse(response);
  },
  
  // 3. Region Reports
  getRegionReports: async (): Promise<RegionReport[]> => {
    const response = await customFetch(`${REPORT_API_URL}/region-reports/`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  },
  getRegionReportById: async (id: number): Promise<RegionReport> => {
    const response = await customFetch(`${REPORT_API_URL}/region-reports/${id}/`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  },

  // 4. Deputy Records
  getDeputyRecords: async (regionReportId?: number): Promise<DeputyRecord[]> => {
    const url = regionReportId ? `${REPORT_API_URL}/deputy-records/?regionReport=${regionReportId}` : `${REPORT_API_URL}/deputy-records/`;
    const response = await customFetch(url, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  },
  getDeputyRecordById: async (id: number): Promise<DeputyRecord> => {
    const response = await customFetch(`${REPORT_API_URL}/deputy-records/${id}/`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  },
  createDeputyRecord: async (data: { regionReport: number; fio: string; level: DeputyLevel; isAvailable: boolean; reason: string | null; deputy?: number | null }): Promise<DeputyRecord> => {
    const response = await customFetch(`${REPORT_API_URL}/deputy-records/`, { 
        method: 'POST', 
        headers: getAuthHeaders(), 
        body: JSON.stringify(data) 
    });
    return handleApiResponse(response);
  },
  updateDeputyRecord: async (id: number, data: Partial<Omit<DeputyRecord, 'id'>>): Promise<DeputyRecord> => {
    const response = await customFetch(`${REPORT_API_URL}/deputy-records/${id}/`, { 
        method: 'PATCH', 
        headers: getAuthHeaders(), 
        body: JSON.stringify(data) 
    });
    return handleApiResponse(response);
  },
  deleteDeputyRecord: async (id: number): Promise<void> => {
    const response = await customFetch(`${REPORT_API_URL}/deputy-records/${id}/`, { 
        method: 'DELETE', 
        headers: getAuthHeaders() 
    });
    return handleApiResponse(response);
  },
  
  // 5. Report Records (Submissions)
  getReportRecords: async (): Promise<ReportRecord[]> => {
    const response = await customFetch(`${REPORT_API_URL}/report-records/`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  },
  updateReportRecord: async (id: number, data: Omit<ReportRecord, 'id'>): Promise<ReportRecord> => {
    const response = await customFetch(`${REPORT_API_URL}/report-records/${id}/`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return handleApiResponse(response);
  },

  // Helpers
  getAdminViewData: async (): Promise<AdminViewData> => {
    const [periods, reports] = await Promise.all([ api.getReportPeriods(), api.getReports() ]);
    const namedPeriods = periods.map(p => {
        const s = new Date(p.startDate);
        const e = new Date(p.endDate);
        let name = format(s, 'LLLL yyyy', { locale: ru });
        if (s.getMonth() !== e.getMonth()) {
            name = `${format(s, 'LLLL', { locale: ru })}-${format(e, 'LLLL', { locale: ru })} ${format(e, 'yyyy', { locale: ru })}`;
        }
        return {
            ...p,
            name: name.charAt(0).toUpperCase() + name.slice(1)
        }
    }).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return { periods: namedPeriods, reports };
  },

  
    // 6. Federal Plan (Days)
  getFederalPlans: async (skip = 0, limit = 100): Promise<{ items: any[], total: number }> => {
    const response = await customFetch(`${FEDERAL_PLAN_URL}/?skip=${skip}&limit=${limit}`, { headers: getAuthHeaders() });
    return await handleApiResponse(response);
  },
  getFederalPlanById: async (id: number): Promise<any> => {
    const response = await customFetch(`${FEDERAL_PLAN_URL}/${id}`, { headers: getAuthHeaders() });
    return await handleApiResponse(response);
  },
  getFederalPlanByDate: async (date: string): Promise<any> => {
    const response = await customFetch(`${FEDERAL_PLAN_URL}/by-date/${date}`, { headers: getAuthHeaders() });
    return await handleApiResponse(response);
  },
  createFederalPlan: async (data: any): Promise<any> => {
    const response = await customFetch(`${FEDERAL_PLAN_URL}/`, { 
      method: 'POST', 
      headers: getAuthHeaders(), 
      body: JSON.stringify(data) 
    });
    return await handleApiResponse(response);
  },
  updateFederalPlan: async (id: number, data: any): Promise<any> => {
    const response = await customFetch(`${FEDERAL_PLAN_URL}/${id}`, { 
      method: 'PUT', 
      headers: getAuthHeaders(), 
      body: JSON.stringify(data) 
    });
    return await handleApiResponse(response);
  },
  deleteFederalPlan: async (id: number): Promise<void> => {
    const response = await customFetch(`${FEDERAL_PLAN_URL}/${id}`, { 
      method: 'DELETE', 
      headers: getAuthHeaders() 
    });
    return await handleApiResponse(response);
  }
};