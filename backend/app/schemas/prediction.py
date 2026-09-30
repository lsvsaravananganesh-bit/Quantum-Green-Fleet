from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class PredictionRequest(BaseModel):
    vehicle_id: Optional[int] = None
    vehicle_type: str = "car"
    fuel_type: str = "petrol"
    engine_cc: float = 1500.0
    weight_kg: float = 1200.0
    vehicle_age: int = 3
    distance_km: float = 100.0
    avg_speed_kmh: float = 60.0
    idle_time_min: float = 10.0
    road_type: str = "mixed"
    traffic_condition: str = "medium"
    temperature_c: float = 25.0
    payload_kg: float = 0.0
    driving_duration_min: Optional[float] = None


class FeatureImportance(BaseModel):
    feature: str
    importance: float


class PredictionResponse(BaseModel):
    prediction_id: Optional[int] = None
    predicted_fuel_liters: float
    predicted_efficiency_kmpl: float
    predicted_cost_inr: float
    predicted_co2_kg: float
    confidence_lower: float
    confidence_upper: float
    feature_importance: List[FeatureImportance] = []
    model_version: str = "1.0"
    model_name: str = "gradient_boosting"
    distance_km: float
    fuel_type: str


class ModelMetrics(BaseModel):
    model_name: str
    mae: float
    rmse: float
    r2: float
    mape: float
    is_selected: bool = False


class ModelsMetricsResponse(BaseModel):
    models: List[ModelMetrics]
    best_model: str
    training_date: Optional[str] = None
    dataset_size: Optional[int] = None
    test_r2: Optional[float] = None


class OptimizationRequest(BaseModel):
    algorithm: str = "qubo_sa"  # greedy/linear_assignment/simulated_annealing/qubo_sa
    trip_ids: Optional[List[int]] = None
    vehicle_ids: Optional[List[int]] = None
    run_name: str = "Optimization Run"
    objective_weights: Optional[Dict[str, float]] = None


class TripAssignment(BaseModel):
    trip_id: int
    trip_code: str
    origin: str
    destination: str
    distance_km: float
    vehicle_id: int
    registration_number: str
    vehicle_type: str
    predicted_fuel_liters: float
    fuel_cost_inr: float
    co2_emissions_kg: float


class OptimizationResponse(BaseModel):
    run_id: int
    algorithm: str
    run_name: str
    status: str
    total_fuel_liters: float
    total_fuel_cost_inr: float
    total_emissions_kg: float
    objective_value: float
    computation_time_ms: float
    num_trips: int
    num_vehicles: int
    is_feasible: bool
    assignments: List[TripAssignment] = []
    constraint_violations: List[str] = []
    created_at: Optional[datetime] = None
