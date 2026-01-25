import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// VULNERABILITY: Exposing API key in frontend code
export const API_CONFIG = {
  stripe: 'pk_test_123456789_EXPOSED_IN_FRONTEND',
  googleMaps: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
};

export default api;
