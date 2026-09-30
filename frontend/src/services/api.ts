import axios from 'axios';
import type {
  User, Vehicle, Driver, Trip, DashboardSummary, FuelTrend,
  PredictionRequest, PredictionResult, ModelMetrics, OptimizationResult,
  OptimizationRun, Alert, PaginatedResponse, AlgorithmComparison
} from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (data: { email: string; password: string; full_name: string; role: string }) =>
    api.post('/api/auth/register', data),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get<User>('/api/auth/me'),
};

// ---- Dashboard ----
export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>('/api/dashboard/summary'),
  getFuelTrends: (days = 30) => api.get(`/api/dashboard/fuel-trends?days=${days}`),
  getEmissions: () => api.get('/api/dashboard/emissions'),
  getFleetPerformance: () => api.get('/api/dashboard/fleet-performance'),
};

// ---- Vehicles ----
export const vehiclesApi = {
  getVehicles: (params?: Record<string, any>) =>
    api.get<PaginatedResponse<Vehicle>>('/api/vehicles', { params }),
  getVehicle: (id: number) => api.get<Vehicle>(`/api/vehicles/${id}`),
  createVehicle: (data: Partial<Vehicle>) => api.post<Vehicle>('/api/vehicles', data),
  updateVehicle: (id: number, data: Partial<Vehicle>) => api.put<Vehicle>(`/api/vehicles/${id}`, data),
  deleteVehicle: (id: number) => api.delete(`/api/vehicles/${id}`),
};

// ---- Drivers ----
export const driversApi = {
  getDrivers: (params?: Record<string, any>) =>
    api.get<PaginatedResponse<Driver>>('/api/drivers', { params }),
  getDriver: (id: number) => api.get<Driver>(`/api/drivers/${id}`),
  createDriver: (data: Partial<Driver>) => api.post<Driver>('/api/drivers', data),
  updateDriver: (id: number, data: Partial<Driver>) => api.put<Driver>(`/api/drivers/${id}`, data),
  deleteDriver: (id: number) => api.delete(`/api/drivers/${id}`),
};

// ---- Trips ----
export const tripsApi = {
  getTrips: (params?: Record<string, any>) =>
    api.get<PaginatedResponse<Trip>>('/api/trips', { params }),
  getTrip: (id: number) => api.get<Trip>(`/api/trips/${id}`),
  createTrip: (data: Partial<Trip>) => api.post<Trip>('/api/trips', data),
  updateTrip: (id: number, data: Partial<Trip>) => api.put<Trip>(`/api/trips/${id}`, data),
  deleteTrip: (id: number) => api.delete(`/api/trips/${id}`),
};

// ---- Prediction ----
export const predictionApi = {
  predictFuel: (data: PredictionRequest) =>
    api.post<PredictionResult>('/api/predict/fuel', data),
  batchPredict: (data: PredictionRequest[]) =>
    api.post('/api/predict/batch', data),
  getHistory: (params?: Record<string, any>) =>
    api.get('/api/predict/history', { params }),
  getModelMetrics: () =>
    api.get<{ models: ModelMetrics[]; best_model: string; training_date?: string; dataset_size?: number; test_r2?: number }>('/api/models/metrics'),
};

// ---- Optimization ----
export const optimizationApi = {
  runOptimization: (data: {
    algorithm: string;
    trip_ids?: number[];
    vehicle_ids?: number[];
    run_name: string;
    objective_weights?: Record<string, number>;
  }) => api.post<OptimizationResult>('/api/optimization/run', data),
  getRuns: (params?: Record<string, any>) =>
    api.get<PaginatedResponse<OptimizationRun>>('/api/optimization/runs', { params }),
  getRun: (id: number) => api.get(`/api/optimization/runs/${id}`),
  compareAlgorithms: (data: { trip_ids?: number[]; vehicle_ids?: number[] }) =>
    api.post<{ comparison: AlgorithmComparison[]; num_trips: number; num_vehicles: number }>(
      '/api/optimization/compare', data
    ),
  getScenarios: () => api.get('/api/optimization/scenarios'),
};

// ---- Alerts ----
export const alertsApi = {
  getAlerts: (params?: Record<string, any>) =>
    api.get<PaginatedResponse<Alert>>('/api/alerts', { params }),
  markRead: (id: number) => api.put(`/api/alerts/${id}/read`),
  resolveAlert: (id: number) => api.put(`/api/alerts/${id}/resolve`),
};

// ---- VRP Multi-Stop Routing ----
export const vrpApi = {
  getDemoData: () => api.get('/api/vrp/demo-data'),
  solveVRP: (data: {
    algorithm?: string;
    depot?: any;
    stops?: any[];
    vehicles?: any[];
  }) => api.post('/api/vrp/solve', data),
};

// ---- Research Lab & Advanced Optimization ----
export const researchApi = {
  getParetoFront: (num_samples = 24) =>
    api.post('/api/research/pareto', { num_samples }),
  runBenchmark: (num_seeds = 5) =>
    api.post('/api/research/benchmark', { num_seeds }),
  inspectQubo: (data: {
    lambda1?: number;
    lambda2?: number;
    lambda3?: number;
    alpha?: number;
    beta?: number;
    candidate_bitstring?: string;
  }) => api.post('/api/research/qubo-inspect', data),
  runSensitivity: (num_scenarios = 300, seed = 42) =>
    api.post('/api/research/sensitivity', { num_scenarios, seed }),
  runExperiment: (title: string, num_seeds = 5) =>
    api.post('/api/research/experiment-run', { title, num_seeds }),
};

// ---- Digital Twin & Simulation ----
export const digitalTwinApi = {
  simulate: (data: {
    horizon_days?: number;
    weather_condition?: string;
    demand_surge_pct?: number;
    random_seed?: number;
  }) => api.post('/api/digital-twin/simulate', data),
};

// ---- Predictive Maintenance ----
export const maintenanceApi = {
  getOverview: () => api.get('/api/maintenance/overview'),
  getVehicleDetail: (id: number) => api.get(`/api/maintenance/vehicle/${id}`),
};

// ---- EV & Hybrid Fleet ----
export const evApi = {
  getFleetReport: (params?: { ambient_temp_c?: number; grid_emission_factor_g_kwh?: number }) =>
    api.get('/api/ev/fleet-report', { params }),
  calculateChargeSchedule: (data: any) =>
    api.post('/api/ev/charge-schedule', data),
};

// ---- Adaptive ML & Drift Monitoring ----
export const mlDriftApi = {
  getReport: () => api.get('/api/ml-drift/report'),
  promoteModel: (version_id: string) =>
    api.post('/api/ml-drift/promote', { version_id }),
  rollbackModel: () => api.post('/api/ml-drift/rollback'),
};

// ---- Fleet Intelligence & Multi-Depot ----
export const intelligenceApi = {
  getOverview: () => api.get('/api/intelligence/overview'),
};

export default api;
