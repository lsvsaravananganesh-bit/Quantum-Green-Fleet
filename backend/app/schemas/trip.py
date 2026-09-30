from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TripBase(BaseModel):
    origin: str
    destination: str
    distance_km: float
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    scheduled_departure: Optional[datetime] = None
    scheduled_arrival: Optional[datetime] = None
    status: Optional[str] = "planned"
    traffic_condition: Optional[str] = "medium"
    weather_condition: Optional[str] = "clear"
    payload_kg: Optional[float] = 0.0
    avg_speed_kmh: Optional[float] = 60.0
    idle_time_min: Optional[float] = 0.0
    road_type: Optional[str] = "mixed"
    notes: Optional[str] = None


class TripCreate(TripBase):
    trip_code: Optional[str] = None


class TripUpdate(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    distance_km: Optional[float] = None
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    scheduled_departure: Optional[datetime] = None
    scheduled_arrival: Optional[datetime] = None
    actual_departure: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    status: Optional[str] = None
    expected_fuel_liters: Optional[float] = None
    actual_fuel_liters: Optional[float] = None
    fuel_cost_inr: Optional[float] = None
    co2_emissions_kg: Optional[float] = None
    traffic_condition: Optional[str] = None
    weather_condition: Optional[str] = None
    payload_kg: Optional[float] = None
    avg_speed_kmh: Optional[float] = None
    idle_time_min: Optional[float] = None
    road_type: Optional[str] = None
    notes: Optional[str] = None


class TripOut(TripBase):
    id: int
    trip_code: str
    actual_departure: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    expected_fuel_liters: Optional[float] = None
    actual_fuel_liters: Optional[float] = None
    fuel_cost_inr: Optional[float] = None
    co2_emissions_kg: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
