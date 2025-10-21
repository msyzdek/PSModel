/**
 * API Client utilities for making HTTP requests to the backend
 */

// Use proxy route to avoid CORS and cookie issues
const API_BASE_URL = '/api/proxy';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Request options for API calls
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * Base fetch wrapper with error handling and interceptors
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query parameters
  // Strip /api/ prefix from endpoint since proxy already adds it
  const cleanEndpoint = endpoint.startsWith('/api/')
    ? endpoint.substring(4)
    : endpoint;
  let url = `${API_BASE_URL}${cleanEndpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  // Request interceptor - add default headers
  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Include cookies for authentication
    });

    // Response interceptor - handle errors
    if (!response.ok) {
      let errorData: unknown;
      let errorMessage = response.statusText;

      try {
        errorData = await response.json();
        // Extract error message from FastAPI error response
        if (
          errorData &&
          typeof errorData === 'object' &&
          'detail' in errorData
        ) {
          errorMessage =
            typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
        }
      } catch {
        // If response is not JSON, use status text
      }

      throw new ApiError(errorMessage, response.status, errorData);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiError('Network error: Unable to connect to API', 0);
    }

    // Handle other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0,
    );
  }
}

/**
 * HTTP GET request
 */
export async function get<T>(
  endpoint: string,
  options?: RequestOptions,
): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * HTTP POST request
 */
export async function post<T>(
  endpoint: string,
  data?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * HTTP PUT request
 */
export async function put<T>(
  endpoint: string,
  data?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * HTTP DELETE request
 */
export async function del<T>(
  endpoint: string,
  options?: RequestOptions,
): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
}
