'use client';

/**
 * Authenticated Fetch Hook
 * Wraps fetch with Privy access token for secure API calls
 */

import { useCallback } from 'react';
import { useAuth } from './useAuth';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

export function useAuthenticatedFetch() {
  const { getAccessToken, isAuthenticated, network } = useAuth();

  /**
   * Make an authenticated API call
   */
  const authFetch = useCallback(async <T = unknown>(
    url: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> => {
    const { skipAuth = false, headers = {}, ...rest } = options;

    try {
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers as Record<string, string>,
      };

      // Add auth token if authenticated and not skipped
      if (!skipAuth && isAuthenticated) {
        const token = await getAccessToken();
        if (token) {
          requestHeaders['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(url, {
        ...rest,
        headers: requestHeaders,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data.error || data.message || 'Request failed',
          status: response.status,
        };
      }

      return {
        data: data as T,
        error: null,
        status: response.status,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }, [getAccessToken, isAuthenticated]);

  /**
   * GET request with auth
   */
  const get = useCallback(<T = unknown>(url: string, options?: FetchOptions) => {
    return authFetch<T>(url, { ...options, method: 'GET' });
  }, [authFetch]);

  /**
   * POST request with auth
   */
  const post = useCallback(<T = unknown>(url: string, body: unknown, options?: FetchOptions) => {
    return authFetch<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }, [authFetch]);

  /**
   * PATCH request with auth
   */
  const patch = useCallback(<T = unknown>(url: string, body: unknown, options?: FetchOptions) => {
    return authFetch<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }, [authFetch]);

  /**
   * DELETE request with auth
   */
  const del = useCallback(<T = unknown>(url: string, options?: FetchOptions) => {
    return authFetch<T>(url, { ...options, method: 'DELETE' });
  }, [authFetch]);

  return {
    authFetch,
    get,
    post,
    patch,
    delete: del,
    network,
    isAuthenticated,
  };
}

export default useAuthenticatedFetch;
