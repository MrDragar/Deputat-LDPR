const BASE_URL = 'http://localhost:8000';


export class APIError extends Error {
  constructor(message: string, public status?: number, public data?: any) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Centralized handler for fetch API responses.
 */
const handleApiResponse = async (response: Response) => {
  if (response.ok) {
    if (response.status === 204) { // No Content
      return null;
    }
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  let errorData;
  try {
    errorData = await response.json();
  } catch (e) {
    throw new APIError(response.statusText || 'Network error', response.status);
  }

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
};