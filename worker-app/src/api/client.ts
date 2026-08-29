import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

/**
 * Backend is exposed on port 3001 by docker-compose.
 *
 * - Web / iOS simulator: localhost works because the app runs on the host.
 * - Android emulator: 10.0.2.2 maps to the host machine.
 * - Physical device: set EXPO_PUBLIC_API_URL to the LAN address of the backend.
 */
const DEFAULT_API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_HOST = process.env.EXPO_PUBLIC_API_HOST || DEFAULT_API_HOST;
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3001';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${API_HOST}:${API_PORT}/api/v1`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token?: string | null) {
  accessToken = token || null;
  if (accessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function setRefreshToken(token?: string | null) {
  refreshToken = token || null;
}

export function setAuthTokens(tokens: { accessToken?: string | null; refreshToken?: string | null }) {
  setAccessToken(tokens.accessToken);
  setRefreshToken(tokens.refreshToken);
}

export function clearAuthTokens() {
  setAuthTokens({ accessToken: null, refreshToken: null });
}

export function getRefreshToken() {
  return refreshToken;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshToken) return null;

  if (!refreshPromise) {
    const currentRefreshToken = refreshToken;
    refreshPromise = axios
      .post<{ accessToken: string; refreshToken?: string }>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken: currentRefreshToken },
        { timeout: 15000, headers: { 'Content-Type': 'application/json' } },
      )
      .then(({ data }) => {
        setAuthTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || currentRefreshToken,
        });
        return data.accessToken;
      })
      .catch(() => {
        clearAuthTokens();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      !refreshToken
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  },
);
