// TypeScript interfaces for all entities

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'fleet_manager' | 'driver';
  is_active: boolean;
  created_at?: string;
}

export interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_type: 'truck' | 'van' | 'car' | 'bus';
  manufacturer?: string;
  model?: string;
  year?: number;
  fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  engine_cc?: number;
  weight_kg?: number;
  tank_capacity_liters?: number;
  baseline_mileage_kmpl?: number;
  odometer_km?: number;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  assigned_driver_id?: number;
  notes?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Driver {
  id: number;
  employee_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  license_number?: string;
  license_expiry?: string;
  experience_years?: number;
  status: 'active' | 'inactive' | 'on_leave';
  total_trips: number;
  total_distance_km: number;
  avg_fuel_efficiency?: number;
  is_active: boolean;
  created_at?: string;
}

export interface Trip {
  id: number;
  trip_code: string;
  vehicle_id?: number;
  driver_id?: number;
  origin: string;
  destination: string;
  distance_km: number;
  scheduled_departure?: string;
  actual_departure?: string;
  scheduled_arrival?: string;
  actual_arrival?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  expected_fuel_liters?: number;
  actual_fuel_liters?: number;
  fuel_cost_inr?: number;
  co2_emissions_kg?: number;
  traffic_condition?: 'low' | 'medium' | 'high';
  weather_condition?: string;
  payload_kg?: number;
  avg_speed_kmh?: number;
  idle_time_min?: number;
  road_type?: 'highway' | 'urban' | 'mixed';
  notes?: string;
  created_at?: string;
}

export interface FuelRecord {
  id: number;
  vehicle_id: number;
  trip_id?: number;
  date: string;
  liters_filled: number;
  price_per_liter: number;
  total_cost: number;
  odometer_km?: number;
  fuel_type: string;
  created_at?: string;
}

export interface DashboardSummary {
  total_vehicles: number;
  active_vehicles: number;
  available_vehicles: number;
  total_trips: number;
  completed_trips: number;
  active_trips: number;
  avg_fuel_consumption: number;
  total_fuel_consumed: number;
  total_fuel_cost_inr: number;
  avg_efficiency_kmpl: number;
  total_co2_emissions_kg: number;
  optimization_runs: number;
  vehicle_utilization_pct: number;
  active_alerts: number;
}

export interface FuelTrend {
  date: string;
  fuel_liters: number;
  cost_inr: number;
  trips: number;
  co2_kg: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface PredictionResult {
  prediction_id?: number;
  predicted_fuel_liters: number;
  predicted_efficiency_kmpl: number;
  predicted_cost_inr: number;
  predicted_co2_kg: number;
  confidence_lower: number;
  confidence_upper: number;
  feature_importance: FeatureImportance[];
  model_version: string;
  model_name: string;
  distance_km: number;
  fuel_type: string;
}

export interface PredictionRequest {
  vehicle_id?: number;
  vehicle_type: string;
  fuel_type: string;
  engine_cc: number;
  weight_kg: number;
  vehicle_age: number;
  distance_km: number;
  avg_speed_kmh: number;
  idle_time_min: number;
  road_type: string;
  traffic_condition: string;
  temperature_c: number;
  payload_kg: number;
  driving_duration_min?: number;
}

export interface ModelMetrics {
  model_name: string;
  mae: number;
  rmse: number;
  r2: number;
  mape: number;
  is_selected: boolean;
}

export interface TripAssignment {
  trip_id: number;
  trip_code: string;
  origin: string;
  destination: string;
  distance_km: number;
  vehicle_id: number;
  registration_number: string;
  vehicle_type: string;
  predicted_fuel_liters: number;
  fuel_cost_inr: number;
  co2_emissions_kg: number;
}

export interface OptimizationResult {
  run_id: number;
  algorithm: string;
  run_name: string;
  status: string;
  total_fuel_liters: number;
  total_fuel_cost_inr: number;
  total_emissions_kg: number;
  objective_value: number;
  computation_time_ms: number;
  num_trips: number;
  num_vehicles: number;
  is_feasible: boolean;
  assignments: TripAssignment[];
  constraint_violations: string[];
  created_at?: string;
}

export interface OptimizationRun {
  id: number;
  run_name: string;
  algorithm: string;
  status: string;
  total_fuel_cost_inr?: number;
  total_emissions_kg?: number;
  objective_value?: number;
  computation_time_ms?: number;
  num_trips?: number;
  is_feasible?: boolean;
  created_at?: string;
}

export interface Alert {
  id: number;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  vehicle_id?: number;
  trip_id?: number;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AlgorithmComparison {
  algorithm: string;
  total_fuel_cost_inr: number;
  total_emissions_kg: number;
  total_fuel_liters: number;
  objective_value: number;
  computation_time_ms: number;
  is_feasible: boolean;
  trips_assigned: number;
}
