"""
Digital Twin & What-If Simulation API Router.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.optimization.qubo_formulator import VehicleInfo, TripInfo
from app.optimization.digital_twin import get_digital_twin

router = APIRouter(prefix="/api/digital-twin", tags=["Digital Twin & Simulation"])


class SimulationRequest(BaseModel):
    horizon_days: int = Field(7, ge=1, le=30)
    weather_condition: str = "moderate_rain"  # "clear", "moderate_rain", "heavy_monsoon"
    demand_surge_pct: float = Field(15.0, ge=0.0, le=100.0)
    random_seed: int = 42


@router.post("/simulate")
def run_digital_twin_simulation(
    request: SimulationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    v_db = db.query(Vehicle).filter(Vehicle.is_active == True).limit(10).all()
    t_db = db.query(Trip).filter(Trip.status.in_(["planned", "active"])).limit(10).all()

    vehicles = [
        VehicleInfo(
            id=v.id,
            registration_number=v.registration_number,
            vehicle_type=v.vehicle_type,
            fuel_type=v.fuel_type or "diesel",
            weight_kg=float(v.weight_kg or 1500.0),
            engine_cc=float(v.engine_cc or 1500.0),
            baseline_mileage_kmpl=float(v.baseline_mileage_kmpl or 14.0),
            is_available=v.status == "available",
            vehicle_age=2026 - (v.year or 2020),
        )
        for v in v_db
    ]

    trips = [
        TripInfo(
            id=t.id,
            trip_code=t.trip_code,
            origin=t.origin,
            destination=t.destination,
            distance_km=float(t.distance_km),
            payload_kg=float(t.payload_kg or 500.0),
            traffic_condition=t.traffic_condition or "medium",
            road_type=t.road_type or "mixed",
        )
        for t in t_db
    ]

    if not vehicles:
        vehicles = [
            VehicleInfo(1, "KA-01-TR-1001", "Heavy Truck", "diesel", 3500.0, 3200.0, 11.5, True, 4),
            VehicleInfo(2, "KA-02-EV-2002", "Electric Van", "electric", 1800.0, 0.0, 32.0, True, 1),
            VehicleInfo(3, "KA-03-HY-3003", "Hybrid Van", "hybrid", 2100.0, 1800.0, 18.0, True, 2),
        ]
    if not trips:
        trips = [
            TripInfo(1, "TRP-101", "Whitefield", "Electronic City", 45.0, 600.0, "medium", "urban"),
            TripInfo(2, "TRP-102", "Whitefield", "Koramangala", 32.0, 450.0, "high", "mixed"),
        ]

    simulator = get_digital_twin()
    try:
        sim_res = simulator.run_simulation(
            vehicles=vehicles,
            trips=trips,
            horizon_days=request.horizon_days,
            weather_condition=request.weather_condition,
            demand_surge_pct=request.demand_surge_pct,
            random_seed=request.random_seed,
        )
        return sim_res.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Digital Twin simulation failed: {str(e)}")
