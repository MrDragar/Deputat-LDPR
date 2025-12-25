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
    DeputyViewData
} from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

const BASE_URL = 'https://депутатлдпр.рф';
const REPORT_API_URL = `${BASE_URL}/api/auth/mouth_reports`;

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
 * Centralized handler for fetch API responses.
 * It checks for response.ok, parses JSON, and throws a standardized APIError on failure.
 * @param response The fetch Response object.
 * @returns The JSON data from the response.
 */
const handleApiResponse = async (response: Response, retryCount = 0): Promise<any> => {
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
  // Handle error responses, including expired tokens (401)
  if (response.status === 401 && retryCount === 0) {
    console.log('Token expired, attempting refresh...');
    const refreshed = await refreshAuthToken();
    
    if (refreshed) {
      // Retry the original request with new token
      const originalUrl = response.url;
      const originalOptions = await response.clone().json().catch(() => ({}));
      const method = response.method;

      // Recreate the request with new token
      const newHeaders = getAuthHeaders();
      // Prepare request options based on method
      const requestOptions: RequestInit = {
        method: method,
        headers: newHeaders,
      };
      
      // Only add body for non-GET/HEAD requests
      if (method !== 'GET' && method !== 'HEAD' && originalOptions.body) {
        requestOptions.body = JSON.stringify(originalOptions);
      }
      
      const retryResponse = await fetch(originalUrl, requestOptions);
      
      return handleApiResponse(retryResponse, retryCount + 1);
    }
  }

  // If still unauthorized after refresh or other error
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
    const response = await fetch(`${BASE_URL}/api/auth/registration-forms/`, {
      headers: getAuthHeaders(),
    });
    return await handleApiResponse(response);
  },

  getUsers: async (): Promise<User[]> => {
    const response = await fetch(`${BASE_URL}/api/auth/users/`, {
      headers: getAuthHeaders(),
    });
    return await handleApiResponse(response);
  },

  getFormById: async (id: string): Promise<RegistrationForm> => {
    const response = await fetch(`${BASE_URL}/api/auth/registration-forms/${id}/`, {
      headers: getAuthHeaders(),
    });
    return await handleApiResponse(response);
  },
  
  getUserById: async (userId: number): Promise<User> => {
    const response = await fetch(`${BASE_URL}/api/auth/users/${userId}/`, {
      headers: getAuthHeaders(),
    });
    return await handleApiResponse(response);
  },

  processForm: async (id: number, status: boolean, message: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/auth/process_form/`, {
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

  // --- Reporting API (Real) ---
  
  // 1. Report Periods
  getReportPeriods: async (): Promise<ReportPeriod[]> => {
    const response = await fetch(`${REPORT_API_URL}/report-periods/`, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  },
  createReportPeriod: async (data: Omit<ReportPeriod, 'id'>): Promise<ReportPeriod> => {
    const response = await fetch(`${REPORT_API_URL}/report-periods/`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return handleApiResponse(response);
  },
  updateReportPeriod: async (id: number, data: Omit<ReportPeriod, 'id'>): Promise<ReportPeriod> => {
    const response = await fetch(`${REPORT_API_URL}/report-periods/${id}/`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return handleApiResponse(response);
  },
  deleteReportPeriod: async (id: number): Promise<void> => {
    const response = await fetch(`${REPORT_API_URL}/report-periods/${id}/`, { method: 'DELETE', headers: getAuthHeaders() });
    return handleApiResponse(response);
  },

  // 2. Reports (Types)
  getReports: async (periodId?: number): Promise<Report[]> => {
    const url = periodId ? `${REPORT_API_URL}/reports/?reportPeriod=${periodId}` : `${REPORT_API_URL}/reports/`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  },
  createReport: async (data: Omit<Report, 'id' | 'themeDisplay'>): Promise<Report> => {
    const response = await fetch(`${REPORT_API_URL}/reports/`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return handleApiResponse(response);
  },
  updateReport: async (id: number, data: Omit<Report, 'id' | 'themeDisplay'>): Promise<Report> => {
    const response = await fetch(`${REPORT_API_URL}/reports/${id}/`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return handleApiResponse(response);
  },
  deleteReport: async (id: number): Promise<void> => {
    const response = await fetch(`${REPORT_API_URL}/reports/${id}/`, { method: 'DELETE', headers: getAuthHeaders() });
    return handleApiResponse(response);
  },
  
  // 3. Region Reports
  getRegionReports: async (): Promise<RegionReport[]> => {
    const response = await fetch(`${REPORT_API_URL}/region-reports/`, { headers: getAuthHeaders() });
    // Assuming backend filters by user's region for coordinator or returns all for others
    return handleApiResponse(response);
  },

  // 4. Deputy Records
  getDeputyRecords: async (regionReportId?: number): Promise<DeputyRecord[]> => {
    const url = regionReportId ? `${REPORT_API_URL}/deputy-records/?regionReport=${regionReportId}` : `${REPORT_API_URL}/deputy-records/`;
    // Assuming backend filters by user for deputy role, or by region for coordinator role
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleApiResponse(response);
  },
  
  // 5. Report Records (Submissions)
  getReportRecords: async (): Promise<ReportRecord[]> => {
    const response = await fetch(`${REPORT_API_URL}/report-records/`, { headers: getAuthHeaders() });
    // Assuming backend filters by user/region
    return handleApiResponse(response);
  },
  createReportRecord: async (data: Omit<ReportRecord, 'id'>): Promise<ReportRecord> => {
    const response = await fetch(`${REPORT_API_URL}/report-records/`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return handleApiResponse(response);
  },
  updateReportRecord: async (id: number, data: Omit<ReportRecord, 'id'>): Promise<ReportRecord> => {
    const response = await fetch(`${REPORT_API_URL}/report-records/${id}/`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return handleApiResponse(response);
  },
  deleteReportRecord: async (id: number): Promise<void> => {
    const response = await fetch(`${REPORT_API_URL}/report-records/${id}/`, { method: 'DELETE', headers: getAuthHeaders() });
    return handleApiResponse(response);
  },


  // --- Composite API functions for Views ---
  
  getAdminViewData: async (): Promise<AdminViewData> => {
    const [periods, reports] = await Promise.all([
      api.getReportPeriods(),
      api.getReports()
    ]);
    
    // Generate name for periods on frontend
    const namedPeriods = periods.map(p => ({
        ...p,
        name: `${format(new Date(p.startDate), 'LLLL yyyy', { locale: ru })}`
    })).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    return { periods: namedPeriods, reports };
  },
  
  getCoordinatorViewData: async (userId: number): Promise<CoordinatorViewData> => {
    const periods = await api.getReportPeriods();
    const latestPeriod = periods.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
    if (!latestPeriod) throw new APIError("Нет активных периодов.", 404);

    const regionReports = await api.getRegionReports();
    const currentRegionReport = regionReports.find(rr => rr.reportPeriod === latestPeriod.id);

    const [reports, deputyRecords, reportRecords] = await Promise.all([
        api.getReports(latestPeriod.id),
        currentRegionReport ? api.getDeputyRecords(currentRegionReport.id) : Promise.resolve([] as DeputyRecord[]),
        api.getReportRecords()
    ]);

    return {
        period: {
            ...latestPeriod,
            name: `${format(new Date(latestPeriod.startDate), 'LLLL yyyy', { locale: ru })}`
        },
        reports,
        deputyRecords,
        reportRecords
    };
  },
  
  getDeputyViewData: async (userId: number): Promise<DeputyViewData> => {
     const periodsPromise = api.getReportPeriods();
     const deputyRecordsPromise = api.getDeputyRecords();
     const regionReportsPromise = api.getRegionReports();
     const reportRecordsPromise = api.getReportRecords();

     const [periods, allDeputyRecords, allRegionReports, reportRecords] = await Promise.all([
         periodsPromise,
         deputyRecordsPromise,
         regionReportsPromise,
         reportRecordsPromise,
     ]);

     const latestPeriod = periods.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
     if (!latestPeriod) throw new APIError("Нет активных периодов.", 404);
     
     const regionReportIdsForPeriod = new Set(
         allRegionReports
             .filter(rr => rr.reportPeriod === latestPeriod.id)
             .map(rr => rr.id)
     );
     
     const userDeputyRecordForPeriod = allDeputyRecords.find(dr => 
        dr.deputy === userId && regionReportIdsForPeriod.has(dr.regionReport)
     ) || null;

     const reports = await api.getReports(latestPeriod.id);
     
     return {
        period: {
            ...latestPeriod,
            name: `${format(new Date(latestPeriod.startDate), 'LLLL yyyy', { locale: ru })}`
        },
        reports,
        deputyRecord: userDeputyRecordForPeriod,
        reportRecords
     }
  }
};