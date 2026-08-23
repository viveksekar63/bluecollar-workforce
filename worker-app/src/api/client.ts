import axios from 'axios';
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

export function setAccessToken(token?: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
