from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VehicleBase(BaseModel):
    registration_number: str
    vehicle_type: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    fuel_type: str
    engine_cc: Optional[float] = 1500.0
    weight_kg: Optional[float] = 1500.0
    tank_capacity_liters: Optional[float] = 50.0
    baseline_mileage_kmpl: Optional[float] = 15.0
    odometer_km: Optional[float] = 0.0
    status: Optional[str] = "available"
    notes: Optional[str] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    fuel_type: Optional[str] = None
    engine_cc: Optional[float] = None
    weight_kg: Optional[float] = None
    tank_capacity_liters: Optional[float] = None
    baseline_mileage_kmpl: Optional[float] = None
    odometer_km: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    assigned_driver_id: Optional[int] = None


class VehicleOut(VehicleBase):
    id: int
    assigned_driver_id: Optional[int] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
