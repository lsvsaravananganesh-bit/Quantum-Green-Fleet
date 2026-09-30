from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class DriverBase(BaseModel):
    employee_id: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    experience_years: Optional[int] = 0
    status: Optional[str] = "active"


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    experience_years: Optional[int] = None
    status: Optional[str] = None


class DriverOut(DriverBase):
    id: int
    total_trips: int = 0
    total_distance_km: float = 0.0
    avg_fuel_efficiency: Optional[float] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
