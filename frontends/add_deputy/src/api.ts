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
} from './types';

export const BASE_URL = 'https://депутатлдпр.рф';
const REPORT_API_URL = `${BASE_URL}/api/auth/mouth_reports`;
const FEDERAL_PLAN_URL = `${BASE_URL}/api/federal_plan/days`;

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

export const setTokens = (access: string, refresh?: string) => {
  localStorage.setItem('authToken', access);
  if (refresh) {
    localStorage.setItem('refreshToken', refresh);
  }
};

export const clearTokens = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
};

export const getAuthHeaders = () => {
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
export const refreshAuthToken = async (): Promise<boolean> => {
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
export const fetchWithAuth = async (url: string, options: RequestInit = {}, retryCount = 0): Promise<any> => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.ok) {
    if (response.status === 204) return null;
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  if (response.status === 401 && retryCount === 0) {
    console.log('Token expired, attempting refresh...');
    const refreshed = await refreshAuthToken();
    
    if (refreshed) {
      // Recreate the request with new token
      const newHeaders = {
        ...getAuthHeaders(),
        ...options.headers,
      };
      return fetchWithAuth(url, { ...options, headers: newHeaders }, retryCount + 1);
    }
  }

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth-error'));
  }
  
  let errorData;
  try {
    errorData = await response.json();
  } catch (e) {
    throw new APIError(response.statusText || 'Network error', response.status);
  }

  const message = errorData.error || errorData.detail || errorData.message || 'An unknown API error occurred';
  throw new APIError(message, response.status, errorData);
};


export const api = {
  login: async (username: string, password: string): Promise<{ access: string; refresh: string }> => {
    const data = await fetchWithAuth(`${BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ login: username, password }),
    });

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
    return await fetchWithAuth(`${BASE_URL}/api/auth/registration-forms/`);
  },

  getUsers: async (): Promise<User[]> => {
    return await fetchWithAuth(`${BASE_URL}/api/auth/users/`);
  },

  getFormById: async (id: string): Promise<RegistrationForm> => {
    return await fetchWithAuth(`${BASE_URL}/api/auth/registration-forms/${id}/`);
  },
  
  getUserById: async (userId: number): Promise<User> => {
    return await fetchWithAuth(`${BASE_URL}/api/auth/users/${userId}/`);
  },

  processForm: async (id: number, status: boolean, message: string): Promise<any> => {
    return await fetchWithAuth(`${BASE_URL}/api/auth/process_form/?userId=${id}&user_id=${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        message,
        userId: id,
        user_id: id,
      }),
    });
  }
};
