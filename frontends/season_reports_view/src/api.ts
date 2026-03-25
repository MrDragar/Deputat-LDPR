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
  LDPRReport
} from './types';
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
 * Centralized handler for fetch API responses.
 *
 * It checks for response.ok, parses JSON, and throws a standardized APIError on failure.
 *
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
      if (!text) return null;
      return JSON.parse(text);
    } catch (e) {
      console.warn('Failed to parse JSON response:', e);
      return null;
    }
  }

  // If unauthorized
  if (response.status === 401) {
    // The token is invalid or expired.
    // Dispatch a global event that the AuthProvider can listen for to trigger logout.
    window.dispatchEvent(new Event('auth-error'));
  }

  let errorData;
  try {
    const text = await response.text();
    errorData = text ? JSON.parse(text) : {};
  } catch (e) {
    // If parsing JSON fails, create an error from the status text
    throw new APIError(response.statusText || 'Network error', response.status);
  }

  // Use a specific message from the backend if available
  const message = errorData.detail || errorData.message || 'An unknown API error occurred';
  throw new APIError(message, response.status, errorData);
};

/**
 * Wrapper for fetch that automatically adds auth headers and handles token refresh.
 */
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let headers = { ...getAuthHeaders(), ...options.headers };
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    console.log('Token expired, attempting refresh...');
    const refreshed = await refreshAuthToken();
    if (refreshed) {
      // Retry with new token
      headers = { ...getAuthHeaders(), ...options.headers };
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
};

export const login = async (username: string, password: string): Promise<{ access: string; refresh: string }> => {
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
};

export const logout = (): void => {
  clearTokens();
};

export const verifyToken = async (): Promise<boolean> => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/auth/verify/`, {
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
};

export const refreshToken = async (): Promise<boolean> => {
  return await refreshAuthToken();
};

export const getForms = async (): Promise<RegistrationForm[]> => {
  const response = await fetchWithAuth(`${BASE_URL}/api/auth/registration-forms/`, {
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

export const getUsers = async (): Promise<User[]> => {
  const response = await fetchWithAuth(`${BASE_URL}/api/auth/users/`, {
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

export const getFormById = async (id: string): Promise<RegistrationForm> => {
  const response = await fetchWithAuth(`${BASE_URL}/api/auth/registration-forms/${id}/`, {
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

export const getUserById = async (userId: string): Promise<User> => {
  const response = await fetchWithAuth(`${BASE_URL}/api/auth/users/${userId}/`, {
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

// Admin Reports API
export const getAllReports = async (): Promise<Report[]> => {
  const response = await fetchWithAuth(`${BASE_URL}/api/reports/all`, {
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

export const getReportById = async (id: string): Promise<Report> => {
  const response = await fetchWithAuth(`${BASE_URL}/api/reports/${id}`, {
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

export const updateReport = async (id: string, data: { data: any }): Promise<Report> => {
  const response = await fetchWithAuth(`${BASE_URL}/api/reports/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return await handleApiResponse(response);
};

export const deleteReport = async (id: string): Promise<{ status: string; message: string }> => {
  const response = await fetchWithAuth(`${BASE_URL}/api/reports/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

