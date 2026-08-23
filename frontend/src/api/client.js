/**
 * API Client — all backend communication goes through here.
 * Base URL is read exclusively from VITE_API_URL environment variable.
 * No hardcoded backend URLs anywhere in the codebase.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// --- Data endpoints ---

export const fetchHealth = () => api.get('/api/health');

export const fetchConsumption = (meterType, range = 'year', aggregate = 'daily') =>
  api.get('/api/consumption', {
    params: { meter_type: meterType, range, aggregate },
  });

// --- Analytics endpoints ---

export const fetchAnomalies = (meterType) =>
  api.get('/api/analytics/anomalies', {
    params: { meter_type: meterType },
  });

export const fetchCost = (meterType, rate = null) =>
  api.get('/api/analytics/cost', {
    params: { meter_type: meterType, ...(rate !== null && { rate }) },
  });

export const fetchForecast = (meterType, horizon = 30) =>
  api.get('/api/analytics/forecast', {
    params: { meter_type: meterType, horizon },
  });

// --- AI endpoint ---

export const fetchRecommendations = (summary) =>
  api.post('/api/ai/recommendations', summary);
