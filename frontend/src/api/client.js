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

export const fetchConsumption = (meterType, range = 'year', aggregate = 'daily', source = 'demo') =>
  api.get('/api/consumption', {
    params: { meter_type: meterType, range, aggregate, source },
  });

// --- Analytics endpoints ---

export const fetchAnomalies = (meterType, source = 'demo') =>
  api.get('/api/analytics/anomalies', {
    params: { meter_type: meterType, source },
  });

export const fetchCost = (meterType, rate = null, source = 'demo') =>
  api.get('/api/analytics/cost', {
    params: { meter_type: meterType, source, ...(rate !== null && { rate }) },
  });

export const fetchForecast = (meterType, horizon = 30, source = 'demo') =>
  api.get('/api/analytics/forecast', {
    params: { meter_type: meterType, horizon, source },
  });

// --- AI endpoint ---

export const fetchRecommendations = (summary) =>
  api.post('/api/ai/recommendations', summary, { timeout: 90000 });

export const uploadData = (file, jsonData) => {
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/data/user-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  } else {
    return api.post('/api/data/user-upload', jsonData);
  }
};
