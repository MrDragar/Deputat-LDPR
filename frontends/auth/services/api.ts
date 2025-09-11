import { RegistrationForm } from '../types';

// This is now configured via environment variables.
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
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

/**
 * Centralized handler for fetch API responses.
 * It checks for response.ok, parses JSON, and throws a standardized APIError on failure.
 * @param response The fetch Response object.
 * @returns The JSON data from the response.
 */
const handleApiResponse = async (response: Response) => {
  if (response.ok) {
    // Handle 204 No Content response
    if (response.status === 204) {
      return null;
    }
    try {
      // Handle cases where response.ok is true but body might not be JSON
      return await response.json();
    } catch {
      return null;
    }
  }

  // Handle error responses
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
  login: async (username: string, password: string): Promise<{ access: string }> => {
    const response = await fetch(`${BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ login: username, password }),
    });

    const data = await handleApiResponse(response);
    if (data && data.access) {
      localStorage.setItem('authToken', data.access);
    }
    return data;
  },

  logout: (): void => {
    localStorage.removeItem('authToken');
  },

  getForms: async (): Promise<RegistrationForm[]> => {
    const response = await fetch(`${BASE_URL}/api/registration-forms/`, {
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  getFormById: async (id: string): Promise<RegistrationForm> => {
    const response = await fetch(`${BASE_URL}/api/registration-forms/${id}/`, {
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  processForm: async (id: number, status: boolean, message: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/process_form/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status,
        message,
        user_id: id,
      }),
    });
    
    return handleApiResponse(response);
  },
};