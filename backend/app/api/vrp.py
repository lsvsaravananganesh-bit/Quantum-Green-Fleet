"""
VRP (Vehicle Routing Problem) API Router.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.vehicle import Vehicle
from app.optimization.vrp_solver import (
    get_vrp_solver,
    VRPStop,
    VRPVehicle,
    DEFAULT_DEPOT,
    DEFAULT_STOPS,
)

router = APIRouter(prefix="/api/vrp", tags=["Vehicle Routing Problem"])


class VRPStopIn(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    demand_kg: float
    time_window_start: float
    time_window_end: float
    service_duration_min: float = 20.0


class VRPVehicleIn(BaseModel):
    id: int
    registration_number: str
    vehicle_type: str
    capacity_kg: float
    fuel_type: str = "diesel"
    baseline_mileage_kmpl: float = 14.0
    avg_speed_kmh: float = 38.0
    start_time_hr: float = 7.0


class VRPSolveRequest(BaseModel):
    algorithm: str = "clarke_wright_2opt"  # or "qubo_vrp"
    depot: Optional[VRPStopIn] = None
    stops: Optional[List[VRPStopIn]] = None
    vehicles: Optional[List[VRPVehicleIn]] = None


@router.get("/demo-data")
def get_vrp_demo_data(current_user=Depends(get_current_user)):
    """Returns curated Bangalore logistics hub demo nodes and fleet vehicles."""
    default_vehicles = [
        {"id": 1, "registration_number": "KA-01-TR-8810", "vehicle_type": "Medium Cargo Truck", "capacity_kg": 1800.0, "fuel_type": "diesel", "baseline_mileage_kmpl": 12.5, "avg_speed_kmh": 36.0, "start_time_hr": 7.0},
        {"id": 2, "registration_number": "KA-02-EV-4420", "vehicle_type": "Electric Delivery Van", "capacity_kg": 1200.0, "fuel_type": "electric", "baseline_mileage_kmpl": 35.0, "avg_speed_kmh": 40.0, "start_time_hr": 7.0},
        {"id": 3, "registration_number": "KA-03-HY-5530", "vehicle_type": "Hybrid Urban Van", "capacity_kg": 1400.0, "fuel_type": "hybrid", "baseline_mileage_kmpl": 18.0, "avg_speed_kmh": 38.0, "start_time_hr": 7.5},
    ]
    return {
        "depot": DEFAULT_DEPOT,
        "stops": DEFAULT_STOPS,
        "vehicles": default_vehicles,
    }


@router.post("/solve")
def solve_vrp(
    request: VRPSolveRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    solver = get_vrp_solver()

    # Use supplied or default depot
    if request.depot:
        depot = VRPStop(**request.depot.model_dump())
    else:
        depot = VRPStop(**DEFAULT_DEPOT)

    # Use supplied or default stops
    if request.stops:
        stops = [VRPStop(**s.model_dump()) for s in request.stops]
    else:
        stops = [VRPStop(**s) for s in DEFAULT_STOPS]

    # Use supplied vehicles or query from DB / defaults
    if request.vehicles:
        vehicles = [VRPVehicle(**v.model_dump()) for v in request.vehicles]
    else:
        db_vehicles = db.query(Vehicle).filter(Vehicle.is_active == True).limit(3).all()
        if db_vehicles:
            vehicles = [
                VRPVehicle(
                    id=v.id,
                    registration_number=v.registration_number,
                    vehicle_type=v.vehicle_type,
                    capacity_kg=float((v.weight_kg or 2500.0) * 0.65),
                    fuel_type=v.fuel_type or "diesel",
                    baseline_mileage_kmpl=float(v.baseline_mileage_kmpl or 14.0),
                    avg_speed_kmh=38.0,
                    start_time_hr=7.0,
                )
                for v in db_vehicles
            ]
        else:
            vehicles = [
                VRPVehicle(id=1, registration_number="KA-01-TR-8810", vehicle_type="Medium Cargo Truck", capacity_kg=1800.0, fuel_type="diesel", baseline_mileage_kmpl=12.5),
                VRPVehicle(id=2, registration_number="KA-02-EV-4420", vehicle_type="Electric Delivery Van", capacity_kg=1200.0, fuel_type="electric", baseline_mileage_kmpl=35.0),
            ]

    try:
        if request.algorithm == "qubo_vrp":
            solution = solver.solve_qubo_vrp(depot, stops, vehicles)
        else:
            solution = solver.solve_clarke_wright_vrp(depot, stops, vehicles)
        return solution.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VRP optimization failed: {str(e)}")
