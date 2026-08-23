import axios from 'axios';

// Android emulator: use 10.0.2.2. iOS simulator/web can use localhost.
// For a physical device, replace this with the LAN IP of the backend host.
export const API_BASE_URL = 'http://10.0.2.2:3001/api/v1';

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
