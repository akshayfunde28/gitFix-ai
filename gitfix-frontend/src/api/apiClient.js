/**
 * Custom API Client & HTTP Wrapper for GitFix AI
 * Handles timeouts, header injection, unified error parsing, and JSON normalization.
 */
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../constants/apiEndpoints';

export class ApiError extends Error {
  constructor(message, status = 500, details = null, validationErrors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.validationErrors = validationErrors;
  }
}

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Internal request handler with timeout and error mapping
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body = null,
      timeout = REQUEST_TIMEOUT_MS,
      params = null,
    } = options;

    let url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          queryParams.append(key, val);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const defaultHeaders = {
      'Accept': 'application/json',
      ...headers,
    };

    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const fetchConfig = {
      method,
      headers: defaultHeaders,
      signal: controller.signal,
    };

    if (body) {
      fetchConfig.body = typeof body === 'object' && !(body instanceof FormData) 
        ? JSON.stringify(body) 
        : body;
    }

    try {
      const response = await fetch(url, fetchConfig);
      clearTimeout(timeoutId);

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      // Check if response has content
      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        let errorMessage = 'An unexpected server error occurred';
        let validationErrors = null;

        if (data && typeof data === 'object') {
          errorMessage = data.message || data.error || `HTTP Error ${response.status}`;
          validationErrors = data.validationErrors || null;
        } else if (typeof data === 'string' && data.trim()) {
          errorMessage = data;
        }

        throw new ApiError(errorMessage, response.status, data, validationErrors);
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new ApiError(`Request timeout after ${timeout / 1000}s. Backend might be busy.`, 408);
      }

      if (err instanceof ApiError) {
        throw err;
      }

      // Network unreachable or CORS rejection
      throw new ApiError(
        err.message || 'Network connection failed. Verify Spring Boot backend is running on port 8080.',
        0,
        err
      );
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
